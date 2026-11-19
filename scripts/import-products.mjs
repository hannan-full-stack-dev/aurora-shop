#!/usr/bin/env node
// Builds public/products.json from open product sources (needs Node 18+ and internet).
//
//   node scripts/import-products.mjs                 -> about 1,000 products (DummyJSON + FakeStore + Open Food Facts + Open Beauty Facts)
//   node scripts/import-products.mjs --off 560 --obf 240   (change these numbers for more or fewer)
//   node scripts/import-products.mjs --csv my-tech.csv --map scripts/csv-map.json
//   node scripts/import-products.mjs --verify-images  -> drops products whose main image does not load
//   node scripts/import-products.mjs --force          -> rebuild even if public/products.json already exists (old one is backed up)
//
// Prices, stock and ratings for Open Food/Beauty Facts items are generated (those datasets have none).
// DummyJSON / FakeStore data is used as published. Keep the attribution line in the footer.
import { writeFile, readFile, mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1] ?? true; };
const WANT_OFF = +flag('off', 560);
const WANT_OBF = +flag('obf', 240);
const UA = 'AuroraShopPortfolio/1.0 (portfolio demo; contact: set-your-email@example.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (str) => [...String(str)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (res.ok) return await res.json();
      if (res.status === 429 || res.status >= 500) await sleep(4000 * (i + 1));
      else throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error('failed');
}

/* ---------- DummyJSON (real-looking photos, specs, reviews) ---------- */
const DJ_CATEGORY_FIX = { motorcycle: 'mobility', vehicle: 'mobility' };
export function mapDummy(p) {
  return {
    source: 'dummyjson',
    title: p.title,
    description: p.description,
    category: DJ_CATEGORY_FIX[p.category] || p.category,
    price: p.price,
    discountPercentage: p.discountPercentage || 0,
    rating: p.rating || 0,
    stock: p.stock ?? 20,
    brand: p.brand || '',
    sku: p.sku,
    weight: p.weight,
    dimensions: p.dimensions,
    tags: p.tags || [],
    warrantyInformation: p.warrantyInformation,
    shippingInformation: p.shippingInformation,
    availabilityStatus: p.availabilityStatus,
    returnPolicy: p.returnPolicy,
    reviews: p.reviews || [],
    thumbnail: p.thumbnail,
    images: p.images?.length ? p.images : [p.thumbnail],
  };
}
async function fromDummy() {
  const data = await getJSON('https://dummyjson.com/products?limit=0');
  return data.products.map(mapDummy);
}

/* ---------- Fake Store API ---------- */
const FS_CAT = { "men's clothing": 'mens-shirts', "women's clothing": 'tops', jewelery: 'womens-jewellery', electronics: 'mobile-accessories' };
export function mapFake(p) {
  const r = rng(hash(p.id));
  return {
    source: 'fakestore',
    title: p.title,
    description: p.description,
    category: FS_CAT[p.category] || 'more',
    price: p.price,
    discountPercentage: r() < 0.4 ? Math.round(5 + r() * 20) : 0,
    rating: p.rating?.rate || 4,
    stock: 10 + Math.floor(r() * 90),
    brand: '',
    tags: [p.category],
    reviews: [],
    thumbnail: p.image,
    images: [p.image],
  };
}
async function fromFake() {
  const data = await getJSON('https://fakestoreapi.com/products');
  return data.map(mapFake);
}

