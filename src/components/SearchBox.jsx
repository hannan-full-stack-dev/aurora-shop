import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Clock, Search, Tag, TrendingUp, X } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import { formatPrice, prettyCategory } from '../utils';

// Search-as-you-type box: ranked product matches, category matches, recent + trending searches,
// full keyboard support (↑ ↓ Enter Esc, "/" to focus) and ARIA combobox semantics.

const RECENT_KEY = 'aurora-recent-v1';
const TRENDING = ['iPhone 17', 'Galaxy S26', 'MacBook', 'Trench coat', 'Perfume', 'Sneakers'];

function readRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(v) ? v.slice(0, 5) : [];
  } catch {
    return [];
  }
}
function writeRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

function score(p, t) {
  const title = p.title.toLowerCase();
  const brand = (p.brand || '').toLowerCase();
  let s = 0;
  if (title.startsWith(t)) s += 100;
  else if (title.split(/\s+/).some((w) => w.startsWith(t))) s += 70;
  else if (title.includes(t)) s += 40;
  if (brand.startsWith(t)) s += 50;
  else if (brand.includes(t)) s += 20;
  if (p.tags?.some((x) => x.toLowerCase().startsWith(t))) s += 25;
  if (p.category.replace(/-/g, ' ').includes(t)) s += 15;
  return s > 0 ? s + p.rating : 0; // rating breaks ties
}

function Highlight({ text, term }) {
  const i = term ? text.toLowerCase().indexOf(term) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}

const ICONS = { recent: Clock, trend: TrendingUp, search: Search };

export default function SearchBox({ autoFocus = false, className = '', onDone }) {
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState(readRecent);
  const wrap = useRef(null);
  const input = useRef(null);
  const listId = useId().replace(/:/g, '');
  const term = value.trim().toLowerCase();

  const { groups, flat } = useMemo(() => {
    const flatList = [];
    const grouped = [];
    const add = (title, items) => {
      if (!items.length) return;
      grouped.push({ title, start: flatList.length, items });
      flatList.push(...items);
    };

    if (!term) {
      add('Recent', recent.map((label) => ({ type: 'query', label, icon: 'recent' })));
      add('Trending', TRENDING.map((label) => ({ type: 'query', label, icon: 'trend' })));
    } else {
      const prods = products
        .map((p) => ({ p, s: score(p, term) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 6)
        .map(({ p }) => ({ type: 'product', product: p }));

      const counts = new Map();
      products.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
      const cats = new Map();
      counts.forEach((n, slug) => {
        if (prettyCategory(slug).toLowerCase().includes(term)) cats.set(slug, n);
      });
      const catItems = [...cats.entries()].slice(0, 3).map(([slug, count]) => ({ type: 'category', slug, count }));

      add('Products', prods);
      add('Categories', catItems);
      add('', [{ type: 'query', label: value.trim(), icon: 'search', full: true }]);
    }
    return { groups: grouped, flat: flatList };
  }, [term, products, recent, value]);

  // close on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // "/" focuses the search box from anywhere
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && input.current?.offsetParent !== null) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // keep the highlighted option visible
  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const finish = () => {
    setOpen(false);
    input.current?.blur();
    onDone?.();
  };

  const runSearch = (label) => {
    const v = (label || '').trim();
    if (!v) {
      navigate('/shop');
      finish();
      return;
    }
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 5);
    setRecent(next);
    writeRecent(next);
    setValue(v);
    navigate(`/shop?q=${encodeURIComponent(v)}`);
    finish();
  };

  const choose = (item) => {
    if (!item) {
      runSearch(value);
    } else if (item.type === 'product') {
      setValue('');
      navigate(`/product/${item.product.id}`);
      finish();
    } else if (item.type === 'category') {
      setValue('');
      navigate(`/shop?category=${item.slug}`);
      finish();
    } else {
      runSearch(item.label);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % Math.max(flat.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? flat.length - 1 : a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active >= 0 ? flat[active] : null);
    } else if (e.key === 'Escape') {
      if (open) setOpen(false);
      else {
        setValue('');
        input.current?.blur();
      }
    }
  };

  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

  return (
    <div className={`searchbox ${open ? 'open' : ''} ${className}`} ref={wrap}>
      <div className="search">
        <Search size={18} aria-hidden="true" />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-label="Search products"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck="false"
          autoFocus={autoFocus}
          placeholder="Search products, brands, categories…"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
        />
        {value ? (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setValue('');
              setActive(-1);
              input.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        ) : (
          <kbd className="kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </div>

      {open && (
        <div className="suggest" role="listbox" id={listId} onMouseDown={(e) => e.preventDefault()}>
          {term && loading && <p className="suggest-note">Loading catalogue…</p>}

          {groups.map((g) => (
            <div className="suggest-group" key={g.title || 'all'}>
              {g.title && (
                <div className="suggest-title">
                  <span>{g.title}</span>
                  {g.title === 'Recent' && (
                    <button type="button" onClick={clearRecent}>
                      Clear
                    </button>
                  )}
                </div>
              )}
              {g.items.map((item, i) => {
                const idx = g.start + i;
                const Icon = ICONS[item.icon] || Search;
                return (
                  <div
                    key={`${item.type}-${item.product?.id || item.slug || item.label}`}
                    id={`${listId}-${idx}`}
                    role="option"
                    aria-selected={idx === active}
                    className={`suggest-item ${item.type} ${idx === active ? 'active' : ''}`}
                    style={{ '--i': i }}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => choose(item)}
                  >
                    {item.type === 'product' && (
                      <>
                        <span className="s-thumb" data-dept={item.product.dept}>
                          <img src={item.product.thumbnail} alt="" loading="lazy" />
                        </span>
                        <span className="s-main">
                          <strong>
                            <Highlight text={item.product.title} term={term} />
                          </strong>
                          <small>{item.product.brand || prettyCategory(item.product.category)}</small>
                        </span>
                        <span className="s-price">{formatPrice(item.product.price)}</span>
                      </>
                    )}
                    {item.type === 'category' && (
                      <>
                        <span className="s-icon">
                          <Tag size={16} />
                        </span>
                        <span className="s-main">
                          <strong>
                            <Highlight text={prettyCategory(item.slug)} term={term} />
                          </strong>
                          <small>{item.count} products</small>
                        </span>
                        <ArrowUpRight size={16} className="s-go" />
                      </>
                    )}
                    {item.type === 'query' && (
                      <>
                        <span className="s-icon">
                          <Icon size={16} />
                        </span>
                        <span className="s-main">
                          <strong>{item.full ? `Search for “${item.label}”` : item.label}</strong>
                        </span>
                        <ArrowUpRight size={16} className="s-go" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {term && !loading && flat.length === 1 && (
            <p className="suggest-note">No close matches — try another word or browse all products.</p>
          )}

          <div className="suggest-foot" aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>↵</kbd> select
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
