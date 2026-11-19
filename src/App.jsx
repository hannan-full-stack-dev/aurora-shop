import { lazy, Suspense, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import ScrollUI from './components/ScrollUI';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext';

const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Account = lazy(() => import('./pages/Account'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Scroll to the top on every page change AND when a link only changes the query string
// (e.g. footer links like /shop?dept=tech while you are already on /shop, otherwise the grid
// updates far above the footer and it looks like the click did nothing).
// The Shop page's own filter/sort updates use "replace", so they do not jump the page.
function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  const prev = useRef(pathname);
  useEffect(() => {
    const pathChanged = prev.current !== pathname;
    prev.current = pathname;
    if (pathChanged || navType !== 'REPLACE') window.scrollTo(0, 0);
  }, [pathname, search, navType]);
  return null;
}

// Pages that need a signed-in user redirect to /login (and come back afterwards).
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <ScrollUI />
      <Header />
      <main id="main">
        <Suspense fallback={<div className="container page-loader">Loading…</div>}>
          {/* keyed by pathname so every route change replays the page-enter animation */}
          <div key={location.pathname} className="page-anim">
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
    </>
  );
}
