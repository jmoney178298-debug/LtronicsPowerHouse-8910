# Ltronics PowerHouse — "Street ↔ Crown" Design System (v2)

## Concept

A signature visual device unique to this brand: a diagonal **Fault Line** runs through
every page, physically separating two textures —

- **Street side** (upper-left): cracked dark concrete, burnt-orange spray paint grime,
  graffiti scratches. Represents the hustle.
- **Crown side** (lower-right): polished black marble with gold-foil and electric-blue
  veining. Represents the throne earned.

As the user scrolls, the fault line's position shifts — the page visually "climbs" from
street to crown. This isn't a static split image; it's a live scroll-driven transform
applied via a fixed full-viewport background (`FaultBackground` component) using
`clip-path` on the crown layer, controlled by a CSS custom property (`--fault`) that a
scroll listener updates (rAF-throttled, passive listener, computed from
`scrollY / (document height - viewport height)`).

Individual UI elements echo the same split:
- **Cards** (ProductCard, PostCard): subtle diagonal seam in the top border — orange→blue
  gradient line — with a faint texture wash in each corner (street grit top-left corner,
  gold marble bottom-right corner) at low opacity so content stays readable.
- **Primary buttons**: two-tone diagonal fill (orange grit half / marble-gold half),
  seam animates on hover (fault line "shifts" to reveal more gold).
- **Section dividers**: a jagged/diagonal edge (clip-path polygon) instead of straight
  horizontal lines, alternating direction per section.

This device is not decoration bolted onto the old dark theme — it replaces flat solid
section backgrounds with a living, textured, narrative background system that is the
same on every page (home, shop, product, cart, checkout, blog, admin — admin gets a
toned-down/lower-opacity version so it stays usable as a dashboard).

## Assets

- `/textures/street-texture_*.png` — seamless tileable street/grit texture
- `/textures/marble-texture_*.png` — seamless tileable marble/gold/blue texture
- Existing crowned-skull logo, OG image, product mockups — unchanged

## Typography

- Display / headings: `Bebas Neue` (already loaded) — condensed, aggressive, works for
  both the street and the crown side.
- Body: `Poppins` (already loaded).
- New: pull quote / accent serif for blog post titles — `Playfair Display` (adds a touch
  of "crown" elegance to editorial content). Load via Google Fonts alongside existing.

## Color (unchanged core tokens, reused)

```
--bg: #080608        --tx: #e8600a (street/orange)
--bg-alt: #0d0b0f     --co: #00aaff (crown/blue)
--card: #121018       --brand-gold: #c9922a (crown/gold)
--text: #f5f0eb        --danger: #ef4444
--muted: #8a8090
```

New tokens for the fault system:
```
--fault-street-tex: url(/textures/street-texture_*.png)
--fault-crown-tex: url(/textures/marble-texture_*.png)
--fault-seam: linear-gradient(90deg, var(--tx), var(--brand-gold), var(--co))
```

## Components touched

- `FaultBackground.tsx` (new) — fixed layer mounted once in `app.tsx`, sits behind all
  routed content (z-index -1), scroll-driven clip-path split.
- `useFaultScroll.ts` (new hook) — scroll listener, sets `--fault` CSS var on `<html>`.
- `Navbar`, `Footer` — thin seam-gradient border accents, semi-transparent over the
  fault background so it reads through.
- `ProductCard` — corner texture washes + seam top border.
- `index.tsx` (home) — hero statement built around the fault line concept ("BUILT ON
  THE STREET. CROWNED FOR LIFE." split headline, half in orange grit type treatment,
  half in gold foil type treatment).
- `shop.tsx`, `product.tsx`, `cart.tsx`, `checkout.tsx` — inherit background system,
  section dividers get jagged clip-path edges.
- `admin.tsx` — same texture system but at reduced opacity (10-15%) behind cards so
  data stays highly legible; functional dashboard, not a showcase page.

## Blog — "Kingz Talk"

- Public routes: `/kingz-talk` (list, filterable by category), `/kingz-talk/:slug` (post)
- Post = title, slug, excerpt, cover image, markdown body, category, affiliate links
  (array of `{label, url}` rendered as styled CTA cards within the post), published flag
- Admin: new "Kingz Talk" tab in admin dashboard — list/create/edit/delete posts, publish
  toggle, affiliate link repeater field
- Visual: post cards use the same corner-texture-wash treatment as ProductCard; post
  detail page uses `Playfair Display` for the title sitting right on the fault line
  graphic, affiliate link cards styled as small gold-embossed buttons

## Motion

- Fault line shift is the primary motion signature — continuous, tied to scroll, not a
  one-off animation.
- Section reveals: single staggered fade+rise on load (Framer Motion / CSS), no
  scattered micro-interactions beyond that.
- Buttons: seam animates on hover (background-position shift on the two-tone gradient).
