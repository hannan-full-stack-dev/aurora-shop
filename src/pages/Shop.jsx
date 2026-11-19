import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import useProducts from '../hooks/useProducts';
import useTitle from '../hooks/useTitle';
import { DEPARTMENTS, deptLabel, formatPrice, prettyCategory } from '../utils';

const SORTS = [
  ['new', 'Newest first'],
  ['rating', 'Top rated'],
  ['discount', 'Biggest discount'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];
const DEFAULT_SORT = 'new';
const PAGE_SIZE = 24;

export default function Shop() {
  useTitle('Shop');
  const [params, setParams] = useSearchParams();
  const { products, loading, error, reload } = useProducts();

  const q = params.get('q') || '';
  const dept = params.get('dept') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || DEFAULT_SORT;
  const minRating = Number(params.get('rating') || 0);

  const priceCeil = useMemo(() => {
    const top = products.reduce((m, p) => Math.max(m, p.price), 0);
    return Math.ceil(top / 10) * 10 || 100;
  }, [products]);
  const maxPrice = Number(params.get('max') || priceCeil);

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const update = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => {
          if (v === '' || v == null) next.delete(k);
          else next.set(k, v);
        });
        return next;
      },
      { replace: true }
    );

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [q, dept, category, sort, minRating, maxPrice]);

  const deptCounts = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.dept, (m.get(p.dept) || 0) + 1));
    return m;
  }, [products]);

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (dept && p.dept !== dept) return;
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products, dept]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (dept && p.dept !== dept) return false;
      if (category && p.category !== category) return false;
      if (p.price > maxPrice) return false;
      if (p.rating < minRating) return false;
      if (term) {
        const hay = `${p.title} ${p.brand || ''} ${p.category} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      case 'discount':
        return list.sort((a, b) => b.discountPercentage - a.discountPercentage);
      default:
        return list.sort((a, b) => b.id - a.id);
    }
  }, [products, q, dept, category, maxPrice, minRating, sort]);

  const chips = [];
  if (q) chips.push({ keys: ['q'], label: `“${q}”` });
  if (dept) chips.push({ keys: ['dept', 'category'], label: deptLabel(dept) });
  if (category) chips.push({ keys: ['category'], label: prettyCategory(category) });
  if (minRating) chips.push({ keys: ['rating'], label: `${minRating}★ & up` });
  if (maxPrice < priceCeil) chips.push({ keys: ['max'], label: `Under ${formatPrice(maxPrice)}` });

  const clearAll = () => setParams({}, { replace: true });
  const removeChip = (keys) => update(Object.fromEntries(keys.map((k) => [k, ''])));

  const title = category ? prettyCategory(category) : dept ? deptLabel(dept) : q ? `Results for “${q}”` : 'All products';

  return (
    <div className="container page">
      <div className="page-head">
        <span className="kicker">{sort === 'new' && !q ? 'Latest first' : 'Shop'}</span>
        <h1>{title}</h1>
        <p className="muted">{loading ? 'Loading…' : `${filtered.length} products`}</p>
      </div>

      <div className="dept-pills" role="tablist" aria-label="Departments">
        <button
          role="tab"
          aria-selected={!dept}
          className={`pill ${!dept ? 'active' : ''}`}
          onClick={() => update({ dept: '', category: '' })}
        >
          All <span>{products.length}</span>
        </button>
        {DEPARTMENTS.map((d) => (
          <button
            key={d.slug}
            role="tab"
            aria-selected={dept === d.slug}
            className={`pill ${dept === d.slug ? 'active' : ''}`}
            onClick={() => update({ dept: d.slug, category: '' })}
          >
            {d.label} <span>{deptCounts.get(d.slug) || 0}</span>
          </button>
        ))}
      </div>

      <div className="shop-toolbar">
        <button className="btn btn-ghost filters-toggle" onClick={() => setShowFilters(true)}>
          <SlidersHorizontal size={16} /> Filters
        </button>
        <label className="sort">
          <span className="sort-label">Sort by</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value === DEFAULT_SORT ? '' : e.target.value })}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className="chips">
          {chips.map((c) => (
            <button key={c.label} className="chip" onClick={() => removeChip(c.keys)} aria-label={`Remove filter ${c.label}`}>
              {c.label} <X size={14} />
            </button>
          ))}
          <button className="link-btn" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      <div className="shop-layout">
        <aside className={`filters ${showFilters ? 'open' : ''}`} aria-label="Filters">
          <div className="filters-head">
            <h2>Filters</h2>
            <button className="icon-btn filters-close" onClick={() => setShowFilters(false)} aria-label="Close filters">
              <X size={20} />
            </button>
          </div>

          <div className="filter-group">
            <h3>Category</h3>
            <ul className="cat-list">
              <li>
                <button className={!category ? 'active' : ''} onClick={() => update({ category: '' })}>
                  All {dept ? deptLabel(dept) : ''} <span>{categories.reduce((n, [, c]) => n + c, 0)}</span>
                </button>
              </li>
              {categories.map(([slug, n]) => (
                <li key={slug}>
                  <button className={category === slug ? 'active' : ''} onClick={() => update({ category: slug })}>
                    {prettyCategory(slug)} <span>{n}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="filter-group">
            <h3>
              Max price <span className="muted">{formatPrice(maxPrice)}</span>
            </h3>
            <input
              type="range"
              min="10"
              max={priceCeil}
              step="10"
              value={Math.min(maxPrice, priceCeil)}
              onChange={(e) => update({ max: Number(e.target.value) >= priceCeil ? '' : e.target.value })}
              aria-label="Maximum price"
            />
          </div>

          <div className="filter-group">
            <h3>Minimum rating</h3>
            <div className="pill-row">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  className={`pill ${minRating === r ? 'active' : ''}`}
                  onClick={() => update({ rating: r ? String(r) : '' })}
                >
                  {r ? `${r}★+` : 'Any'}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-ghost btn-block" onClick={clearAll}>
            Clear all filters
          </button>
          <button className="btn btn-primary btn-block filters-apply" onClick={() => setShowFilters(false)}>
            Show {filtered.length} results
          </button>
        </aside>
        {showFilters && <div className="filters-overlay" onClick={() => setShowFilters(false)} />}

        <section aria-live="polite">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <ProductGridSkeleton count={9} />
          ) : filtered.length === 0 ? (
            <div className="state-box">
              <h2>No products match your filters</h2>
              <p>Try a different search term or remove some filters.</p>
              <button className="btn btn-primary" onClick={clearAll}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid-products">
                {filtered.slice(0, visible).map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="load-more">
                  <button className="btn btn-ghost btn-lg" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more ({filtered.length - visible} left)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
