import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { Field, Alert } from '../../components/ui.jsx';

export default function SignIn() {
  const { signIn, notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const res = signIn(form.email, form.password);
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
    notify('success', 'Signed in successfully.');
    navigate(target, { replace: true });
  };

  return (
    <div className="section" style={{ background: '#f8f8f8', minHeight: '70vh' }}>
      <div className="container container-narrow">
        <div className="card card-accent">
          <h2>Sign in<span className="span-primary">.</span></h2>
          <p>Credentials are checked against the seed data in your browser.</p>
          {error && <Alert type="error">{error}</Alert>}
          <form onSubmit={submit} noValidate>
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
            <button className="btn btn-block btn-lg" type="submit">Sign in</button>
          </form>
          <p className="mg-top-16 field-hint">
            No account? <Link to="/register">Open an account</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
