import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { randomAccountNumber, registerCustomer, validateRegistration } from '../../lib/banking.js';
import { getSetting, groupAccountNumber } from '../../lib/format.js';
import { Field, Alert } from '../../components/ui.jsx';
import { compressAndUploadImage } from '../../lib/uploadImage.js';
import CountrySelect from '../../components/CountrySelect.jsx';

const EMPTY = { name: '', email: '', countryCode: '41', phone: '', password: '', confirm: '', pin: '', profilePicture: '', agree: false };

export default function Register() {
  const { state, apply, signInAs, notify } = useStore();
  const navigate = useNavigate();
  // Auto-generated 10-digit account number shown on the form
  const previewAccountNumber = useMemo(() => randomAccountNumber(state), []);
  const [form, setForm] = useState({ ...EMPTY, accountNumber: previewAccountNumber });
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onPicture = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await compressAndUploadImage(file);
    setUploading(false);
    if (!result.ok) {
      setErrors([result.error]);
      return;
    }
    setForm({ ...form, profilePicture: result.url });
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const errFor = (prefix) => errors.find((x) => x.startsWith(prefix));
  const allowed = getSetting(state.settings, 'allow_signup', 'yes') === 'yes';

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    if (!allowed) {
      setErrors(['Sign up is disabled in the site settings. Ask the admin to enable it.']);
      return;
    }
    // Pre-validate for inline field errors (shared module is the source of truth)
    const pre = validateRegistration(state, form);
    if (pre.length) {
      setErrors(pre);
      return;
    }
    const result = registerCustomer(state, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    signInAs(result.user);
    notify('success', `Welcome! Your account number is ${result.user.accountNumber}.`);
    navigate('/app', { replace: true });
  };

  const nextNumber = groupAccountNumber(getSetting(state.settings, 'next_account_number', ''));

  return (
    <div className="section" style={{ background: '#f8f8f8', minHeight: '70vh' }}>
      <div className="container container-narrow">
        <div className="card card-accent">
          <h2>Open your account with Steinberg Swiss Finance<span className="span-primary">!</span></h2>
          <p>
            Opening an account takes just a few minutes. Tell us a little about yourself, choose a
            password and you will be ready to explore the full banking experience.
          </p>
          <p className="field-hint">
            Your next account number would be <span className="text-bold text-ink">{nextNumber}</span>.
          </p>
          {!allowed && (
            <Alert type="warning">
              Sign up is disabled in the site settings. Use the seeded sign-in hints instead.
            </Alert>
          )}
          {errors.filter((x) => !['The name', 'The email', 'The country', 'The phone', 'The password', 'You must agree'].some((p) => x.startsWith(p))).length > 0 && (
            <Alert type="error">{errors.filter((x) => !['The name', 'The email', 'The country', 'The phone', 'The password', 'You must agree'].some((p) => x.startsWith(p))).join(' ')}</Alert>
          )}
          <form onSubmit={submit} noValidate>
            <Field label="Your account number" hint="Auto-generated for you — no spaces.">
              <input className="input mono text-bold" value={form.accountNumber} readOnly />
            </Field>
            <Field label="Profile picture (optional)">
              <div className="flex items-center gap-12">
                {form.profilePicture ? (
                  <img src={form.profilePicture} alt="" style={{ width: 72, height: 72, borderRadius: 999, objectFit: 'cover', border: '2px solid var(--line)' }} />
                ) : (
                  <div className="avatar-placeholder" style={{ width: 72, height: 72, fontSize: 26 }}>{form.name ? form.name.charAt(0).toUpperCase() : '?'}</div>
                )}
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  {uploading ? 'Uploading…' : form.profilePicture ? 'Change picture' : 'Upload picture'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPicture} disabled={uploading} />
                </label>
                {form.profilePicture && (
                  <button type="button" className="btn-link" onClick={() => setForm({ ...form, profilePicture: '' })}>Remove</button>
                )}
              </div>
            </Field>
            <Field label="Name" required error={errFor('The name')}>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Emma Keller" maxLength={191} />
            </Field>
            <div className="form-grid">
              <Field label="Email" required error={errFor('The email')}>
                <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </Field>
              <Field label="Country code" required error={errFor('The country')}>
                <CountrySelect value={`+${form.countryCode}`} onChange={(d) => setForm({ ...form, countryCode: d.replace("+", "") })} />
              </Field>
            </div>
            <Field label="Phone" required error={errFor('The phone')}>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="079 000 00 00" />
            </Field>
            <div className="form-grid">
              <Field label="Password" required error={errFor('The password')}>
                <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
              </Field>
              <Field label="Confirm password" required error={errFor('The password confirmation')}>
                <input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
              </Field>
              <Field label="4-digit passcode" required error={errFor('The passcode')} hint="You will enter this after your password every time you sign in.">
                <input className="input mono" inputMode="numeric" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} placeholder="••••" />
              </Field>
            </div>
            <label className="checkbox-row mg-bottom-16">
              <input type="checkbox" checked={form.agree} onChange={set('agree')} />
              <span>
                I agree with the <span className="text-bold">privacy policy</span> and{' '}
                <span className="text-bold">terms of use</span>. This is a showcase — no real agreement is formed.
              </span>
            </label>
            {errFor('You must agree') && <div className="field-error mg-bottom-16">{errFor('You must agree')}</div>}
            <button className="btn btn-block btn-lg" type="submit">Open account</button>
          </form>
          <p className="mg-top-16 field-hint">
            Already have an account? <Link to="/signin">Sign in</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
