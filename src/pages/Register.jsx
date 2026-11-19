import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import useTitle from '../hooks/useTitle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRENGTH = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

function strengthOf(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s += 1;
  return s;
}

export default function Register() {
  useTitle('Create account');
  const { user, register } = useAuth();
  const { notify } = useStore();
  const navigate = useNavigate();

  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/account" replace />;

  const strength = strengthOf(values.password);

  const set = (name) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setFormError('');
  };

  const validate = () => {
    const er = {};
    if (values.name.trim().length < 2) er.name = 'Enter your name';
    if (!EMAIL_RE.test(values.email)) er.email = 'Enter a valid email address';
    if (values.password.length < 8) er.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))
      er.password = 'Include at least one letter and one number';
    if (values.confirm !== values.password) er.confirm = 'Passwords do not match';
    if (!values.terms) er.terms = 'Please accept the terms to continue';
    return er;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    try {
      const u = await register(values);
      notify(`Welcome to Aurora, ${u.name.split(' ')[0]}! 🎉`);
      navigate('/account', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes less than a minute."
      art={{
        title: 'Join the Aurora club.',
        text: 'Get early access to drops, a saved wishlist and one-tap reorders.',
        points: ['10% off your first order', 'Save favourites across visits', 'Track every order'],
      }}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="auth-form">
        {formError && (
          <div className="form-alert" role="alert">
            {formError}
          </div>
        )}
        <TextField
          id="reg-name"
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={set('name')}
          error={errors.name}
        />
        <TextField
          id="reg-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
        <div>
          <TextField
            id="reg-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            error={errors.password}
          />
          {values.password && (
            <div className="strength" data-level={strength} aria-live="polite">
              <span className="strength-bars">
                {[1, 2, 3, 4].map((n) => (
                  <i key={n} className={n <= strength ? 'on' : ''} />
                ))}
              </span>
              <small>{STRENGTH[strength]}</small>
            </div>
          )}
        </div>
        <TextField
          id="reg-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />

        <label className={`check ${errors.terms ? 'invalid' : ''}`}>
          <input type="checkbox" checked={values.terms} onChange={set('terms')} />
          <span>I agree to the demo terms &amp; privacy policy.</span>
        </label>
        {errors.terms && <span className="field-error">{errors.terms}</span>}

        <button className="btn btn-primary btn-lg btn-block cta-arrow" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : (
            <>
              Create account <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
