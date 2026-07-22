import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, like, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const products = new Hono()
  .get("/", async (c) => {
    const category = c.req.query("category");
    const search = c.req.query("search");
    const featured = c.req.query("featured");

    let query = db.select().from(schema.products);
    const conditions = [];

    if (category && category !== "All") {
      conditions.push(eq(schema.products.category, category));
    }
    if (featured === "true") {
      conditions.push(eq(schema.products.featured, true));
    }

    let rows;
    if (conditions.length > 0) {
      rows = await query.where(and(...conditions)).orderBy(desc(schema.products.createdAt));
    } else {
      rows = await query.orderBy(desc(schema.products.createdAt));
    }

    if (search) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return c.json({ products: rows }, 200);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [product] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id));
    if (!product) return c.json({ error: "Not found" }, 404);
    return c.json({ product }, 200);
  })
  .post("/", requireAuth, async (c) => {
    const body = await c.req.json();
    const [product] = await db
      .insert(schema.products)
      .values({
        name: body.name,
        description: body.description ?? "",
        price: body.price,
        category: body.category,
        imageUrl: body.imageUrl ?? "",
        images: JSON.stringify(body.images ?? []),
        stock: body.stock ?? 0,
        featured: body.featured ?? false,
        variantsData: body.variantsData ?? "[]",
      })
      .returning();
    return c.json({ product }, 201);
  })
  .put("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [product] = await db
      .update(schema.products)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.images !== undefined ? { images: JSON.stringify(body.images) } : {}),
        ...(body.stock !== undefined ? { stock: body.stock } : {}),
        ...(body.featured !== undefined ? { featured: body.featured } : {}),
        ...(body.variantsData !== undefined ? { variantsData: body.variantsData } : {}),
      })
      .where(eq(schema.products.id, id))
      .returning();
    return c.json({ product }, 200);
  })
  .delete("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.products).where(eq(schema.products.id, id));
    return c.json({ success: true }, 200);
  });
