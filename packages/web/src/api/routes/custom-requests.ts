import { Hono } from "hono";
import { Client as SquareClient, Environment as SquareEnvironment } from "square";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth";

function getSquare() {
  return new SquareClient({
    accessToken: process.env.SQUARE_ACCESS_TOKEN!,
    environment: SquareEnvironment.Production,
  });
}

export const customRequests = new Hono()
  // Public: submit a custom product request
  .post("/", async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.email || !body.description) {
      return c.json({ error: "name, email, and description are required" }, 400);
    }
    const [request] = await db
      .insert(schema.customRequests)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone ?? "",
        description: body.description,
        referenceImage: body.referenceImage ?? "",
      })
      .returning();
    return c.json({ request }, 201);
  })

  // Admin: list all requests
  .get("/", requireAuth, async (c) => {
    const requests = await db
      .select()
      .from(schema.customRequests);
    return c.json({ requests }, 200);
  })

  // Admin: quote a price — creates a real Square payment link for this custom amount
  .post("/:id/quote", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const { amount } = await c.req.json();
    if (!amount || amount <= 0) return c.json({ error: "Invalid amount" }, 400);

    const [request] = await db
      .select()
      .from(schema.customRequests)
      .where(eq(schema.customRequests.id, id))
      .limit(1);
    if (!request) return c.json({ error: "Not found" }, 404);

    try {
      const client = getSquare();
      const apiResponse = await client.checkoutApi.createPaymentLink({
        idempotencyKey: randomUUID(),
        order: {
          locationId: process.env.SQUARE_LOCATION_ID!,
          lineItems: [
            {
              name: `Custom Order — ${request.name}`,
              quantity: "1",
              basePriceMoney: { amount: BigInt(Math.round(amount * 100)), currency: "USD" },
            },
          ],
        },
        checkoutOptions: {
          redirectUrl: `${process.env.WEBSITE_URL || ""}/order-success`,
          acceptedPaymentMethods: { applePay: true, googlePay: true, cashAppPay: true, afterpayClearpay: false },
        },
      });

      const paymentLink = apiResponse.result?.paymentLink;
      if (!paymentLink?.url) return c.json({ error: "Failed to create payment link" }, 500);

      const [updated] = await db
        .update(schema.customRequests)
        .set({ status: "quoted", quotedAmount: amount, paymentLinkUrl: paymentLink.url })
        .where(eq(schema.customRequests.id, id))
        .returning();

      return c.json({ request: updated }, 200);
    } catch (err: any) {
      console.error("Custom quote error:", err?.result ?? err?.body ?? err);
      return c.json({ error: err?.message || "Failed to create quote" }, 500);
    }
  })

  // Admin: update status (e.g. mark closed)
  .put("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const { status } = await c.req.json();
    const [updated] = await db
      .update(schema.customRequests)
      .set({ status })
      .where(eq(schema.customRequests.id, id))
      .returning();
    return c.json({ request: updated }, 200);
  })

  .delete("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.customRequests).where(eq(schema.customRequests.id, id));
    return c.json({ success: true }, 200);
  });
