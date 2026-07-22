import { Hono } from "hono";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";
import { requireAuth } from "../middleware/auth";

export const upload = new Hono()
  .post("/presign", requireAuth, async (c) => {
    const { filename, contentType } = await c.req.json();
    const key = `products/${Date.now()}-${filename}`;

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );

    // Bucket is private — serve images through our own proxy route (relative
    // path so it works on any domain/preview URL) instead of a raw bucket URL.
    const publicUrl = `/api/upload/file/${encodeURIComponent(key)}`;
    return c.json({ url, key, publicUrl }, 200);
  })
  // Public, but scoped: only for customer-submitted custom-request reference images.
  // Restricted to image content types and a separate S3 prefix, no auth required.
  .post("/customer-presign", async (c) => {
    const { filename, contentType } = await c.req.json();
    if (!contentType || !String(contentType).startsWith("image/")) {
      return c.json({ error: "Only image uploads are allowed" }, 400);
    }
    const safeName = String(filename || "reference").replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `custom-requests/${Date.now()}-${safeName}`;

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );

    const publicUrl = `/api/upload/file/${encodeURIComponent(key)}`;
    return c.json({ url, key, publicUrl }, 200);
  })
  .get("/file/*", async (c) => {
    const key = decodeURIComponent(c.req.path.replace("/api/upload/file/", ""));
    try {
      const obj = await s3.send(
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
      );
      const body = await obj.Body?.transformToByteArray();
      if (!body) return c.json({ error: "Not found" }, 404);
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": obj.ContentType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      return c.json({ error: "Not found" }, 404);
    }
  });
