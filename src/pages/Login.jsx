import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import useTitle from '../hooks/useTitle';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  useTitle('Sign in');
  const { user, login } = useAuth();
  const { notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={from} replace />;

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setFormError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(values.email)) next.email = 'Enter a valid email address';
    if (!values.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const u = await login(values);
      notify(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your orders and saved items."
      art={{
        title: 'Your next favourite thing is waiting.',
        text: 'Track orders, keep your wishlist and check out faster.',
        points: ['Order history in one place', 'Faster checkout', 'Early access to new drops'],
      }}
      footer={
        <>
          New to Aurora? <Link to="/register">Create an account</Link>
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
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
        <TextField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        />
        <button className="btn btn-primary btn-lg btn-block cta-arrow" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : (
            <>
              Sign in <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
