import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { balanceFor, enabledCurrenciesFor, submitWireTransfer } from '../../lib/banking.js';
import { formatMoney, formatDate } from '../../lib/format.js';
import { Field, Alert, StatusBadge } from '../../components/ui.jsx';
import SuccessOverlay from '../../components/SuccessOverlay.jsx';

export default function Wire() {
  const { state, currentUser, apply } = useStore();
  const [form, setForm] = useState({
    bank: '',
    swiftCode: '',
    currencyId: '',
    amount: '',
    accountNumber: '',
    accountHolderName: '',
    note: '',
  });
  const [errors, setErrors] = useState([]);
  const [done, setDone] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const currencies = enabledCurrenciesFor(state, currentUser.id);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const balance = form.currencyId ? balanceFor(state, currentUser.id, Number(form.currencyId)) : null;

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    setDone(null);
    const result = submitWireTransfer(state, {
      userId: currentUser.id,
      bank: form.bank,
      swiftCode: form.swiftCode,
      currencyId: form.currencyId,
      amount: form.amount,
      accountNumber: form.accountNumber,
      accountHolderName: form.accountHolderName,
      note: form.note,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setDone(result.message);
    setCelebrate({
      title: 'International Wire Transfer Request Sent',
      amount: formatMoney(Number(form.amount), Number(form.currencyId), state.currencies, state.settings),
      detail: `To ${form.accountHolderName} · ${form.bank}`,
      subtitle: 'It will be reviewed by the admin.',
    });
    setForm({ bank: '', swiftCode: '', currencyId: '', amount: '', accountNumber: '', accountHolderName: '', note: '' });
  };

  const mine = state.transactions
    .filter((t) => t.userId === currentUser.id && t.type === 'Wire_Transfer')
    .sort((a, b) => b.id - a.id);

  return (
    <>
      {celebrate && <SuccessOverlay {...celebrate} onClose={() => setCelebrate(null)} />}
      <div className="page-title-row">
        <h1>International Wire Transfer</h1>
        <span className="badge badge-neutral">Requires approval</span>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card card-accent">
          <h3 className="mg-bottom-16">Send a wire transfer</h3>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          {done && <Alert type="success">{done}</Alert>}
          <form onSubmit={submit} noValidate>
            <Field label="Bank" required>
              <input className="input" value={form.bank} onChange={set('bank')} placeholder="Recipient bank name" />
            </Field>
            <div className="form-grid">
              <Field label="SWIFT / BIC code" required>
                <input className="input mono" value={form.swiftCode} onChange={set('swiftCode')} placeholder="ABCDEF12XXX" />
              </Field>
              <Field label="Currency" required>
                <select className="select" value={form.currencyId} onChange={set('currencyId')}>
                  <option value="">Select one</option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Beneficiary account number" required>
                <input className="input mono" value={form.accountNumber} onChange={set('accountNumber')} />
              </Field>
              <Field label="Beneficiary account holder" required>
                <input className="input" value={form.accountHolderName} onChange={set('accountHolderName')} />
              </Field>
            </div>
            {balance !== null && (
              <p className="field-hint">
                Available balance:{' '}
                <span className="text-bold text-ink">
                  {formatMoney(balance, Number(form.currencyId), state.currencies, state.settings)}
                </span>
              </p>
            )}
            <Field label="Amount" required hint="Minimum 100, maximum 1,000,000.">
              <input className="input" inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="0.00" />
            </Field>
            <Field label="Note">
              <input className="input" value={form.note} onChange={set('note')} placeholder="Payment reference" />
            </Field>
            <button className="btn btn-block btn-lg" type="submit">Send wire transfer request</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Your international wire transfers</div>
          {mine.length === 0 ? (
            <p className="text-muted">No international wire transfers yet.</p>
          ) : (
            <div className="table-wrap" style={{ boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Bank</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((t) => (
                    <tr key={t.id}>
                      <td className="mono">#{t.id}</td>
                      <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                      <td>{t.bank || '—'}</td>
                      <td className="num mono text-bold">
                        {formatMoney(t.amount, t.currencyId, state.currencies, state.settings)}
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
