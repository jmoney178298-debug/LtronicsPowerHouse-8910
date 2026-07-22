import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: real("price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  images: text("images").notNull().default("[]"), // JSON array of extra image URLs (gallery)
  stock: integer("stock").notNull().default(0),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  source: text("source").notNull().default("manual"), // "manual" | "printful"
  printfulId: text("printful_id"),                    // Printful product ID for dedup
  variantsData: text("variants_data").notNull().default("[]"), // JSON: real Printful variants [{variantId,size,color,price,inStock}] or manual [{size,color}]
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending | paid | cancelled
  total: real("total").notNull(),
  shippingName: text("shipping_name").default(""),
  shippingAddress: text("shipping_address").default(""),
  promoCode: text("promo_code").default(""),
  discountPercent: real("discount_percent").default(0),
  storeCreditUsed: real("store_credit_used").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image").notNull().default(""),
  qty: integer("qty").notNull(),
  price: real("price").notNull(),
  variantId: text("variant_id").default(""),
  size: text("size").default(""),
  color: text("color").default(""),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""), // markdown
  coverImage: text("cover_image").notNull().default(""),
  affiliateLinks: text("affiliate_links").notNull().default("[]"), // JSON [{label,url}]
  category: text("category").notNull().default("General"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const promoCodes = sqliteTable("promo_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // stored uppercase
  percentOff: real("percent_off").notNull(), // 0-100, 100 = free
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const customRequests = sqliteTable("custom_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").default(""),
  description: text("description").notNull().default(""),
  referenceImage: text("reference_image").default(""),
  status: text("status").notNull().default("new"), // new | quoted | paid | closed
  quotedAmount: real("quoted_amount"),
  paymentLinkUrl: text("payment_link_url").default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const referralAccounts = sqliteTable("referral_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referralId: text("referral_id").notNull().unique(), // client-generated UUID, no login required
  storeCredit: real("store_credit").notNull().default(0),
  shareClaimed: integer("share_claimed", { mode: "boolean" }).notNull().default(false),
  newcomerClaimed: integer("newcomer_claimed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const referralVisits = sqliteTable("referral_visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referralCode: text("referral_code").notNull(), // the sharer's referralId from ?ref=
  newVisitorId: text("new_visitor_id").notNull().unique(),
  rewarded: integer("rewarded", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cashoutRequests = sqliteTable("cashout_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referralId: text("referral_id").notNull(),
  amount: real("amount").notNull(),
  method: text("method").notNull(), // 'cashapp' | 'bank'
  destination: text("destination").notNull(), // cashtag or bank details text
  status: text("status").notNull().default("pending"), // pending | paid | rejected
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export * from "./auth-schema";
