import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const orders = new Hono()
  .get("/", requireAuth, async (c) => {
    const rows = await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));

    const ordersWithItems = await Promise.all(
      rows.map(async (order) => {
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return c.json({ orders: ordersWithItems }, 200);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id));
    if (!order) return c.json({ error: "Not found" }, 404);

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));

    return c.json({ order: { ...order, items } }, 200);
  })
  .get("/by-session/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.stripeSessionId, sessionId));
    if (!order) return c.json({ error: "Not found" }, 404);

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    return c.json({ order: { ...order, items } }, 200);
  });
