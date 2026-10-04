import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

const createdAt = () => integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date());
const updatedAt = () => integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date());

export const subscriptions = sqliteTable("subscriptions", {
  userId: text("user_id").primaryKey(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("pro"),
  status: text("status").notNull().default("incomplete"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  updatedAt: updatedAt(),
});

export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  createdAt: createdAt(),
});

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
  signals: text("signals", { mode: "json" }).$type<string[]>().notNull().default([]),
  score: integer("score").notNull().default(0),
  status: text("status").notNull().default("new"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const prospects = sqliteTable("prospects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  industry: text("industry"),
  city: text("city"),
  stage: text("stage").notNull().default("new"),
  dealValue: integer("deal_value"),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  interest: text("interest").notNull(),
  message: text("message"),
  status: text("status").notNull().default("new"),
  createdAt: createdAt(),
});

/** Daily AI request counter per user (cost control). */
export const aiUsage = sqliteTable("ai_usage", {
  userId: text("user_id").notNull(),
  day: text("day").notNull(),
  n: integer("n").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.day] })]);
