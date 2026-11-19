// Loads the catalogue from /products.json (built by scripts/import-products.mjs). If that file is
// missing it loads ~190 real products live from DummyJSON. There are no drawn/generated images any
// more: if both fail, the site shows an error with a retry button.

import { deptOf } from './utils';

const NEW_COUNT = 48; // the highest ids get the "New" badge

let cache = null;

function normalize(p) {
  const price = +(p.price * (1 - (p.discountPercentage || 0) / 100)).toFixed(2);
  p.originalPrice = p.price;
  p.price = price;
  p.dept = deptOf(p.category);
  return p;
}

// No products.json? Pull real products straight from DummyJSON in the browser (CORS-enabled, no key).
const DJ_FIX = { motorcycle: 'mobility', vehicle: 'mobility' };
async function loadLive() {
  const res = await fetch('https://dummyjson.com/products?limit=0');
  if (!res.ok) throw new Error('live catalogue unavailable');
  const { products } = await res.json();
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: DJ_FIX[p.category] || p.category,
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
  }));
}

export let catalogSource = 'loading';

async function load() {
  const why = [];
  try {
    const res = await fetch('/products.json', { headers: { Accept: 'application/json' } });
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.includes('json')) {
      const raw = await res.json();
      if (Array.isArray(raw) && raw.length) {
        catalogSource = 'products.json';
        return raw.map((p) => normalize(p));
      }
    }
    why.push(`/products.json not found (HTTP ${res.status}, ${type || 'no type'})`);
  } catch (e) {
    why.push(`/products.json failed: ${e.message}`);
  }
  try {
    const live = await loadLive();
    if (live.length) {
      catalogSource = 'dummyjson-live';
      return live.map((p) => normalize(p));
    }
  } catch (e) {
    why.push(`dummyjson.com failed: ${e.message}`);
  }
  catalogSource = 'failed';
  console.error('[Aurora] Could not load real products:', why.join(' | '));
  throw new Error('Could not load products. Run scripts/import-products.mjs or check your internet connection.');
}

export function fetchProducts() {
  if (!cache) {
    cache = load()
      .then((list) => {
        list.forEach((p) => {
          p.isNew = p.id > list.length - NEW_COUNT;
        });
        return list;
      })
      .catch((err) => {
        cache = null; // allow retry
        throw err;
      });
  }
  return cache;
}
