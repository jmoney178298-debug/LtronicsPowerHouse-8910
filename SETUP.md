# Keystone backend setup

## 1. Install and migrate
```
npm i stripe
```
1. Paste `schema-additions.ts` at the bottom of `schema.ts`.
2. `npx drizzle-kit generate && npx drizzle-kit migrate`
3. Copy `keystone.ts` into your server folder. Fix the `./db`, `./auth`, `./schema` imports.
4. In your main server file: `app.route("/", keystone)`

## 2. Environment variables
Copy `.env.example` to `.env`. Your domain, owner email and the three plan price IDs are already filled in.
Only `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are left, and only you can copy those from Stripe.
The checkout route takes `{ "plan": "basic" | "pro" | "proplus" }`.
Sign up with the OWNER_EMAIL address. That account is the admin and is never paywalled.

## 3. Stripe dashboard (this is where your bank goes, never in code)
1. Settings > Bank accounts: add your payout account. Stripe pays you out there.
2. Product catalog: create "Keystone Pro", recurring monthly. Copy the price ID into STRIPE_PRICE_ID.
3. Developers > Webhooks: add endpoint `https://your-domain.com/api/stripe/webhook` with events
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret.
4. Settings > Billing > Customer portal: turn it on so users can cancel or update cards.
5. Test with `stripe listen --forward-to localhost:3000/api/stripe/webhook` and card 4242 4242 4242 4242.

## 4. Endpoints
| Route | Who |
|---|---|
| POST /api/billing/checkout | signed in. Returns Stripe Checkout URL |
| POST /api/billing/portal | signed in. Returns billing portal URL |
| GET /api/billing/status | signed in |
| GET/POST/DELETE /api/hot-leads, POST /api/hot-leads/:id/promote | active subscribers + owner |
| GET /api/admin/overview, /subscribers, /hot-leads, /leads, PATCH /leads/:id | owner only |

## 5. Frontend
- Gate paid pages: when an API call returns **402**, send the user to `/app/billing` and call `/api/billing/checkout`.
- Show `/admin/*` only when `/api/billing/status` returns `isAdmin: true`. The server enforces it either way.
- Inbound leads from your marketing site already land in the `leads` table. `/api/admin/leads` is where you work them.

## Notes
- Webhook handling is idempotent (`stripe_events`), so Stripe retries are safe.
- If your auth is not better-auth, replace the `auth.api.getSession` line in `requireUser`.
- Before launch: add rate limiting on `/api/hot-leads` and test a cancelled subscription (status `canceled` is blocked).
