import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import CountUp from '../components/CountUp';
import Countdown from '../components/Countdown';
import RotatingBadge from '../components/RotatingBadge';
import useProducts from '../hooks/useProducts';
import useTitle from '../hooks/useTitle';
import { useStore } from '../context/StoreContext';
import { DEPARTMENTS, formatPrice } from '../utils';

const HEADLINE = [
  [{ t: 'Everything' }],
  [{ t: 'you’ll' }, { t: 'want', hl: true }],
  [{ t: 'next.' }],
];

const PERKS = [
  { icon: Truck, title: 'Free shipping', text: 'On orders over $100' },
  { icon: RotateCcw, title: 'Easy returns', text: '30-day return window' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Validated, encrypted forms' },
  { icon: Headphones, title: 'Friendly support', text: 'We reply within a day' },
];

function Hero({ products, loading }) {
  const ref = useRef(null);

  const picks = useMemo(
    () =>
      ['fashion', 'tech', 'beauty']
        .map((d) => products.filter((p) => p.dept === d).sort((a, b) => b.rating - a.rating)[0])
        .filter(Boolean),
    [products]
  );
  const avgRating = useMemo(
    () => (products.length ? products.reduce((s, p) => s + p.rating, 0) / products.length : 0),
    [products]
  );
  const deptCount = useMemo(() => new Set(products.map((p) => p.dept)).size, [products]);

  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const s = ref.current.style;
    s.setProperty('--sx', `${x * 100}%`);
    s.setProperty('--sy', `${y * 100}%`);
    s.setProperty('--px', ((x - 0.5) * 2).toFixed(3));
    s.setProperty('--py', ((y - 0.5) * 2).toFixed(3));
  };

  let wordIndex = 0;

  return (
    <section className="hero" ref={ref} onPointerMove={onMove}>
      <span className="blob blob-1" aria-hidden="true" />
      <span className="blob blob-2" aria-hidden="true" />
      <span className="blob blob-3" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="dot" /> New season · fresh drops weekly
          </span>

          <h1 className="hero-title" aria-label="Everything you’ll want next.">
            {HEADLINE.map((line, li) => (
              <span className="line" key={li} aria-hidden="true">
                {line.map((w) => {
                  const i = wordIndex++;
                  return (
                    <span className={`word ${w.hl ? 'hl' : ''}`} key={w.t}>
                      <span style={{ '--i': i }}>{w.t}</span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>

          <p className="hero-sub">
            Fashion, tech, home, beauty and more — curated, fairly priced and one tap from your door. Fast browsing,
            instant search and a checkout that just works.
          </p>

          <div className="hero-cta">
            <Link to="/shop?sort=new" className="btn btn-primary btn-lg cta-arrow">
              Shop new arrivals <ArrowRight size={18} />
            </Link>
            <a href="#departments" className="btn btn-ghost btn-lg">
              Browse departments
            </a>
          </div>

          <ul className="hero-stats">
            <li>
              <strong>{products.length ? <CountUp to={products.length} /> : '—'}</strong>
              <span>products</span>
            </li>
            <li>
              <strong>{deptCount ? <CountUp to={deptCount} /> : '—'}</strong>
              <span>departments</span>
            </li>
            <li>
              <strong>{avgRating ? <CountUp to={avgRating} decimals={1} suffix="★" /> : '—'}</strong>
              <span>avg. rating</span>
            </li>
          </ul>
        </div>

        <div className="hero-art">
          {(picks.length ? picks : [null, null, null]).map((p, i) => {
            const body = (
              <span className="float" style={{ '--bd': `${i * -1.4}s` }}>
                <span className="hc-media" data-dept={p?.dept}>
                  {p ? <img src={p.thumbnail} alt={p.title} /> : <span className="sk-block hc-skel" />}
                </span>
                <span className="hc-title">{p ? p.title : loading ? 'Loading…' : ''}</span>
                <b>{p ? formatPrice(p.price) : ''}</b>
              </span>
            );
            return p ? (
              <Link key={p.id} to={`/product/${p.id}`} className={`hc hc-${i}`}>
                {body}
              </Link>
            ) : (
              <div key={i} className={`hc hc-${i}`}>
                {body}
              </div>
            );
          })}
          <RotatingBadge className="hero-badge" size={128} center="✦" />
        </div>
      </div>
    </section>
  );
}

function SectionHead({ index, title, to, cta }) {
  return (
    <Reveal className="section-head">
      <div>
        <span className="kicker">({index})</span>
        <h2>{title}</h2>
      </div>
      {to && (
        <Link to={to} className="link-arrow">
          {cta} <ArrowRight size={16} />
        </Link>
      )}
    </Reveal>
  );
}

function Rail({ items, loading, label }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  return (
    <div className="rail-wrap container">
      <div className="rail-btns">
        <button className="icon-btn ring" onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}>
          <ChevronLeft size={20} />
        </button>
        <button className="icon-btn ring" onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="rail" ref={ref} tabIndex={0} aria-label={label}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div className="card skeleton rail-item" key={i}>
                <div className="card-media sk-block" />
                <div className="card-body">
                  <div className="sk-line w60" />
                  <div className="sk-line w90" />
                </div>
              </div>
            ))
          : items.map((p, i) => (
              <div className="rail-item" key={p.id}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
      </div>
    </div>
  );
}

export default function Home() {
  useTitle();
  const { products, loading, error, reload } = useProducts();
  const { notify } = useStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const newest = useMemo(
    () =>
      products
        .filter((p) => p.isNew)
        .sort((a, b) => b.id - a.id)
        .slice(0, 14),
    [products]
  );
  const latestOf = (test, n = 14) => products.filter(test).sort((a, b) => b.id - a.id).slice(0, n);
  const phones = useMemo(() => latestOf((p) => p.category === 'smartphones'), [products]);
  const laptops = useMemo(() => latestOf((p) => p.category === 'laptops'), [products]);
  const fashion = useMemo(() => latestOf((p) => p.dept === 'fashion'), [products]);
  const topRated = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating || (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, 8),
    [products]
  );
  const deals = useMemo(
    () => [...products].sort((a, b) => b.discountPercentage - a.discountPercentage).slice(0, 4),
    [products]
  );
  const tiles = useMemo(
    () =>
      DEPARTMENTS.map((d) => {
        const items = products.filter((p) => p.dept === d.slug);
        const best = [...items].sort((a, b) => b.rating - a.rating)[0];
        return { ...d, count: items.length, image: best?.thumbnail };
      }).filter((d) => d.count > 0),
    [products]
  );

  const subscribe = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setEmail('');
    notify('Thanks for subscribing! 🎉');
  };

  return (
    <>
      <Hero products={products} loading={loading} />

      <div className="band" aria-hidden="true">
        <Marquee speed={45} pauseOnHover={false} className="big-marquee">
          {DEPARTMENTS.map((d) => (
            <span key={d.slug} className="band-item">
              {d.label} <b>✦</b>
            </span>
          ))}
        </Marquee>
      </div>

      <section className="container perks">
        {PERKS.map(({ icon: Icon, title, text }, i) => (
          <Reveal className="perk" key={title} delay={i * 80}>
            <Icon size={24} />
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </Reveal>
        ))}
      </section>

      {error ? (
        <div className="container section">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <>
          <section className="container section" id="departments">
            <SectionHead index="01" title="Shop by department" to="/shop" cta="All products" />
            <div className="bento">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="tile sk-block" />)
                : tiles.map((d, i) => (
                    <Reveal key={d.slug} delay={(i % 3) * 90} className={`tile-wrap t${i}`}>
                      <Link to={`/shop?dept=${d.slug}`} className="tile" data-dept={d.slug}>
                        <span className="tile-top">
                          <small>{String(d.count).padStart(2, '0')} items</small>
                          <span className="tile-arrow">
                            <ArrowUpRight size={20} />
                          </span>
                        </span>
                        {d.image && <img className="tile-img" src={d.image} alt="" loading="lazy" />}
                        <span className="tile-label">
                          <strong>{d.label}</strong>
                          <span>{d.blurb}</span>
                        </span>
                      </Link>
                    </Reveal>
                  ))}
            </div>
          </section>

          <section className="section">
            <div className="container">
              <SectionHead index="02" title="Just dropped" to="/shop?sort=new" cta="See all new" />
            </div>
            <Rail items={newest} loading={loading} label="New arrivals" />
          </section>

          <section className="section">
            <div className="container">
              <SectionHead index="03" title="Latest smartphones" to="/shop?category=smartphones&sort=new" cta="All phones" />
            </div>
            <Rail items={phones} loading={loading} label="Latest smartphones" />
          </section>

          <section className="section">
            <div className="container">
              <SectionHead index="04" title="Latest laptops" to="/shop?category=laptops&sort=new" cta="All laptops" />
            </div>
            <Rail items={laptops} loading={loading} label="Latest laptops" />
          </section>

          <section className="section">
            <div className="container">
              <SectionHead index="05" title="The fashion edit" to="/shop?dept=fashion&sort=new" cta="Shop fashion" />
            </div>
            <Rail items={fashion} loading={loading} label="Fashion edit" />
          </section>

          <section className="container section">
            <Reveal className="deal">
              <div className="deal-copy">
                <span className="eyebrow dark">Deal of the day</span>
                <h2>Extra 10% off. Today only.</h2>
                <p>
                  Use code <strong>AURORA10</strong> at checkout. Free shipping unlocks over $100.
                </p>
                <Countdown />
                <Link to="/shop?sort=discount" className="btn btn-primary btn-lg cta-arrow">
                  Shop the deals <ArrowRight size={18} />
                </Link>
              </div>
              <RotatingBadge
                className="deal-badge"
                size={150}
                text="BIGGEST DEALS ✦ LIMITED TIME ✦ SAVE MORE ✦ "
                center="%"
              />
            </Reveal>
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="grid-products deals-row">
                {deals.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </section>

          <section className="container section">
            <SectionHead index="06" title="Customer favourites" to="/shop?sort=rating" cta="Top rated" />
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <div className="grid-products">
                {topRated.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="container section">
        <Reveal as="form" className="newsletter" onSubmit={subscribe} noValidate>
          <div>
            <h2>Get 10% off your first order.</h2>
            <p className="muted">Join the list for new drops and member-only offers. No spam, ever.</p>
          </div>
          <div className="newsletter-field">
            <div className={`field ${emailError ? 'invalid' : ''}`}>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </div>
            <button className="btn btn-dark" type="submit">
              Subscribe
            </button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
