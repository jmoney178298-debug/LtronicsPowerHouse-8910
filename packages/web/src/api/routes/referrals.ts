import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const SHARE_REWARD = 50;
const NEWCOMER_REWARD = 20;

async function getOrCreateAccount(referralId: string) {
  const [existing] = await db
    .select()
    .from(schema.referralAccounts)
    .where(eq(schema.referralAccounts.referralId, referralId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.referralAccounts)
    .values({ referralId })
    .returning();
  return created;
}

export const referrals = new Hono()
  // Public: register/ensure a visitor has an account (no login required)
  .post("/register", async (c) => {
    const { referralId } = await c.req.json();
    if (!referralId) return c.json({ error: "referralId required" }, 400);
    const account = await getOrCreateAccount(referralId);
    return c.json({ account }, 200);
  })

  // Public: claim the one-time $50 share reward
  .post("/share", async (c) => {
    const { referralId } = await c.req.json();
    if (!referralId) return c.json({ error: "referralId required" }, 400);

    const account = await getOrCreateAccount(referralId);
    if (account.shareClaimed) {
      return c.json({ error: "Share reward already claimed", account }, 400);
    }

    const [updated] = await db
      .update(schema.referralAccounts)
      .set({ storeCredit: account.storeCredit + SHARE_REWARD, shareClaimed: true })
      .where(eq(schema.referralAccounts.referralId, referralId))
      .returning();

    return c.json({ account: updated, rewarded: SHARE_REWARD }, 200);
  })

  // Public: track a new visitor arriving via a ?ref= link, grant one-time $20
  .post("/track-visit", async (c) => {
    const { referralCode, newVisitorId } = await c.req.json();
    if (!referralCode || !newVisitorId) {
      return c.json({ error: "referralCode and newVisitorId required" }, 400);
    }
    if (referralCode === newVisitorId) {
      return c.json({ rewarded: false, reason: "self-referral" }, 200);
    }

    // Dedup: this visitor can only ever claim the newcomer bonus once, regardless of code
    const [existingVisit] = await db
      .select()
      .from(schema.referralVisits)
      .where(eq(schema.referralVisits.newVisitorId, newVisitorId))
      .limit(1);
    if (existingVisit) {
      return c.json({ rewarded: false, reason: "already claimed" }, 200);
    }

    await db.insert(schema.referralVisits).values({
      referralCode,
      newVisitorId,
      rewarded: true,
    });

    const account = await getOrCreateAccount(newVisitorId);
    const [updated] = await db
      .update(schema.referralAccounts)
      .set({ storeCredit: account.storeCredit + NEWCOMER_REWARD, newcomerClaimed: true })
      .where(eq(schema.referralAccounts.referralId, newVisitorId))
      .returning();

    return c.json({ account: updated, rewarded: NEWCOMER_REWARD }, 200);
  })

  // Public: check balance
  .get("/balance/:referralId", async (c) => {
    const referralId = c.req.param("referralId");
    const account = await getOrCreateAccount(referralId);
    return c.json({ account }, 200);
  })

  // Public: request a cashout — notifies admin, does not auto-transfer funds
  .post("/cashout", async (c) => {
    const body = await c.req.json();
    const { referralId, method, destination, amount } = body;
    if (!referralId || !method || !destination || !amount) {
      return c.json({ error: "referralId, method, destination, amount required" }, 400);
    }
    const account = await getOrCreateAccount(referralId);
    if (amount > account.storeCredit) {
      return c.json({ error: "Amount exceeds available store credit" }, 400);
    }

    const [request] = await db
      .insert(schema.cashoutRequests)
      .values({ referralId, amount, method, destination })
      .returning();

    // Hold the funds — subtract from spendable balance while the request is pending
    await db
      .update(schema.referralAccounts)
      .set({ storeCredit: account.storeCredit - amount })
      .where(eq(schema.referralAccounts.referralId, referralId));

    return c.json({ request }, 201);
  })

  // Admin: list all referral accounts
  .get("/", requireAuth, async (c) => {
    const accounts = await db.select().from(schema.referralAccounts);
    return c.json({ accounts }, 200);
  })

  // Admin: list cashout requests
  .get("/cashouts", requireAuth, async (c) => {
    const requests = await db.select().from(schema.cashoutRequests);
    return c.json({ requests }, 200);
  })

  // Admin: mark a cashout paid or rejected
  .put("/cashouts/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const { status } = await c.req.json();
    if (!["paid", "rejected", "pending"].includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const [request] = await db
      .select()
      .from(schema.cashoutRequests)
      .where(eq(schema.cashoutRequests.id, id))
      .limit(1);
    if (!request) return c.json({ error: "Not found" }, 404);

    // If rejecting a previously-pending request, refund the held credit back
    if (status === "rejected" && request.status === "pending") {
      const account = await getOrCreateAccount(request.referralId);
      await db
        .update(schema.referralAccounts)
        .set({ storeCredit: account.storeCredit + request.amount })
        .where(eq(schema.referralAccounts.referralId, request.referralId));
    }

    const [updated] = await db
      .update(schema.cashoutRequests)
      .set({ status })
      .where(eq(schema.cashoutRequests.id, id))
      .returning();

    return c.json({ request: updated }, 200);
  });
