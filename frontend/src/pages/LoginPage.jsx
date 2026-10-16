import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import '../styles/login.css';

const DEMO = [
  ['muhammad@xperts.test', 'Final Approver'],
  ['asif@xperts.test', 'Requester + Approver'],
  ['accounting@xperts.test', 'Approver + Accounting'],
  ['sara@xperts.test', 'Requester'],
  ['ali@xperts.test', 'Requester'],
];
const DEMO_PASSWORD = 'Password@123';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';
  if (user) return <Navigate to={from} replace />;

  const validate = () => {
    const e = {};
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.requiresTwoFactor) {
        setServerError('Two-factor verification is not enabled in this build.');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fill = (addr) => { setEmail(addr); setPassword(DEMO_PASSWORD); setErrors({}); setServerError(''); };

  return (
    <div className="login">
      <div className="card login__card">
        <p className="login__brand">Xperts Portal</p>
        <h1>Accounting &amp; Procurement Portal</h1>
        <form className="login__form" onSubmit={onSubmit} noValidate>
          {serverError && <div className="banner-error" role="alert">{serverError}</div>}
          <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <div className="login__pw">
            <Input label="Password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            <button type="button" className="login__show" onClick={() => setShowPw((s) => !s)} aria-pressed={showPw}>{showPw ? 'Hide' : 'Show'}</button>
          </div>
          <Button type="submit" loading={loading}>Sign in</Button>
        </form>
        <details className="login__demo">
          <summary>Demo accounts</summary>
          <ul>
            {DEMO.map(([addr, roles]) => (
              <li key={addr}>
                <span>{addr}<br /><small>{roles}</small></span>
                <Button variant="secondary" size="sm" onClick={() => fill(addr)}>Use</Button>
              </li>
            ))}
          </ul>
          <p className="field__hint">Password for all: {DEMO_PASSWORD}</p>
        </details>
      </div>
    </div>
  );
}
