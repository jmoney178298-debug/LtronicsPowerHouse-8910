import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const promo = new Hono()
  // Admin: list all codes
  .get("/", requireAuth, async (c) => {
    const rows = await db.select().from(schema.promoCodes);
    return c.json({ codes: rows }, 200);
  })
  // Admin: create a code
  .post("/", requireAuth, async (c) => {
    const body = await c.req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const percentOff = Number(body.percentOff);
    if (!code || isNaN(percentOff) || percentOff <= 0 || percentOff > 100) {
      return c.json({ error: "Invalid code or percentOff (must be 1-100)" }, 400);
    }
    try {
      const [row] = await db
        .insert(schema.promoCodes)
        .values({ code, percentOff, active: body.active ?? true })
        .returning();
      return c.json({ code: row }, 201);
    } catch (err: any) {
      return c.json({ error: "Code already exists" }, 409);
    }
  })
  // Admin: toggle/update a code
  .put("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [row] = await db
      .update(schema.promoCodes)
      .set({
        ...(body.percentOff !== undefined ? { percentOff: Number(body.percentOff) } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      })
      .where(eq(schema.promoCodes.id, id))
      .returning();
    return c.json({ code: row }, 200);
  })
  // Admin: delete a code
  .delete("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    return c.json({ success: true }, 200);
  })
  // Public: validate a code at checkout
  .post("/validate", async (c) => {
    const body = await c.req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return c.json({ valid: false, error: "Enter a code" }, 400);

    const [row] = await db
      .select()
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.code, code))
      .limit(1);

    if (!row || !row.active) {
      return c.json({ valid: false, error: "Invalid or expired code" }, 404);
    }

    return c.json({ valid: true, code: row.code, percentOff: row.percentOff }, 200);
  });
