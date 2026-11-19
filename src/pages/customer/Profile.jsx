import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { changePassword, updateProfile } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { Field, Alert, KeyValue, Badge } from '../../components/ui.jsx';

export default function Profile() {
  const { state, currentUser, apply } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    countryCode: currentUser.countryCode,
    phone: currentUser.phone,
  });
  const [errors, setErrors] = useState([]);

  const [pw, setPw] = useState({ oldPassword: '', password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState([]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPwField = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    setErrors([]);
    const result = updateProfile(state, currentUser.id, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setEditing(false);
  };

  const savePw = (e) => {
    e.preventDefault();
    setPwErrors([]);
    const result = changePassword(state, currentUser.id, pw);
    if (!result.ok) {
      setPwErrors(result.errors);
      return;
    }
    apply(result);
    setPw({ oldPassword: '', password: '', confirm: '' });
  };

  const branch = state.branches.find((b) => b.id === currentUser.branchId);

  return (
    <>
      <div className="page-title-row">
        <h1>Profile</h1>
        <button className="btn btn-sm" onClick={() => { setEditing(!editing); setErrors([]); }}>
          {editing ? 'Cancel' : 'Edit profile'}
        </button>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">
            Profile details
            {Number(currentUser.status) === 1 ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
          </div>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          {!editing ? (
            <KeyValue
              items={[
                ['Name', currentUser.name],
                ['Email', currentUser.email],
                ['Phone', `+${currentUser.countryCode} ${currentUser.phone}`],
                ['Account number', currentUser.accountNumber],
                ['Branch', branch ? branch.name : '—'],
                ['Member since', formatDate(currentUser.createdAt, state.settings)],
                ['Email verified', currentUser.emailVerifiedAt ? formatDate(currentUser.emailVerifiedAt, state.settings) : 'No'],
              ]}
            />
          ) : (
            <form onSubmit={save} noValidate>
              <Field label="Name" required>
                <input className="input" value={form.name} onChange={set('name')} />
              </Field>
              <div className="form-grid">
                <Field label="Country code" required>
                  <input className="input" value={form.countryCode} onChange={set('countryCode')} />
                </Field>
                <Field label="Phone" required>
                  <input className="input" value={form.phone} onChange={set('phone')} />
                </Field>
              </div>
              <Field label="Email" required>
                <input className="input" type="email" value={form.email} onChange={set('email')} />
              </Field>
              <button className="btn btn-block" type="submit">Save profile</button>
            </form>
          )}
          <p className="field-hint mg-top-16">
            The PHP profile also supports picture upload, mobile (SMS) verification and KYC document
            upload — all stubbed here because a static host has no uploads, SMS or KYC. See README.
          </p>
        </div>

        <div className="card">
          <div className="card-title">Change password</div>
          {pwErrors.length > 0 && <Alert type="error">{pwErrors.join(' ')}</Alert>}
          <form onSubmit={savePw} noValidate>
            <Field label="Old password" required>
              <input className="input" type="password" value={pw.oldPassword} onChange={setPwField('oldPassword')} />
            </Field>
            <Field label="New password" required hint="At least 6 characters.">
              <input className="input" type="password" value={pw.password} onChange={setPwField('password')} />
            </Field>
            <Field label="Confirm new password" required>
              <input className="input" type="password" value={pw.confirm} onChange={setPwField('confirm')} />
            </Field>
            <button className="btn btn-block" type="submit">Change password</button>
          </form>
          <p className="field-hint mg-top-16">
            Passwords are stored in the browser only. The PHP version hashes passwords with bcrypt —
            a real port must do the same on a server.
          </p>
        </div>
      </div>
    </>
  );
}
