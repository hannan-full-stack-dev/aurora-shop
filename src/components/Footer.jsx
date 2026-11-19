import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import { DEPARTMENTS } from '../utils';
import { catalogSource } from '../api';
import useProducts from '../hooks/useProducts';

const SOURCE_LABEL = {
  'products.json': 'Catalogue source: products.json (real data)',
  'dummyjson-live': 'Catalogue source: DummyJSON live (real data)',
  failed: 'Catalogue failed to load, open the browser console (F12) to see why.',
};

export default function Footer() {
  const { products, loading } = useProducts();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-mark" aria-hidden="true">
              ✦
            </span>
            Aurora
          </Link>
          <p className="footer-blurb">
            Everything you’ll want next. A demo storefront built to show off modern React patterns.
          </p>
        </div>
        <div>
          <h4>Departments</h4>
          <ul>
            {DEPARTMENTS.slice(0, 5).map((d) => (
              <li key={d.slug}>
                <Link to={`/shop?dept=${d.slug}`}>{d.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Discover</h4>
          <ul>
            <li>
              <Link to="/shop?sort=new">New arrivals</Link>
            </li>
            <li>
              <Link to="/shop?sort=discount">Best deals</Link>
            </li>
            <li>
              <Link to="/shop?sort=rating">Top rated</Link>
            </li>
            <li>
              <Link to="/wishlist">Wishlist</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Built with</h4>
          <ul>
            <li>React 18 + Vite</li>
            <li>React Router v6</li>
            <li>Context + useReducer</li>
            <li>{loading || !products.length ? 'Real products with real photos' : `${products.length} real products with real photos`}</li>
            {!loading && <li>{SOURCE_LABEL[catalogSource] || catalogSource}</li>}
          </ul>
        </div>
      </div>

      <Reveal className="wordmark" aria-hidden="true">
        Aurora
      </Reveal>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Aurora · Demo project, no real orders are placed. Product data and photos from DummyJSON, Fake Store API, Open Food Facts and Open Beauty Facts (ODbL / CC BY-SA); prices and stock are illustrative.</span>
        <span>
          Promo code <strong>AURORA10</strong>
        </span>
      </div>
    </footer>
  );
}
