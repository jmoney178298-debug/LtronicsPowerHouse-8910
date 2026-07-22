# Task: Variants, Custom Requests, Referral/Rewards, Real Products, Logo/BG update

## Confirmed decisions (from user answers)
1. Referral reward triggers on SHARE ACTION itself (not purchase) — user accepted fraud-risk
   tradeoff after warning. Mitigate abuse: one-time claim per visitor (dedup via referralId),
   not per-click.
2. Payouts: STORE CREDIT + "Request Cashout" button that notifies admin; admin manually sends
   via CashApp/bank outside the system. No real automated payout integration (correctly scoped
   out — would need Stripe Connect/KYC infra not in place).
3. New real products: pull from Printful catalog (real items). Note: Printful = apparel/accessories
   only, not electronics — will flag this limitation, not fabricate a fake electronics dropship
   integration.
4. OG banner image: use as BOTH new logo AND a background texture/section element.
5. Variants: size/color selectors on all apparel (tees, hoodies, hats, crop hoodie).

## Plan
### A. Product variants (size/color)
- Upgrade Printful sync to store ALL sync_variants (variantId, size, color, price, inStock) as
  JSON column `variantsData` on products table — real Printful variant data, not fake.
- Manual products: simple admin-defined size/color option lists (informational only).
- Product page: variant selector UI, price updates per variant, add-to-cart carries
  variantId/size/color.
- Cart + orders: store selected variant per line item.
- Printful order creation: use the correct real variantId for fulfillment accuracy.

### B. Custom product request
- DB table customRequests (name, email, description, referenceImage, phone, status, quotedAmount,
  paymentLinkUrl, createdAt)
- Public POST /api/custom-requests (create), Admin GET list + POST quote (creates a real Square
  payment link for arbitrary amount) + PUT status
- Frontend: /custom-request page with form + reference image upload; admin "Custom Requests" tab

### C. Referral / rewards system
- referralId generated client-side (localStorage), no login required
- DB: referralAccounts (referralId, storeCredit, shareClaimed), referralVisits (dedup newcomer
  bonus per new visitor)
- API: register, share (+$50, one-time), track-visit (+$20 to newcomer, one-time), balance,
  cashout request (admin notified + manual payout)
- Frontend: /rewards page (share link + claim button + balance + cashout form), Navbar link,
  checkout "use store credit" section, admin "Rewards" tab (balances + pending cashouts)

### D. Real new products
- Query Printful Catalog API for real blank items, create sync products via API using our
  approved real logo art, set healthy margin, sync into store. Apparel/accessories only —
  will explain electronics dropshipping isn't set up (different supplier needed).

### E. Logo / background update
- Use user-attached OG v2 image as new site logo (Navbar) and as a background/hero section element

### F. Publish
- Remind user this is platform-controlled, not something I trigger from sandbox

## Status: Backend done, frontend next
- [x] Schema pushed: variantsData, orderItems variant fields, storeCreditUsed, customRequests,
      referralAccounts, referralVisits, cashoutRequests
- [x] Printful sync parses real variant data (variantId/size/color/price/imageUrl)
- [x] createPrintfulOrder uses sync_variant_id when selected, falls back to sync_product_id
- [x] checkout.ts: variant fields on order items, useStoreCredit validated+applied server-side,
      rollback on Square failure
- [x] routes/referrals.ts, routes/custom-requests.ts, upload.ts customer-presign, index.ts wired

## STILL TODO
- [ ] Product page variant selector UI (size/color), price/image updates, cart passthrough
- [ ] Cart lib: variantId/size/color on items, dedupe by variant
- [ ] Cart + checkout UI: show variant per line, store-credit section, referralId gen on load
- [ ] /rewards page (share $50, balance, cashout form), Navbar link, ?ref= handling + $20 toast
- [ ] /custom-request page (form + customer-presign upload)
- [ ] Admin: Custom Requests tab, Rewards tab
- [ ] Real new Printful products (2-3, real catalog items, our logo, healthy margin)
- [ ] Logo + background: save attached OG v2 image to public/, use as Navbar logo + bg element
- [ ] Restart + smoke test everything, screenshot check

