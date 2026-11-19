Aurora: React E-commerce Storefront

A fast, animated, fully responsive storefront built to show production-style React skills. It runs entirely in the browser (no backend, no API key) with 847 real products and real photos from open datasets.

<div>
  <video src="https://github.com/user-attachments/assets/a0b07b68-9462-4556-8c91-c09ec2da38cc" controls muted playsinline></video>
</div>


Live demo: https://aurora-shop-e-commerce.vercel.app

Portfolio demo. No real orders or payments are processed. See About the data.

Highlights

Design

Distinctive neo-editorial look: warm paper + ink outlines, hard shadows, electric "volt" accent, grain overlay
Light / dark theme (no flash on load), custom type system (Bricolage Grotesque, Instrument Sans, Space Mono)

Animation (all CSS / Web Animations, no animation library)

Kinetic hero headline, cursor spotlight, mouse-parallax floating cards, rotating text badges
Scroll-reveal with stagger, scroll progress bar, back-to-top, page-enter transitions
3D tilt + glare on product cards, image zoom on the product page
Fly-to-cart arc animation, cart badge bump, heart-burst on wishlist, toast notifications
Infinite marquees, live "deal of the day" countdown with flipping digits, count-up stats
Mega menu, slide-over cart with staggered items, order-confirmation confetti
Fully respects prefers-reduced-motion

Catalogue

847 real products across fashion, tech, home, beauty and grocery, with real photos, descriptions and specs
Newest-first default sort, deals, top-rated and per-department rails
Filters by department, category, max price and min rating; 5 sort modes; all state lives in the URL

Search-as-you-type

Ranked product matches with thumbnails, matched-text highlight, category matches
Recent + trending searches, / shortcut, ↑ ↓ Enter Esc keyboard navigation, ARIA combobox

Accounts (front-end only, no backend)

Register / login / logout with validation, password-strength meter, show/hide password
Account page with order history, spend stats, order cancellation and profile editing; protected route redirects to login
Accounts live in localStorage (salted SHA-256 hashes via Web Crypto). This is a demo, not real security

Shopping flow

Product page (gallery, tabs, reviews, related), cart drawer with free-shipping progress, wishlist
Checkout with inline validation, input masking, promo code AURORA10, simulated order placement
Cash on delivery with an advance delivery fee: COD orders pay the delivery fee up front (card, bKash or Nagad) and the rest in cash on arrival. COD never gets free shipping.
Cancellation policy: card orders are refunded in full; for COD the advance delivery fee is non-refundable, so fake or cancelled COD orders do not cost the shop money
Tech

React 18 · Vite · React Router v6 · Context + useReducer · lucide-react · plain CSS (design tokens)

Run locally
bash
npm install
npm run dev

Production build: npm run build then npm run preview.

Deploy
Vercel: import the repo (vercel.json handles SPA routing)
Netlify: build npm run build, publish dist (public/_redirects handles SPA routing)
About the data

The store loads public/products.json (included in the repo), built by scripts/import-products.mjs from open sources:

DummyJSON and Fake Store API: tech, fashion, home and beauty products with photos
Open Food Facts and Open Beauty Facts: real packaged products with real packshots (ODbL / CC BY-SA, attribution is in the site footer)
Prices, stock and ratings of Open Food/Beauty Facts items are generated for the demo (those datasets do not contain them). Prices are illustrative everywhere.
If products.json is missing the app loads ~190 products live from DummyJSON. There are no drawn or placeholder images; if nothing loads, the site shows an error with a retry button.
Product photos are hot-linked from the sources above, so a photo can disappear if the source removes it (a neutral placeholder is shown).
Rebuild the catalogue
bash
node scripts/import-products.mjs                  # does nothing if public/products.json already exists
node scripts/import-products.mjs --force          # rebuild (the old file is saved as products.backup.json)
node scripts/import-products.mjs --verify-images  # also drop products whose photo link is dead
node scripts/import-products.mjs --csv my-data.csv --map scripts/csv-map.json   # add your own CSV

Set your email in the script's User-Agent first (Open Food Facts asks for it).

Structure
src/
  api.js, utils.js, orders.js, fly.js   data loading, helpers, order history + cancellation, fly-to-cart
  context/                              StoreContext (cart/wishlist/toast), AuthContext
  hooks/                                useProducts, useInView, useTilt, useTheme, useTitle
  components/                           Header, SearchBox, ProductCard, CartDrawer, Marquee, ...
  pages/                                Home, Shop, ProductDetail, Checkout, Login, Register, Account, ...
  styles/                               base.css (system + components), pages.css
scripts/
  import-products.mjs                   builds public/products.json from open datasets
Talking points
Why client-side auth is a demo, and what a real backend (JWT / HTTP-only cookies) would change
Derived state in the URL, memoised filtering over ~850 products, route-level code splitting
Business rule design: COD advance fee + non-refundable cancellation to reduce fake orders
Accessibility: combobox search, skip link, labelled controls, aria-live toasts, reduced motion
Next steps

TypeScript migration · Vitest + Testing Library (cart reducer, checkout validation) · TanStack Query · Stripe test-mode checkout
### Build the catalogue
```bash
node scripts/import-products.mjs                 # about 1,000 products, takes ~5 minutes (rate limits)
node scripts/import-products.mjs --verify-images # also drops products whose photo link is dead
```
Edit the `User-Agent` email in the script first (Open Food Facts asks for it).
