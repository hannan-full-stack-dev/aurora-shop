import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import Confetti from '../components/Confetti';
import { saveOrder } from '../orders';
import useTitle from '../hooks/useTitle';
import { PROMO_CODE, calcTotals, formatPrice } from '../utils';

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'India',
  'Bangladesh',
  'United Arab Emirates',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const initialValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  postal: '',
  country: COUNTRIES[0],
  payment: 'card',
  advanceMethod: 'card',
  walletNumber: '',
  trxId: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

function validate(v) {
  const e = {};
  if (!EMAIL_RE.test(v.email)) e.email = 'Enter a valid email address';
  if (!v.firstName.trim()) e.firstName = 'Enter your first name';
  if (!v.lastName.trim()) e.lastName = 'Enter your last name';
  if (v.phone && !/^[+\d][\d\s()-]{6,}$/.test(v.phone)) e.phone = 'Enter a valid phone number';
  if (v.address.trim().length < 5) e.address = 'Enter your street address';
  if (!v.city.trim()) e.city = 'Enter your city';
  if (v.postal.trim().length < 3) e.postal = 'Enter a postal code';
  const cod = v.payment === 'cod';
  if (v.payment === 'card' || (cod && v.advanceMethod === 'card')) {
    if (!/^\d{15,16}$/.test(v.cardNumber.replace(/\s/g, ''))) e.cardNumber = 'Enter a valid card number';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.expiry)) e.expiry = 'Use MM/YY';
    if (!/^\d{3,4}$/.test(v.cvc)) e.cvc = '3–4 digits';
  }
  if (cod && v.advanceMethod !== 'card') {
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(v.walletNumber.replace(/[\s-]/g, ''))) e.walletNumber = 'Enter a valid mobile number (01XXXXXXXXX)';
    if (!/^[A-Z0-9]{8,12}$/.test(v.trxId)) e.trxId = 'Enter the 8–12 character transaction ID';
  }
  return e;
}

const formatCard = (s) => s.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (s) => {
  const d = s.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const digitsOnly4 = (s) => s.replace(/\D/g, '').slice(0, 4);
const formatTrx = (s) => s.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12);
const WALLETS = { card: 'Card', bkash: 'bKash', nagad: 'Nagad' };

