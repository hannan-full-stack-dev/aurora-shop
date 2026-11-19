const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (n) => currency.format(n);

const CATEGORY_NAMES = {
  tops: "Women's Tops",
  'scarves-accessories': 'Scarves & Accessories',
  'mobile-accessories': 'Mobile Accessories',
  groceries: 'Pantry',
  'chocolate-sweets': 'Chocolate & Sweets',
  'breakfast-spreads': 'Breakfast & Spreads',
  'pasta-sauces': 'Pasta, Sauces & Oils',
  'hair-care': 'Hair Care',
  'body-care': 'Body Care',
  'oral-care': 'Oral Care',
  'mobility': 'E-bikes & Scooters',
  'car-accessories': 'Car Accessories',
};

export function prettyCategory(slug = '') {
  if (CATEGORY_NAMES[slug]) return CATEGORY_NAMES[slug];
  return slug
    .split('-')
    .map((w) => {
      if (w === 'mens') return "Men's";
      if (w === 'womens') return "Women's";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const FREE_SHIPPING_AT = 100;
export const SHIPPING_FEE = 9.99;
export const PROMO_CODE = 'AURORA10';

// Cash on delivery (COD): the delivery fee is always paid in advance (COD never gets free shipping),
// the rest is paid in cash when the order arrives. The advance fee is non-refundable on cancellation,
// which discourages fake orders. Card orders pay everything now and are fully refundable.
export function calcTotals(subtotal, promoApplied, payment = 'card') {
  const discount = promoApplied ? +(subtotal * 0.1).toFixed(2) : 0;
  const after = subtotal - discount;
  const cod = payment === 'cod';
  const shipping = subtotal === 0 ? 0 : cod ? SHIPPING_FEE : after >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
  const total = +(after + shipping).toFixed(2);
  const payNow = cod ? shipping : total;
  const payOnDelivery = +(total - payNow).toFixed(2);
  return { discount, shipping, total, payNow, payOnDelivery };
}

// Departments group the catalogue categories into a storefront-friendly structure.
export const DEPARTMENTS = [
  {
    slug: 'fashion',
    label: 'Fashion',
    blurb: 'European-style womenswear, menswear, shoes & bags',
    categories: [
      'womens-dresses', 'womens-coats', 'womens-knitwear', 'tops', 'womens-trousers', 'womens-skirts', 'womens-shoes',
      'womens-bags', 'womens-jewellery', 'mens-shirts', 'mens-jackets', 'mens-knitwear', 'mens-trousers', 'mens-shoes',
      'mens-watches', 'scarves-accessories', 'sunglasses',
    ],
  },
  {
    slug: 'tech',
    label: 'Tech',
    blurb: 'Latest phones, laptops, audio & gaming',
    categories: ['smartphones', 'laptops', 'tablets', 'audio', 'smartwatches', 'gaming', 'mobile-accessories'],
  },
  {
    slug: 'home',
    label: 'Home',
    blurb: 'Furniture, décor & kitchen',
    categories: ['furniture', 'home-decoration', 'kitchen-accessories'],
  },
  {
    slug: 'beauty',
    label: 'Beauty',
    blurb: 'Skin care, makeup & fragrances',
    categories: ['beauty', 'skin-care', 'fragrances', 'makeup', 'hair-care', 'body-care', 'oral-care'],
  },
  {
    slug: 'grocery',
    label: 'Grocery',
    blurb: 'Snacks, drinks, pantry & breakfast',
    categories: ['groceries', 'snacks', 'chocolate-sweets', 'breakfast-spreads', 'pasta-sauces', 'drinks', 'dairy', 'bakery', 'pantry'],
  },
  { slug: 'sports', label: 'Sports', blurb: 'Gear for every game', categories: ['sports-accessories'] },
  { slug: 'auto', label: 'Auto', blurb: 'E-bikes, scooters & car gear', categories: ['mobility', 'car-accessories'] },
];

export const deptOf = (category) => DEPARTMENTS.find((d) => d.categories.includes(category))?.slug || 'more';
export const deptLabel = (slug) => DEPARTMENTS.find((d) => d.slug === slug)?.label || 'More';

// Shown if a product photo fails to load (broken link, offline, etc.)
export const IMG_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#eee9dc"/><g fill="none" stroke="#27304a" stroke-width="6"><rect x="120" y="130" width="160" height="140" rx="12"/><circle cx="165" cy="175" r="14"/><path d="M130 260l50-50 40 40 25-25 35 35"/></g></svg>'
  );
export const onImgError = (e) => {
  if (e.currentTarget.src !== IMG_FALLBACK) e.currentTarget.src = IMG_FALLBACK;
};
