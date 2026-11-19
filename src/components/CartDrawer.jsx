import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import QtyStepper from './QtyStepper';
import { FREE_SHIPPING_AT, formatPrice } from '../utils';

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, subtotal, setQty, removeFromCart } = useStore();

  useEffect(() => {
    if (!cartOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [cartOpen, closeCart]);

  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100);

  return (
    <div className={`drawer-root ${cartOpen ? 'open' : ''}`}>
      <div className="drawer-overlay" onClick={closeCart} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="drawer-head">
          <h2>Your cart</h2>
          <button className="icon-btn" onClick={closeCart} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="drawer-empty">
            <ShoppingBag size={40} />
            <p>Your cart is empty.</p>
            <Link to="/shop" className="btn btn-primary" onClick={closeCart}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="ship-progress">
              <p>
                {remaining > 0 ? (
                  <>
                    Add <strong>{formatPrice(remaining)}</strong> more for free shipping
                  </>
                ) : (
                  <strong>You’ve unlocked free shipping 🎉</strong>
                )}
              </p>
              <div className="bar">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>

            <ul className="drawer-items">
              {cart.map((item, idx) => (
                <li key={item.id} className="cart-row" style={{ '--i': idx }}>
                  <Link to={`/product/${item.id}`} onClick={closeCart}>
                    <img src={item.thumbnail} alt={item.title} width="72" height="72" />
                  </Link>
                  <div className="cart-info">
                    <Link to={`/product/${item.id}`} onClick={closeCart} className="cart-title">
                      {item.title}
                    </Link>
                    <span className="muted">{formatPrice(item.price)}</span>
                    <QtyStepper value={item.qty} max={item.stock} onChange={(q) => setQty(item.id, q)} />
                  </div>
                  <div className="cart-side">
                    <strong>{formatPrice(item.price * item.qty)}</strong>
                    <button
                      className="icon-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="drawer-foot">
              <div className="row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <p className="muted small">Shipping and discounts are calculated at checkout.</p>
              <Link to="/checkout" className="btn btn-primary btn-block" onClick={closeCart}>
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
