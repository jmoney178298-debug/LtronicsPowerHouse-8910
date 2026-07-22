import { Hono } from "hono";
import { Client as SquareClient, Environment as SquareEnvironment } from "square";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createPrintfulOrder } from "./printful";

function getSquare() {
  return new SquareClient({
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
  });
}

export const checkout = new Hono()
  .post("/create-session", async (c) => {
    const { items, successUrl, cancelUrl, promoCode, useStoreCredit } = await c.req.json();

    if (!items || items.length === 0) {
      return c.json({ error: "Cart is empty" }, 400);
    }

    // Validate promo code server-side — never trust a client-supplied discount
    let percentOff = 0;
    let appliedCode = "";
    if (promoCode) {
      const normalized = String(promoCode).trim().toUpperCase();
      const [row] = await db
        .select()
        .from(schema.promoCodes)
        .where(eq(schema.promoCodes.code, normalized))
        .limit(1);
      if (row && row.active) {
        percentOff = row.percentOff;
        appliedCode = row.code;
      } else {
        return c.json({ error: "Invalid or expired promo code" }, 400);
      }
    }

    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0);
    let discountedTotal = Math.max(0, subtotal * (1 - percentOff / 100));

    // Validate + apply store credit server-side — never trust a client-supplied amount
    let creditApplied = 0;
    let creditReferralId = "";
    if (useStoreCredit?.referralId && useStoreCredit?.amount > 0) {
      const [account] = await db
        .select()
        .from(schema.referralAccounts)
        .where(eq(schema.referralAccounts.referralId, useStoreCredit.referralId))
        .limit(1);
      if (!account || account.storeCredit <= 0) {
        return c.json({ error: "No store credit available" }, 400);
      }
      creditApplied = Math.min(account.storeCredit, Number(useStoreCredit.amount), discountedTotal);
      creditReferralId = useStoreCredit.referralId;
      discountedTotal = Math.max(0, discountedTotal - creditApplied);

      // Deduct immediately — session creation means they're committing to this checkout
      await db
        .update(schema.referralAccounts)
        .set({ storeCredit: account.storeCredit - creditApplied })
        .where(eq(schema.referralAccounts.referralId, useStoreCredit.referralId));
    }

    // 100% off (or rounds to $0) — skip Square entirely, mark paid directly, fulfill via Printful
    if (percentOff >= 100 || discountedTotal <= 0) {
      const freeOrderId = randomUUID();
      const [order] = await db
        .insert(schema.orders)
        .values({
          stripeSessionId: freeOrderId,
          email: "",
          status: "paid",
          total: 0,
          shippingName: "",
          shippingAddress: "",
          promoCode: appliedCode,
          discountPercent: percentOff,
          storeCreditUsed: creditApplied,
        })
        .returning();

      const itemsWithSource = [];
      for (const item of items) {
        await db.insert(schema.orderItems).values({
          orderId: order.id,
          productId: item.id,
          productName: item.name,
          productImage: item.imageUrl ?? "",
          qty: item.qty,
          price: item.price,
          variantId: item.variantId ?? "",
          size: item.size ?? "",
          color: item.color ?? "",
        });
        const [product] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.id))
          .limit(1);
        itemsWithSource.push({
          ...item,
          productId: item.id,
          qty: item.qty,
          price: item.price,
          variantId: item.variantId ?? "",
          source: product?.source ?? "manual",
          printfulId: product?.printfulId ?? null,
        });
      }

      createPrintfulOrder(order, itemsWithSource).catch((e) =>
        console.error("Printful fulfillment (free order) failed:", e)
      );

      const redirectUrl = `${successUrl || `${process.env.WEBSITE_URL || ""}/order-success`}?session_id=${freeOrderId}`;
      return c.json({ url: redirectUrl, free: true, linkId: freeOrderId }, 200);
    }

    const client = getSquare();
    const idempotencyKey = randomUUID();

    const lineItems = items.map((item: any) => ({
      name: item.name,
      quantity: String(item.qty),
      basePriceMoney: {
        amount: BigInt(Math.round(item.price * 100)),
        currency: "USD",
      },
    }));

    const discounts: any[] = [];
    if (percentOff > 0) {
      discounts.push({
        name: `Promo: ${appliedCode} (${percentOff}% off)`,
        percentage: String(percentOff),
        scope: "ORDER" as const,
      });
    }
    if (creditApplied > 0) {
      discounts.push({
        name: "Store Credit",
        amountMoney: {
          amount: BigInt(Math.round(creditApplied * 100)),
          currency: "USD",
        },
        scope: "ORDER" as const,
      });
    }

    try {
      const apiResponse = await client.checkoutApi.createPaymentLink({
        idempotencyKey,
        order: {
          locationId: process.env.SQUARE_LOCATION_ID!,
          lineItems,
          ...(discounts.length > 0 ? { discounts } : {}),
        },
        checkoutOptions: {
          redirectUrl: successUrl || `${process.env.WEBSITE_URL || ""}/order-success`,
          askForShippingAddress: true,
          acceptedPaymentMethods: {
            applePay: true,
            googlePay: true,
            cashAppPay: true,
            afterpayClearpay: false,
          },
        },
        prePopulatedData: {},
      });

      const paymentLink = apiResponse.result?.paymentLink;

      if (!paymentLink?.url) {
        return c.json({ error: "Failed to create payment link" }, 500);
      }

      // Store pending order
      const [order] = await db
        .insert(schema.orders)
        .values({
          stripeSessionId: paymentLink.id!, // reusing field for Square link ID
          email: "",
          status: "pending",
          total: discountedTotal,
          shippingName: "",
          shippingAddress: "",
          promoCode: appliedCode,
          discountPercent: percentOff,
          storeCreditUsed: creditApplied,
        })
        .returning();

      for (const item of items) {
        await db.insert(schema.orderItems).values({
          orderId: order.id,
          productId: item.id,
          productName: item.name,
          productImage: item.imageUrl ?? "",
          qty: item.qty,
          price: item.price,
          variantId: item.variantId ?? "",
          size: item.size ?? "",
          color: item.color ?? "",
        });
      }

      return c.json({ url: paymentLink.url, linkId: paymentLink.id }, 200);
    } catch (err: any) {
      // Roll back any store credit we deducted since the session was never created
      if (creditApplied > 0 && creditReferralId) {
        const [account] = await db
          .select()
          .from(schema.referralAccounts)
          .where(eq(schema.referralAccounts.referralId, creditReferralId))
          .limit(1);
        if (account) {
          await db
            .update(schema.referralAccounts)
            .set({ storeCredit: account.storeCredit + creditApplied })
            .where(eq(schema.referralAccounts.referralId, creditReferralId));
        }
      }
      console.error("Square checkout error:", err?.result ?? err?.body ?? err);
      const message =
        err?.result?.errors?.[0]?.detail ||
        err?.body?.errors?.[0]?.detail ||
        err?.message ||
        "Payment setup failed";
      return c.json({ error: message }, 500);
    }
  })
  .post("/webhook", async (c) => {
    // Square webhook for payment completion
    const body = await c.req.json();

    try {
      if (body.type === "payment.completed" || body.type === "order.fulfillment.updated") {
        const orderId = body.data?.object?.order_id || body.data?.id;

        if (orderId) {
          await db
            .update(schema.orders)
            .set({ status: "paid" })
            .where(eq(schema.orders.stripeSessionId, orderId));

          // Auto-fulfill any Printful items in this order
          const [order] = await db
            .select()
            .from(schema.orders)
            .where(eq(schema.orders.stripeSessionId, orderId))
            .limit(1);

          if (order) {
            const items = await db
              .select()
              .from(schema.orderItems)
              .where(eq(schema.orderItems.orderId, order.id));

            // Get product source info for each item
            const itemsWithSource = await Promise.all(
              items.map(async (item) => {
                const [product] = await db
                  .select()
                  .from(schema.products)
                  .where(eq(schema.products.id, item.productId))
                  .limit(1);
                return {
                  ...item,
                  source: product?.source ?? "manual",
                  printfulId: product?.printfulId ?? null,
                };
              })
            );

            await createPrintfulOrder(order, itemsWithSource);
          }
        }
      }
      return c.json({ received: true }, 200);
    } catch (err) {
      console.error("Webhook error:", err);
      return c.json({ error: "Webhook error" }, 400);
    }
  });
