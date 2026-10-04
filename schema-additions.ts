// Paste at the bottom of your schema.ts (uses its createdAt() / updatedAt() helpers).

/** One row per user. Stripe is the source of truth; webhooks keep this in sync. */
export const subscriptions = sqliteTable("subscriptions", {
  userId: text("user_id").primaryKey(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("pro"),
  /** incomplete | trialing | active | past_due | canceled | unpaid */
  status: text("status").notNull().default("incomplete"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  updatedAt: updatedAt(),
});

/** Webhook idempotency: Stripe retries events, so each id is processed once. */
export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  createdAt: createdAt(),
});

/** Outbound leads: businesses that need a new site (the Lead finder). */
export const hotLeads = sqliteTable("hot_leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  industry: text("industry"),
  city: text("city"),
  /** JSON array of signal keys, see SIGNALS in backend */
  signals: text("signals", { mode: "json" }).$type<string[]>().notNull().default([]),
  /** number of signals (0-6); 4+ is hot */
  score: integer("score").notNull().default(0),
  /** new | promoted | dead */
  status: text("status").notNull().default("new"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
