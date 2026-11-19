import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';
import Marquee from './Marquee';
import SearchBox from './SearchBox';
import { DEPARTMENTS } from '../utils';

const ANNOUNCE = [
  'Free shipping over $100',
  'Use code AURORA10 for 10% off',
  'New drops every week',
  '30-day easy returns',
  'Secure demo checkout',
];

export default function Header() {
  const { count, wishlist, openCart } = useStore();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [panel, setPanel] = useState(false); // false | 'menu' | 'search'
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setPanel(false);
  }, [pathname]);

  // hide on scroll down, reveal on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 260);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="announce">
        <Marquee speed={38}>
          {ANNOUNCE.map((t) => (
            <span className="announce-item" key={t}>
              {t} <b aria-hidden="true">✦</b>
            </span>
          ))}
        </Marquee>
      </div>

      <header className={`site-header ${hidden && !panel ? 'hide' : ''}`}>
        <div className="container header-inner">
          <button
            className="icon-btn menu-btn"
            aria-label="Toggle menu"
            aria-expanded={!!panel}
            onClick={() => setPanel((p) => (p ? false : 'menu'))}
          >
            {panel ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="logo">
            <span className="logo-mark" aria-hidden="true">
              ✦
            </span>
            Aurora
          </Link>

          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>
              Home
            </NavLink>

            <div className="nav-item has-mega">
              <NavLink to="/shop">
                Shop <ChevronDown size={15} className="chev" />
              </NavLink>
              <div className="mega">
                <div className="mega-panel">
                  <div className="mega-grid">
                    {DEPARTMENTS.map((d, i) => (
                      <Link key={d.slug} to={`/shop?dept=${d.slug}`} className="mega-link" style={{ '--i': i }}>
                        <strong>{d.label}</strong>
                        <span>{d.blurb}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mega-side">
                    <Link to="/shop?sort=new" className="mega-cta">
                      New arrivals <ArrowUpRight size={18} />
                    </Link>
                    <Link to="/shop?sort=discount" className="mega-cta alt">
                      Biggest deals <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <NavLink to="/wishlist">Wishlist</NavLink>
          </nav>

          <SearchBox className="desktop-search" />

          <div className="header-actions">
            <button className="icon-btn mobile-only" aria-label="Search" onClick={() => setPanel('search')}>
              <Search size={20} />
            </button>
            <button
              className="icon-btn theme-btn"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Sun size={20} className="sun" />
              <Moon size={20} className="moon" />
            </button>
            <Link to="/wishlist" className="icon-btn desktop-only" aria-label={`Wishlist, ${wishlist.length} items`}>
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="count-pill" key={wishlist.length}>
                  {wishlist.length}
                </span>
              )}
            </Link>
            {user ? (
              <Link to="/account" className="avatar-btn" aria-label="My account" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-ghost desktop-only signin">
                  Sign in
                </Link>
                <Link to="/login" className="icon-btn mobile-only" aria-label="Sign in">
                  <User size={20} />
                </Link>
              </>
            )}
            <button className="icon-btn cart-btn" data-cart-target onClick={openCart} aria-label={`Open cart, ${count} items`}>
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="count-pill" key={count}>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {panel && (
          <div className="mobile-panel container">
            <SearchBox autoFocus={panel === 'search'} onDone={() => setPanel(false)} />
            <nav aria-label="Mobile">
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/shop">All products</NavLink>
              <NavLink to="/wishlist">Wishlist</NavLink>
              {!user && <NavLink to="/register">Create account</NavLink>}
            </nav>
            <div className="mobile-depts">
              {DEPARTMENTS.map((d) => (
                <Link key={d.slug} to={`/shop?dept=${d.slug}`} className="pill">
                  {d.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