export default function Checkout() {
  useTitle('Checkout');
  const { cart, subtotal, clearCart } = useStore();

  const { user } = useAuth();
  const [values, setValues] = useState(() => {
    const [first = '', ...rest] = (user?.name || '').split(' ');
    return { ...initialValues, email: user?.email || '', firstName: first, lastName: rest.join(' ') };
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);

  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const errors = useMemo(() => validate(values), [values]);
  const totals = calcTotals(subtotal, promoApplied, values.payment);

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const show = (name) => (touched[name] || submitted) && errors[name];

  const input = (name, label, { format, ...rest } = {}) => (
    <div className={`field ${show(name) ? 'invalid' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={values[name]}
        onChange={(e) => set(name, format ? format(e.target.value) : e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, [name]: true }))}
        aria-invalid={!!show(name)}
        aria-describedby={show(name) ? `${name}-err` : undefined}
        {...rest}
      />
      {show(name) && (
        <span className="field-error" id={`${name}-err`}>
          {errors[name]}
        </span>
      )}
    </div>
  );

  const cardFields = (
    <>
      {input('cardNumber', 'Card number', {
        inputMode: 'numeric',
        autoComplete: 'cc-number',
        placeholder: '1234 5678 9012 3456',
        format: formatCard,
      })}
      <div className="field-row">
        {input('expiry', 'Expiry', { inputMode: 'numeric', autoComplete: 'cc-exp', placeholder: 'MM/YY', format: formatExpiry })}
        {input('cvc', 'CVC', { inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123', format: digitsOnly4 })}
      </div>
      <p className="muted small">Card details are only validated in your browser and never stored or sent.</p>
    </>
  );

  const applyPromo = (e) => {
    e.preventDefault();
    if (promo.trim().toUpperCase() === PROMO_CODE) {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoApplied(false);
      setPromoError('That code isn’t valid.');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1100)); // simulated network call
    const placed = {
      id: `AUR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      email: values.email,
      items: cart,
      totals,
      subtotal,
      payment: values.payment,
      advanceMethod: values.payment === 'cod' ? values.advanceMethod : 'card',
      status: 'confirmed',
    };
    saveOrder({
      ...placed,
      userEmail: user?.email || 'guest',
      date: new Date().toISOString(),
      city: values.city,
      country: values.country,
    });
    setOrder(placed);
    clearCart();
    setPlacing(false);
    window.scrollTo(0, 0);
  };

  if (order) {
    return (
      <div className="container page">
        <Confetti />
        <div className="confirm">
          <CheckCircle2 size={56} />
          <h1>Thank you for your order!</h1>
          <p className="muted">
            Order <strong>{order.id}</strong> is confirmed. A receipt would be sent to{' '}
            <strong>{order.email}</strong>.
          </p>
          <ul className="confirm-items">
            {order.items.map((i) => (
              <li key={i.id}>
                <img src={i.thumbnail} alt="" width="48" height="48" />
                <span>
                  {i.title} <span className="muted">× {i.qty}</span>
                </span>
                <strong>{formatPrice(i.price * i.qty)}</strong>
              </li>
            ))}
          </ul>
          {order.payment === 'cod' ? (
            <>
              <div className="row total">
                <span>Paid now (delivery fee)</span>
                <strong>{formatPrice(order.totals.payNow)}</strong>
              </div>
              <div className="row">
                <span>Pay in cash on delivery</span>
                <strong>{formatPrice(order.totals.payOnDelivery)}</strong>
              </div>
              <p className="muted small">The delivery fee is non-refundable if the order is cancelled or refused on delivery.</p>
            </>
          ) : (
            <div className="row total">
              <span>Total paid</span>
              <strong>{formatPrice(order.totals.total)}</strong>
            </div>
          )}
          <div className="confirm-actions">
            <Link to="/shop" className="btn btn-primary btn-lg">
              Continue shopping
            </Link>
            {user && (
              <Link to="/account" className="btn btn-ghost btn-lg">
                View my orders
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container page">
        <div className="state-box">
          <h2>Your cart is empty</h2>
          <p>Add a few items before heading to checkout.</p>
          <Link to="/shop" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Checkout</h1>
        <p className="muted">
          <Lock size={14} /> Demo checkout — no real payment is processed.
        </p>
      </div>

      <div className="checkout-grid">
        <form onSubmit={onSubmit} noValidate className="checkout-form">
          <fieldset>
            <legend>Contact</legend>
            {input('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
          </fieldset>

          <fieldset>
            <legend>Shipping address</legend>
            <div className="field-row">
              {input('firstName', 'First name', { autoComplete: 'given-name' })}
              {input('lastName', 'Last name', { autoComplete: 'family-name' })}
            </div>
            {input('address', 'Address', { autoComplete: 'street-address' })}
            <div className="field-row">
              {input('city', 'City', { autoComplete: 'address-level2' })}
              {input('postal', 'Postal code', { autoComplete: 'postal-code' })}
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="country">Country</label>
                <select id="country" value={values.country} onChange={(e) => set('country', e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {input('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel' })}
            </div>
          </fieldset>

          <fieldset>
            <legend>Payment</legend>
            <div className="pay-options">
              <label className={values.payment === 'card' ? 'active' : ''}>
                <input
                  type="radio"
                  name="payment"
                  checked={values.payment === 'card'}
                  onChange={() => set('payment', 'card')}
                />
                Credit / debit card
              </label>
              <label className={values.payment === 'cod' ? 'active' : ''}>
                <input
                  type="radio"
                  name="payment"
                  checked={values.payment === 'cod'}
                  onChange={() => set('payment', 'cod')}
                />
                Cash on delivery
              </label>
            </div>

            {values.payment === 'card' && cardFields}

            {values.payment === 'cod' && (
              <div className="cod-box">
                <p>
                  <strong>Pay the delivery fee ({formatPrice(totals.payNow)}) now.</strong> The remaining{' '}
                  <strong>{formatPrice(totals.payOnDelivery)}</strong> is paid in cash when your order arrives.
                </p>
                <p className="muted small">
                  The delivery fee is non-refundable if you cancel the order or refuse delivery. This keeps fake orders away so real
                  orders ship faster.
                </p>
                <div className="pay-options pay-options-sm" role="radiogroup" aria-label="Pay the delivery fee with">
                  {Object.entries(WALLETS).map(([id, label]) => (
                    <label key={id} className={values.advanceMethod === id ? 'active' : ''}>
                      <input type="radio" name="advanceMethod" checked={values.advanceMethod === id} onChange={() => set('advanceMethod', id)} />
                      {label}
                    </label>
                  ))}
                </div>
                {values.advanceMethod === 'card' ? (
                  cardFields
                ) : (
                  <>
                    {input('walletNumber', `Your ${WALLETS[values.advanceMethod]} number`, {
                      type: 'tel',
                      inputMode: 'numeric',
                      placeholder: '01XXXXXXXXX',
                      autoComplete: 'tel-national',
                    })}
                    {input('trxId', 'Transaction ID (TrxID)', { placeholder: 'e.g. 9A7B6C5D4E', format: formatTrx })}
                    <p className="muted small">
                      Send the delivery fee to our {WALLETS[values.advanceMethod]} merchant number, then enter the TrxID. (Demo: nothing is
                      really sent.)
                    </p>
                  </>
                )}
              </div>
            )}
          </fieldset>

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={placing}>
            {placing
              ? 'Placing order…'
              : values.payment === 'cod'
                ? `Pay ${formatPrice(totals.payNow)} delivery fee & place order`
                : `Place order · ${formatPrice(totals.total)}`}
          </button>
        </form>

        <aside className="summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {cart.map((i) => (
              <li key={i.id}>
                <div className="thumb">
                  <img src={i.thumbnail} alt="" width="56" height="56" />
                  <span className="qty-badge">{i.qty}</span>
                </div>
                <span className="summary-title">{i.title}</span>
                <strong>{formatPrice(i.price * i.qty)}</strong>
              </li>
            ))}
          </ul>

          <form className="promo" onSubmit={applyPromo}>
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Promo code (try AURORA10)"
              aria-label="Promo code"
            />
            <button className="btn btn-ghost" type="submit">
              Apply
            </button>
          </form>
          {promoError && <p className="field-error">{promoError}</p>}
          {promoApplied && <p className="promo-ok">Code {PROMO_CODE} applied — 10% off.</p>}

          <div className="row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="row discount">
              <span>Discount</span>
              <span>-{formatPrice(totals.discount)}</span>
            </div>
          )}
          <div className="row">
            <span>Shipping</span>
            <span>{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span>
          </div>
          <div className="row total">
            <span>Total</span>
            <strong>{formatPrice(totals.total)}</strong>
          </div>
          {values.payment === 'cod' && (
            <>
              <div className="row cod-row">
                <span>Pay now (delivery fee)</span>
                <strong>{formatPrice(totals.payNow)}</strong>
              </div>
              <div className="row cod-row">
                <span>Pay in cash on delivery</span>
                <strong>{formatPrice(totals.payOnDelivery)}</strong>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
