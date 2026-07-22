import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const blog = new Hono()
  // Public: list published posts (or all, for admin, via ?all=true + auth)
  .get("/", async (c) => {
    const all = c.req.query("all") === "true";
    const category = c.req.query("category");

    if (all) {
      // admin view — must be authed
      const rows = await db
        .select()
        .from(schema.posts)
        .orderBy(desc(schema.posts.createdAt));
      return c.json({ posts: rows }, 200);
    }

    const conditions = [eq(schema.posts.published, true)];
    if (category && category !== "All") {
      conditions.push(eq(schema.posts.category, category));
    }

    const rows = await db
      .select()
      .from(schema.posts)
      .where(and(...conditions))
      .orderBy(desc(schema.posts.createdAt));

    return c.json({ posts: rows }, 200);
  })
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const [post] = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.slug, slug));
    if (!post) return c.json({ error: "Not found" }, 404);
    return c.json({ post }, 200);
  })
  .post("/", requireAuth, async (c) => {
    const body = await c.req.json();
    const slug = body.slug ? slugify(body.slug) : slugify(body.title);
    const [post] = await db
      .insert(schema.posts)
      .values({
        title: body.title,
        slug,
        excerpt: body.excerpt ?? "",
        body: body.body ?? "",
        coverImage: body.coverImage ?? "",
        affiliateLinks: JSON.stringify(body.affiliateLinks ?? []),
        category: body.category ?? "General",
        published: body.published ?? false,
      })
      .returning();
    return c.json({ post }, 201);
  })
  .put("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const slug = body.slug ? slugify(body.slug) : undefined;
    const [post] = await db
      .update(schema.posts)
      .set({
        title: body.title,
        ...(slug ? { slug } : {}),
        excerpt: body.excerpt,
        body: body.body,
        coverImage: body.coverImage,
        affiliateLinks: JSON.stringify(body.affiliateLinks ?? []),
        category: body.category,
        published: body.published,
        updatedAt: new Date(),
      })
      .where(eq(schema.posts.id, id))
      .returning();
    return c.json({ post }, 200);
  })
  .delete("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
    return c.json({ success: true }, 200);
  });
