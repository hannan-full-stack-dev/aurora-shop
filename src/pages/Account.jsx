import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Package } from 'lucide-react';
import TextField from '../components/TextField';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import useTitle from '../hooks/useTitle';
import { cancelOrder, getOrders, paidAmount } from '../orders';
import { formatDate, formatPrice } from '../utils';

export default function Account() {
  useTitle('My account');
  const { user, logout, updateProfile } = useAuth();
  const { wishlist, notify } = useStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('orders');
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState(() => getOrders().filter((o) => o.userEmail === user.email));
  const [confirmId, setConfirmId] = useState(null);
  // Cancelled orders only count the non-refundable fee that was kept.
  const spent = orders.reduce((sum, o) => sum + (o.status === 'cancelled' ? o.feeKept || 0 : o.totals?.total || 0), 0);

  const onCancel = (id) => {
    const done = cancelOrder(id);
    setConfirmId(null);
    if (!done) return;
    setOrders((list) => list.map((o) => (o.id === id ? done : o)));
    notify(done.feeKept > 0 ? `Order cancelled. The ${formatPrice(done.feeKept)} delivery fee is non-refundable.` : 'Order cancelled and refunded.');
  };

  const save = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError('Enter your name');
      return;
    }
    setNameError('');
    setSaving(true);
    await updateProfile({ name });
    setSaving(false);
    notify('Profile updated');
  };

  const signOut = () => {
    logout();
    notify('Signed out. See you soon!');
    navigate('/');
  };

  return (
    <div className="container page">
      <Reveal className="account-hero">
        <span className="avatar-lg" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <span className="kicker">My account</span>
          <h1>Hi, {user.name.split(' ')[0]}</h1>
          <p className="muted">
            {user.email} · member since {formatDate(user.createdAt)}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={signOut}>
          <LogOut size={16} /> Sign out
        </button>
      </Reveal>

      <div className="stat-cards">
        <Reveal className="stat-card" delay={0}>
          <strong>
            <CountUp to={orders.length} />
          </strong>
          <span>orders</span>
        </Reveal>
        <Reveal className="stat-card" delay={90}>
          <strong>${<CountUp to={spent} decimals={2} />}</strong>
          <span>total spent</span>
        </Reveal>
        <Reveal className="stat-card" delay={180}>
          <strong>
            <CountUp to={wishlist.length} />
          </strong>
          <span>saved items</span>
        </Reveal>
      </div>

      <div className="tabs" role="tablist">
        {[
          ['orders', 'Orders'],
          ['profile', 'Profile'],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="tab-panel wide" role="tabpanel">
        {tab === 'orders' &&
          (orders.length === 0 ? (
            <div className="state-box">
              <Package size={36} />
              <h2>No orders yet</h2>
              <p>When you place an order while signed in, it shows up here.</p>
              <Link to="/shop" className="btn btn-primary">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="orders">
              {orders.map((o) => (
                <li key={o.id}>
                  <details>
                    <summary>
                      <span className="o-id">{o.id}</span>
                      <span className="muted">{formatDate(o.date)}</span>
                      <span className="o-count">{o.items.reduce((n, i) => n + i.qty, 0)} items</span>
                      <strong>{formatPrice(o.totals.total)}</strong>
                      <span className={`o-status ${o.status === 'cancelled' ? 'cancelled' : ''}`}>
                        {o.status === 'cancelled' ? 'Cancelled' : o.payment === 'cod' ? 'Confirmed · COD' : 'Confirmed'}
                      </span>
                    </summary>
                    <ul className="o-items">
                      {o.items.map((i) => (
                        <li key={i.id}>
                          <img src={i.thumbnail} alt="" width="48" height="48" />
                          <span>
                            {i.title} <span className="muted">× {i.qty}</span>
                          </span>
                          <strong>{formatPrice(i.price * i.qty)}</strong>
                        </li>
                      ))}
                    </ul>
                    {o.city && (
                      <p className="muted small o-ship">
                        Shipping to {o.city}, {o.country}
                      </p>
                    )}
                    <p className="muted small o-ship">
                      {o.payment === 'cod'
                        ? `Cash on delivery · delivery fee ${formatPrice(paidAmount(o))} paid in advance · ${formatPrice(o.totals.payOnDelivery ?? 0)} due in cash on delivery`
                        : `Paid ${formatPrice(paidAmount(o))} by card`}
                    </p>
                    {o.status === 'cancelled' ? (
                      <p className="small o-ship">
                        Cancelled on {formatDate(o.cancelledAt)}.{' '}
                        {o.feeKept > 0
                          ? `The ${formatPrice(o.feeKept)} delivery fee is non-refundable.`
                          : `Refunded ${formatPrice(o.refund || 0)}.`}
                      </p>
                    ) : confirmId === o.id ? (
                      <div className="cancel-box">
                        <p className="small">
                          {o.payment === 'cod'
                            ? `Cancel this order? The ${formatPrice(paidAmount(o))} delivery fee you paid in advance is non-refundable.`
                            : `Cancel this order? You will be refunded ${formatPrice(paidAmount(o))}.`}
                        </p>
                        <div className="cancel-actions">
                          <button type="button" className="btn btn-dark" onClick={() => onCancel(o.id)}>
                            Yes, cancel order
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => setConfirmId(null)}>
                            Keep order
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-ghost cancel-btn" onClick={() => setConfirmId(o.id)}>
                        Cancel order
                      </button>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'profile' && (
          <form onSubmit={save} noValidate className="auth-form profile-form">
            <TextField id="acc-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
            <TextField id="acc-email" label="Email" value={user.email} disabled readOnly />
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
