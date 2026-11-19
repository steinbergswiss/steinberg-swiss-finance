import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { updateSettings } from '../../lib/banking.js';
import { Field, Alert, Badge } from '../../components/ui.jsx';

// Port of PHP UtilityController settings + transactions_fee blade.
// Secret-bearing groups (SMTP, Twilio, recaptcha, gateways) are deliberately
// NOT collected here: a static site must never store secrets.

export default function AdminSettings() {
  const { state, apply } = useStore();
  const [form, setForm] = useState({ ...state.settings });
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setSaved(false);
  };

  const save = (e) => {
    e.preventDefault();
    apply(updateSettings(state, form));
    setSaved(true);
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Settings</h1>
        <span className="badge badge-neutral">Saved into localStorage only</span>
      </div>

      {saved && <Alert type="success">Saved successfully. Some settings apply on the next screen.</Alert>}

      <form onSubmit={save} noValidate>
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-title">General (PHP: general_settings)</div>
            <Field label="Site title">
              <input className="input" value={form.site_title} onChange={set('site_title')} />
            </Field>
            <Field label="Company name">
              <input className="input" value={form.company_name} onChange={set('company_name')} />
            </Field>
            <div className="form-grid">
              <Field label="Support email">
                <input className="input" value={form.email} onChange={set('email')} />
              </Field>
              <Field label="Phone">
                <input className="input" value={form.phone} onChange={set('phone')} />
              </Field>
            </div>
            <Field label="Address">
              <input className="input" value={form.address} onChange={set('address')} />
            </Field>
            <div className="form-grid">
              <Field label="Currency position">
                <select className="select" value={form.currency_position} onChange={set('currency_position')}>
                  <option value="left">Left (GBP 1,000.00)</option>
                  <option value="right">Right (1,000.00 GBP)</option>
                </select>
              </Field>
              <Field label="Time zone">
                <select className="select" value={form.timezone} onChange={set('timezone')}>
                  <option>Europe/Zurich</option>
                  <option>UTC</option>
                </select>
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Date format">
                <select className="select" value={form.date_format} onChange={set('date_format')}>
                  <option value="d M Y">d M Y</option>
                  <option value="Y-m-d">Y-m-d</option>
                  <option value="d/m/Y">d/m/Y</option>
                  <option value="m/d/Y">m/d/Y</option>
                </select>
              </Field>
              <Field label="Time format">
                <select className="select" value={form.time_format} onChange={set('time_format')}>
                  <option value="H:i">H:i (24h)</option>
                  <option value="h:i A">h:i A (12h)</option>
                </select>
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Allow sign up">
                <select className="select" value={form.allow_signup} onChange={set('allow_signup')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
              <Field label="Email verification" hint="Display-only — no mail can be sent from a static host.">
                <select className="select" value={form.email_verification} onChange={set('email_verification')}>
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled (stub)</option>
                </select>
              </Field>
            </div>
            <Field label="Next account number">
              <input className="input mono" value={form.next_account_number} onChange={set('next_account_number')} />
            </Field>
          </div>

          <div className="flex" style={{ flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div className="card-title">Transaction fees (PHP: transactions_fee)</div>
              <div className="form-grid">
                <Field label="Transfer fee type">
                  <select className="select" value={form.transfer_fee_type} onChange={set('transfer_fee_type')}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed (base currency)</option>
                  </select>
                </Field>
                <Field label="Transfer fee">
                  <input className="input" inputMode="decimal" value={form.transfer_fee} onChange={set('transfer_fee')} />
                </Field>
              </div>
              <div className="form-grid">
                <Field label="Exchange fee type" hint="Exchange money is not ported; kept for parity.">
                  <select className="select" value={form.exchange_fee_type} onChange={set('exchange_fee_type')}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </Field>
                <Field label="Exchange fee">
                  <input className="input" inputMode="decimal" value={form.exchange_fee} onChange={set('exchange_fee')} />
                </Field>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Transfer policy (PHP: send_money_action)</div>
              <Field label="Internal transfer action">
                <select className="select" value={form.send_money_action} onChange={set('send_money_action')}>
                  <option value="2">Instant — post debit + credit immediately (PHP default)</option>
                  <option value="1">Approval — hold until an admin approves (lands in Pending transfers)</option>
                </select>
              </Field>
              <Field label="Transaction OTP" hint="PHP sends an email/SMS OTP. Static site: always off.">
                <select className="select" value={form.send_money_otp} onChange={set('send_money_otp')}>
                  <option value="0">Disabled (stub)</option>
                  <option value="1">Enabled (stub — no code is ever sent)</option>
                </select>
              </Field>
            </div>

            <div className="card">
              <div className="card-title">
                Not available on a static host <Badge tone="warning">stubbed</Badge>
              </div>
              <p style={{ fontSize: 14.5 }}>
                SMTP mail, Twilio SMS, reCAPTCHA keys, payment-gateway credentials, database backups and
                logo uploads exist in the PHP admin but are intentionally absent here: a GitHub Pages site
                has no server, must never store secrets, and cannot send mail. See the README parity list.
              </p>
            </div>
          </div>
        </div>

        <button className="btn btn-lg mg-top-24" type="submit">Save settings</button>
      </form>
    </>
  );
}