/* ---------- Open Food Facts / Open Beauty Facts (same API shape) ---------- */
const OFF_CATS = [
  ['snacks', 'snacks'], ['biscuits', 'snacks'], ['chocolates', 'chocolate-sweets'], ['candies', 'chocolate-sweets'],
  ['breakfast-cereals', 'breakfast-spreads'], ['jams', 'breakfast-spreads'], ['honeys', 'breakfast-spreads'],
  ['pastas', 'pasta-sauces'], ['tomato-sauces', 'pasta-sauces'], ['olive-oils', 'pasta-sauces'],
  ['sodas', 'drinks'], ['juices', 'drinks'], ['coffees', 'drinks'], ['teas', 'drinks'], ['waters', 'drinks'],
  ['cheeses', 'dairy'], ['yogurts', 'dairy'], ['plant-based-milks', 'dairy'],
  ['breads', 'bakery'], ['canned-foods', 'pantry'], ['rices', 'pantry'], ['soups', 'pantry'],
];
const OBF_CATS = [
  ['shampoos', 'hair-care'], ['conditioners', 'hair-care'], ['body-lotions', 'body-care'], ['shower-gels', 'body-care'],
  ['soaps', 'body-care'], ['face-creams', 'skin-care'], ['sunscreens', 'skin-care'], ['toothpastes', 'oral-care'],
  ['deodorants', 'body-care'], ['lipsticks', 'makeup'], ['mascaras', 'makeup'], ['perfumes', 'fragrances'],
];
const FIELDS = 'code,product_name,brands,quantity,categories,ingredients_text,image_front_url,image_front_small_url,nutriscore_grade,generic_name,labels';
const PRICE_RANGE = { snacks: [1.5, 6], 'chocolate-sweets': [1.5, 9], 'breakfast-spreads': [2, 9], 'pasta-sauces': [1.5, 14], drinks: [1, 12], dairy: [1.5, 12], bakery: [1.5, 8], pantry: [1, 9], 'hair-care': [3, 22], 'body-care': [2, 20], 'skin-care': [5, 40], 'oral-care': [2, 12], makeup: [4, 35], fragrances: [15, 90] };

export function mapOpenFacts(p, category, kind, i = 0) {
  const name = (p.product_name || p.generic_name || '').trim();
  const img = p.image_front_url;
  if (!name || !img || name.length > 90) return null;
  const brand = (p.brands || '').split(',')[0].trim();
  const r = rng(hash(p.code));
  const [lo, hi] = PRICE_RANGE[category] || [2, 10];
  const price = +(lo + r() * (hi - lo)).toFixed(2);
  const bits = [p.generic_name && p.generic_name !== name ? p.generic_name : '', p.quantity ? `Pack size: ${p.quantity}.` : '', p.ingredients_text ? `Ingredients: ${p.ingredients_text.slice(0, 400)}` : ''].filter(Boolean);
  return {
    source: kind,
    title: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name,
    description: bits.join(' ') || `${name}${brand ? ` by ${brand}` : ''}.`,
    category,
    price,
    discountPercentage: r() < 0.3 ? Math.round(5 + r() * 25) : 0,
    rating: +(3.7 + r() * 1.2).toFixed(1),
    stock: r() < 0.04 ? 0 : 8 + Math.floor(r() * 140),
    brand,
    sku: p.code,
    weight: undefined,
    tags: [p.nutriscore_grade ? `nutri-score ${p.nutriscore_grade}` : '', ...(p.labels || '').split(',').slice(0, 3).map((s) => s.trim())].filter(Boolean),
    availabilityStatus: 'In Stock',
    reviews: [],
    thumbnail: p.image_front_small_url || img,
    images: [img],
  };
}
async function fromOpenFacts(host, kind, cats, want) {
  const perCat = Math.ceil(want / cats.length); // even share per category
  const out = [];
  const seen = new Set();
  for (const [tag, category] of cats) {
    let got = 0;
    for (let page = 1; got < perCat && page <= 6; page++) {
      const url = `https://${host}/api/v2/search?categories_tags_en=${encodeURIComponent(tag)}&fields=${FIELDS}&page_size=100&page=${page}&sort_by=unique_scans_n&lc=en`;
      try {
        const data = await getJSON(url);
        for (const raw of data.products || []) {
          if (got >= perCat) break;
          const m = mapOpenFacts(raw, category, kind);
          if (m && !seen.has(raw.code)) { seen.add(raw.code); out.push(m); got++; }
        }
        if (!data.products?.length) break;
      } catch (e) {
        console.warn(`  ! ${host} ${tag} p${page}: ${e.message}`);
        break;
      }
      await sleep(7000); // Open*Facts search is rate limited (~10/min)
    }
    console.log(`  ${kind}: ${tag} -> ${got}`);
  }
  return out.slice(0, want);
}

