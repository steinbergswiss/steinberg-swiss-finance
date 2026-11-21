import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { Field, Alert } from '../../components/ui.jsx';

export default function SignIn() {
  const { verifyCredentials, signInWithPin, notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [step, setStep] = useState('credentials'); // 'credentials' | 'passcode'
  const [pendingUser, setPendingUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submitCredentials = (e) => {
    e.preventDefault();
    setError('');
    const res = verifyCredentials(form.email, form.password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPendingUser(res.user);
    setPin('');
    setStep('passcode');
  };

  const submitPin = (e) => {
    e.preventDefault();
    setError('');
    const res = signInWithPin(pendingUser, pin);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const from = location.state?.from;
    const target =
      from && (res.role === 'admin' ? from.startsWith('/admin') : from.startsWith('/app'))
        ? from
        : res.role === 'admin'
          ? '/admin'
          : '/app';
    notify('success', 'Signed in successfully.', 10000);
    navigate(target, { replace: true });
  };

  return (
    <div className="section" style={{ background: '#f8f8f8', minHeight: '70vh' }}>
      <div className="container container-narrow">
        <div className="card card-accent">
          <h2>Sign in<span className="span-primary">.</span></h2>
          {error && <Alert type="error">{error}</Alert>}
          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} noValidate>
              <Field label="Email" required>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              </Field>
              <Field label="Password" required>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <button className="btn btn-block btn-lg" type="submit">Continue</button>
              <p className="mg-top-16 field-hint">
                No account? <Link to="/register">Open an account</Link>.
              </p>
            </form>
          ) : (
            <form onSubmit={submitPin} noValidate>
              <p className="mg-bottom-16">
                Welcome back, <span className="text-bold text-ink">{pendingUser?.name}</span>.
                Enter your 4-digit passcode to continue.
              </p>
              <Field label="4-digit passcode" required>
                <input
                  className="input mono text-center"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoComplete="one-time-code"
                />
              </Field>
              <button className="btn btn-block btn-lg" type="submit">Verify & sign in</button>
              <p className="mg-top-16 field-hint">
                <button type="button" className="btn-link" onClick={() => { setStep('credentials'); setPendingUser(null); setError(''); }}>
                  Use a different account
                </button>
              </p>
            </form>
          )}
          <p className="mg-top-16 field-hint">Seeded accounts use passcode 1234.</p>
        </div>
      </div>
    </div>
  );
}
