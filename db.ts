import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export const dbPath = (process.env.DATABASE_URL ?? "file:./data/keystone.db").replace(/^file:/, "");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Tables are created on first boot, so there is no separate migration step.
sqlite.exec(`
CREATE TABLE IF NOT EXISTS user (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, emailVerified integer NOT NULL DEFAULT 0, image text, createdAt date NOT NULL, updatedAt date NOT NULL);
CREATE TABLE IF NOT EXISTS session (id text PRIMARY KEY, expiresAt date NOT NULL, token text NOT NULL UNIQUE, createdAt date NOT NULL, updatedAt date NOT NULL, ipAddress text, userAgent text, userId text NOT NULL REFERENCES user(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS account (id text PRIMARY KEY, accountId text NOT NULL, providerId text NOT NULL, userId text NOT NULL REFERENCES user(id) ON DELETE CASCADE, accessToken text, refreshToken text, idToken text, accessTokenExpiresAt date, refreshTokenExpiresAt date, scope text, password text, createdAt date NOT NULL, updatedAt date NOT NULL);
CREATE TABLE IF NOT EXISTS verification (id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, expiresAt date NOT NULL, createdAt date, updatedAt date);
CREATE TABLE IF NOT EXISTS subscriptions (user_id text PRIMARY KEY, stripe_customer_id text NOT NULL, stripe_subscription_id text, plan text NOT NULL DEFAULT 'pro', status text NOT NULL DEFAULT 'incomplete', current_period_end integer, updated_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS stripe_events (id text PRIMARY KEY, created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS hot_leads (id integer PRIMARY KEY AUTOINCREMENT, user_id text NOT NULL, business_name text NOT NULL, contact_name text, email text, phone text, website text, industry text, city text, signals text NOT NULL DEFAULT '[]', score integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'new', created_at integer NOT NULL, updated_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS prospects (id integer PRIMARY KEY AUTOINCREMENT, user_id text NOT NULL, business_name text NOT NULL, contact_name text, email text, phone text, website text, industry text, city text, stage text NOT NULL DEFAULT 'new', deal_value integer, notes text, created_at integer NOT NULL, updated_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS ai_usage (user_id text NOT NULL, day text NOT NULL, n integer NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day));
CREATE TABLE IF NOT EXISTS leads (id integer PRIMARY KEY AUTOINCREMENT, name text NOT NULL, email text NOT NULL, company text, interest text NOT NULL, message text, status text NOT NULL DEFAULT 'new', created_at integer NOT NULL);
`);

export const db = drizzle(sqlite, { schema });