/* ---------- optional CSV (e.g. a Kaggle tech dataset) ---------- */
export function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0]) rows.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
async function fromCSV(file, mapFile) {
  const map = JSON.parse(await readFile(mapFile, 'utf8'));
  const [head, ...rows] = parseCSV(await readFile(file, 'utf8'));
  const idx = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
  const get = (r, k) => (map[k] && idx[map[k]] != null ? (r[idx[map[k]]] || '').trim() : '');
  const out = [];
  for (const r of rows) {
    const img = get(r, 'image').split(/[|,\s]/).find((u) => /^https?:/.test(u));
    const price = parseFloat(get(r, 'price').replace(/[^0-9.]/g, ''));
    const title = get(r, 'title');
    if (!img || !title || !price) continue;
    const rr = rng(hash(title));
    out.push({
      source: 'csv', title, description: get(r, 'description') || title,
      category: map.categoryOverride || get(r, 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'more',
      price, discountPercentage: 0, rating: parseFloat(get(r, 'rating')) || +(3.8 + rr() * 1.1).toFixed(1),
      stock: 5 + Math.floor(rr() * 80), brand: get(r, 'brand'), tags: [], reviews: [], thumbnail: img, images: [img],
    });
  }
  return out;
}

/* ---------- finish ---------- */
async function imageOK(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    return res.ok && (res.headers.get('content-type') || '').startsWith('image/');
  } catch { return false; }
}
async function verifyImages(list) {
  const keep = []; let i = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (i < list.length) { const p = list[i++]; if (await imageOK(p.thumbnail)) keep.push(p); }
  }));
  return keep;
}
export function finalize(list) {
  const seen = new Set();
  const uniq = list.filter((p) => { const k = `${p.title}|${p.brand}`.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  const r = rng(2026); // seeded shuffle so ids (and the "New" badge) are spread across departments
  for (let i = uniq.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [uniq[i], uniq[j]] = [uniq[j], uniq[i]]; }
  return uniq.map((p, i) => ({ id: i + 1, ...p }));
}

async function main() {
  const OUT = 'public/products.json';
  const exists = await access(OUT).then(() => true, () => false);
  if (exists && !flag('force', false)) {
    console.log(`${OUT} already exists, so nothing was changed (your current catalogue is safe).`);
    console.log('To rebuild it from scratch run again with --force (the old file is saved as public/products.backup.json first).');
    return;
  }
  if (exists) {
    await copyFile(OUT, 'public/products.backup.json');
    console.log('Old catalogue saved as public/products.backup.json');
  }
  console.log('Starting import (this takes a few minutes)...');
  const all = [];
  const step = async (label, fn) => { try { const l = await fn(); console.log(`${label}: ${l.length}`); all.push(...l); } catch (e) { console.warn(`${label} failed: ${e.message}`); } };
  await step('DummyJSON', fromDummy);
  await step('FakeStore', fromFake);
  if (flag('csv')) await step('CSV', () => fromCSV(flag('csv'), flag('map', 'scripts/csv-map.json')));
  if (WANT_OFF) await step('Open Food Facts', () => fromOpenFacts('world.openfoodfacts.org', 'openfoodfacts', OFF_CATS, WANT_OFF));
  if (WANT_OBF) await step('Open Beauty Facts', () => fromOpenFacts('world.openbeautyfacts.org', 'openbeautyfacts', OBF_CATS, WANT_OBF));
  let list = all;
  if (flag('verify-images', false)) { console.log('Checking images...'); list = await verifyImages(list); }
  const final = finalize(list);
  if (!final.length) throw new Error('No products were fetched. Check your internet connection and try again. Nothing was written.');
  await mkdir('public', { recursive: true });
  await writeFile(OUT, JSON.stringify(final));
  const byCat = final.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
  console.log(`\nWrote public/products.json with ${final.length} products`);
  console.table(byCat);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
