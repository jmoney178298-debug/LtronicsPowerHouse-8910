import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const PRINTFUL_API = "https://api.printful.com";
const STORE_ID = process.env.PRINTFUL_STORE_ID || "18333068";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function pf(path: string, opts?: RequestInit) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${PRINTFUL_API}${path}${sep}store_id=${STORE_ID}`, {
    ...opts,
    headers: { ...getHeaders(), ...(opts?.headers as any) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Printful API error ${res.status}`);
  return json;
}

// Map Printful product → our DB shape
function mapProduct(pfProd: any) {
  // API returns { sync_product: {...}, sync_variants: [...] }
  const product = pfProd.sync_product ?? pfProd;
  const variants = pfProd.sync_variants ?? [];
  const variant = variants[0];
  // Pick best image: preview file > thumbnail_url
  const previewFile = variant?.files?.find((f: any) => f.type === "preview");
  const imageUrl = previewFile?.preview_url || product.thumbnail_url || "";
  // Determine category from main_category_id or product name
  const name: string = product.name || "";
  let category = "T-Shirts";
  if (/hoodie/i.test(name)) category = "Hoodies/Sweatshirts";
  else if (/crop/i.test(name)) category = "Hoodies/Sweatshirts";
  else if (/hat|cap|beanie/i.test(name)) category = "Hats/Caps";
  else if (/jacket/i.test(name)) category = "Hoodies/Sweatshirts";

  // Parse real size/color variants from Printful's variant name pattern:
  // "{Product name} / {Color} / {Size}"
  const variantsData = variants.map((v: any) => {
    const parts = String(v.name || "").split("/").map((s: string) => s.trim());
    const color = parts.length >= 3 ? parts[1] : "";
    const size = parts.length >= 3 ? parts[2] : parts[1] || "";
    const vPreview = v.files?.find((f: any) => f.type === "preview");
    return {
      variantId: String(v.variant_id),
      size,
      color,
      price: parseFloat(v.retail_price || "0"),
      inStock: true,
      imageUrl: vPreview?.preview_url || imageUrl,
    };
  });

  return {
    name,
    description: name,
    price: variant ? parseFloat(variant.retail_price || "0") : 0,
    category,
    imageUrl,
    stock: 99, // Printful handles fulfillment
    featured: false,
    source: "printful" as const,
    printfulId: String(product.id),
    variantsData: JSON.stringify(variantsData),
  };
}

let lastSyncTime: Date | null = null;

export const printful = new Hono()
  // GET /api/printful/status
  .get("/status", async (c) => {
    const products = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.source, "printful"));

    return c.json({
      connected: true,
      storeId: STORE_ID,
      printfulProducts: products.length,
      lastSync: lastSyncTime?.toISOString() ?? null,
    });
  })

  // POST /api/printful/sync — pull from Printful, upsert into DB
  .post("/sync", requireAuth, async (c) => {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      return c.json({ error: "PRINTFUL_API_KEY not set in environment", synced: 0 }, 500);
    }
    let data: any;
    try {
      data = await pf("/store/products");
    } catch (err: any) {
      console.error("[printful sync]", err);
      return c.json({ error: err.message, synced: 0 }, 500);
    }

    const pfProducts: any[] = data.result ?? [];

    if (pfProducts.length === 0) {
      return c.json({
        synced: 0,
        message: "No products found — create products in your Printful dashboard first.",
      });
    }

    // Fetch full product details (for variants + pricing)
    const details = await Promise.allSettled(
      pfProducts.map((p: any) => pf(`/store/products/${p.id}`))
    );

    let synced = 0;
    let errors = 0;

    for (const result of details) {
      if (result.status === "rejected") { errors++; continue; }
      const pfProd = result.value?.result;
      if (!pfProd) continue;

      const mapped = mapProduct(pfProd);

      // Check if already in DB
      const existing = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.printfulId, mapped.printfulId))
        .limit(1);

      if (existing.length > 0) {
        // Update price + image + variants only (don't overwrite admin edits to name/category)
        await db
          .update(schema.products)
          .set({ price: mapped.price, imageUrl: mapped.imageUrl, variantsData: mapped.variantsData })
          .where(eq(schema.products.printfulId, mapped.printfulId));
      } else {
        await db.insert(schema.products).values(mapped);
      }
      synced++;
    }

    lastSyncTime = new Date();

    return c.json({
      synced,
      errors,
      message: `Synced ${synced} product${synced !== 1 ? "s" : ""} from Printful.`,
      lastSync: lastSyncTime.toISOString(),
    });
  });

// Helper used by checkout to create a Printful order after payment
export async function createPrintfulOrder(order: any, items: any[]) {
  const printfulItems = items
    .filter((i) => i.source === "printful" && i.printfulId)
    .map((i) =>
      i.variantId
        ? {
            // Real variant selected (size/color) — use it for accurate fulfillment
            sync_variant_id: parseInt(i.variantId),
            quantity: i.qty,
            retail_price: String(i.price),
          }
        : {
            // Fallback: no variant chosen, use base sync product (first variant)
            sync_product_id: parseInt(i.printfulId),
            quantity: i.qty,
            retail_price: String(i.price),
          }
    );

  if (printfulItems.length === 0) return null;

  // Parse shipping from stored address string
  const addressLine = order.shippingAddress || "";

  const body = {
    recipient: {
      name: order.shippingName || "Customer",
      address1: addressLine,
      city: "",
      state_code: "",
      country_code: "US",
      zip: "",
    },
    items: printfulItems,
    retail_costs: {
      currency: "USD",
      subtotal: String(order.total),
      total: String(order.total),
    },
  };

  try {
    const res = await pf("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.result;
  } catch (err: any) {
    console.error("Printful order creation failed:", err.message);
    return null;
  }
}
