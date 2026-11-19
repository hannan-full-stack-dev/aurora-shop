# Aurora — React E-commerce Storefront

A fast, animated, fully responsive storefront built to show production-style React skills.
The catalogue is about 1,000 real products with real photos (tech, fashion, home, beauty, grocery) loaded from open datasets, so no backend or API key is needed. See "About the catalogue" below.

## Highlights

**Design**
- Distinctive neo-editorial look: warm paper + ink outlines, hard shadows, electric "volt" accent, grain overlay
- Light / dark theme (no flash on load), custom type system (Bricolage Grotesque, Instrument Sans, Space Mono)

**Animation (all CSS / Web Animations, no animation library)**
- Kinetic hero headline, cursor spotlight, mouse-parallax floating cards, rotating text badges
- Scroll-reveal with stagger, scroll progress bar, back-to-top, page-enter transitions
- 3D tilt + glare on product cards, image zoom on the product page
- Fly-to-cart arc animation, cart badge bump, heart-burst on wishlist, toast notifications
- Infinite marquees, live "deal of the day" countdown with flipping digits, count-up stats
- Mega menu, slide-over cart with staggered items, order-confirmation confetti
- Fully respects `prefers-reduced-motion`

**Catalogue**
- About 1,000 real products across 7 departments, with real photos and details from open datasets
- Tech uses current model names (iPhone 17 family, Galaxy S26 family, Pixel 10 family, MacBook Air/Pro M4/M5, Dell XPS, ThinkPad, Surface…); fashion is European-style from invented labels
- "Just dropped" new arrivals rail, newest-first default sort, deals, top rated
- Filters by department, category, max price, min rating; 5 sort modes; everything lives in the URL

**Search-as-you-type**
- Ranked product matches with thumbnails, matched-text highlight, category matches
- Recent + trending searches, `/` shortcut, ↑ ↓ Enter Esc keyboard navigation, ARIA combobox

**Accounts (front-end only, no backend)**
- Register / login / logout with validation, password-strength meter, show/hide password
- Account page with order history, spend stats and profile editing; protected route redirects to login
- Accounts live in `localStorage` (salted SHA-256 hashes via Web Crypto). This is a demo, not real security

**Shopping flow**
- Product page (gallery, tabs, reviews, related), cart drawer with free-shipping progress, wishlist
- Checkout with inline validation, input masking, promo code `AURORA10`, simulated order placement

## Tech
React 18 · Vite · React Router v6 · Context + `useReducer` · lucide-react · plain CSS (design tokens)

## Run locally
```bash
npm install
npm run dev
```
Production build: `npm run build` then `npm run preview`.

## Deploy
- **Vercel:** import the repo (`vercel.json` handles SPA routing)
- **Netlify:** build `npm run build`, publish `dist` (`public/_redirects` handles SPA routing)

## Structure
```
src/
  api.js, utils.js, orders.js, fly.js   data loading, helpers, order history, fly-to-cart
  context/                              StoreContext (cart/wishlist/toast), AuthContext
  hooks/                                useProducts, useInView, useTilt, useTheme, useTitle
  components/                           Header, SearchBox, ProductCard, CartDrawer, Marquee, ...
  pages/                                Home, Shop, ProductDetail, Checkout, Login, Register, Account, ...
  styles/                               base.css (system + components), pages.css
```

## Make it yours
1. Rename "Aurora" in `Header.jsx`, `Footer.jsx`, `index.html`; tweak `--volt` / `--violet` in `styles/base.css`.
2. Deploy it, then add the live link + GitHub repo to your portfolio.

## Talking points for interviews
- Why client-side auth is a demo, and what a real backend (JWT / HTTP-only cookies) would change
- Derived state in the URL, memoised filtering over ~200 products, route-level code splitting
- Accessibility: combobox search, skip link, labelled controls, `aria-live` toasts, reduced motion

## Next steps
TypeScript migration · Vitest + Testing Library (cart reducer, checkout validation) · TanStack Query · Stripe test-mode checkout


## About the catalogue (read before showing it to anyone)
The store loads `public/products.json`, built by `scripts/import-products.mjs` from open sources:
- **DummyJSON** and **Fake Store API**: tech, fashion, home, beauty with real photos (used as published).
- **Open Food Facts** and **Open Beauty Facts**: real packaged products with real packshots (ODbL / CC BY-SA; keep the attribution in the footer).
- Optional **CSV** (e.g. a Kaggle tech dataset you downloaded): `--csv file.csv --map scripts/csv-map.json`. Check the dataset licence first.
- Prices, stock and ratings for Open Food/Beauty Facts items are **generated** (those datasets do not have them), and no orders are real. The footer says so.
- If `products.json` is missing, the app loads ~190 real products live from DummyJSON. There are no drawn/SVG images anywhere; if nothing can load, the site shows an error with a retry button.

### Build the catalogue
```bash
node scripts/import-products.mjs                 # about 1,000 products, takes ~5 minutes (rate limits)
node scripts/import-products.mjs --verify-images # also drops products whose photo link is dead
```
Edit the `User-Agent` email in the script first (Open Food Facts asks for it).
