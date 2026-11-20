import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { adminAdjustFunds, balanceFor, enabledCurrenciesFor } from '../../lib/banking.js';
import { formatMoney, formatDate } from '../../lib/format.js';
import { UserStatusBadge, Modal, Field, Alert } from '../../components/ui.jsx';

const EMPTY_ADJUST = { userId: '', currencyId: '', direction: 'credit', amount: '', note: '' };

export default function AdminAccounts() {
  const { state, currentUser, apply } = useStore();
  const [q, setQ] = useState('');
  const [adjusting, setAdjusting] = useState(null); // user object or null
  const [form, setForm] = useState(EMPTY_ADJUST);
  const [errors, setErrors] = useState([]);

  const rows = useMemo(() => {
    return state.users
      .filter((u) => u.userType === 'customer')
      .filter((u) =>
        q.trim()
          ? u.name.toLowerCase().includes(q.toLowerCase()) ||
            u.email.toLowerCase().includes(q.toLowerCase()) ||
            u.accountNumber.includes(q.trim())
          : true,
      )
      .sort((a, b) => a.id - b.id);
  }, [state.users, q]);

  const total = state.currencies.map((c) => ({
    c,
    sum: state.users
      .filter((u) => u.userType === 'customer')
      .reduce((acc, u) => acc + balanceFor(state, u.id, c.id), 0),
  }));

  const openAdjust = (u) => {
    setAdjusting(u);
    setForm({ userId: u.id, currencyId: '', direction: 'credit', amount: '', note: '' });
    setErrors([]);
  };

  const submitAdjust = (e) => {
    e.preventDefault();
    setErrors([]);
    const result = adminAdjustFunds(state, {
      userId: form.userId,
      currencyId: form.currencyId,
      direction: form.direction,
      amount: form.amount,
      note: form.note,
      adminId: currentUser.id,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setAdjusting(null);
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Accounts</h1>
      </div>

      <div className="card mg-bottom-24">
        <div className="flex flex-wrap gap-8 items-center" style={{ gap: 12 }}>
          <input className="input" style={{ flex: '1 1 300px' }} placeholder="Search name, email or account number…" value={q} onChange={(e) => setQ(e.target.value)} />
          {total.map(({ c, sum }) => (
            <span className="badge badge-neutral" key={c.id}>
              {c.name} total: {formatMoney(sum, c.id, state.currencies, state.settings)}
            </span>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Account #</th>
              <th>Holder</th>
              <th>Email</th>
              <th>Status</th>
              <th>Opened</th>
              {state.currencies.filter((c) => c.status === 1).map((c) => (
                <th key={c.id} className="num">{c.name} balance</th>
              ))}
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const enabled = enabledCurrenciesFor(state, u.id).map((c) => c.id);
              return (
                <tr key={u.id}>
                  <td className="mono text-bold">{u.accountNumber}</td>
                  <td className="text-bold">{u.name}</td>
                  <td>{u.email}</td>
                  <td><UserStatusBadge status={u.status} /></td>
                  <td className="nowrap">{formatDate(u.createdAt, state.settings)}</td>
                  {state.currencies.filter((c) => c.status === 1).map((c) => (
                    <td key={c.id} className="num mono">
                      {enabled.includes(c.id)
                        ? formatMoney(balanceFor(state, u.id, c.id), c.id, state.currencies, state.settings)
                        : '—'}
                    </td>
                  ))}
                  <td className="text-right nowrap">
                    <button className="btn btn-ghost btn-sm" onClick={() => openAdjust(u)}>Adjust funds</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="field-hint mg-top-16">
        One account number per customer plus per-currency balances. Currencies shown with — are not enabled for
        that account; enable them from Users → Edit.
      </p>

      {adjusting && (
        <Modal title={`Adjust funds — ${adjusting.name}`} onClose={() => setAdjusting(null)}>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={submitAdjust} noValidate>
            <Field label="Currency" required>
              <select className="select" value={form.currencyId} onChange={(e) => setForm({ ...form, currencyId: e.target.value })}>
                <option value="">Select one</option>
                {enabledCurrenciesFor(state, adjusting.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Direction" required>
              <select className="select" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="credit">Add funds (credit)</option>
                <option value="debit">Subtract funds (debit)</option>
              </select>
            </Field>
            <Field label="Amount" required>
              <input className="input" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </Field>
            <Field label="Note">
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Reason for adjustment" />
            </Field>
            <button className="btn btn-block" type="submit">Apply adjustment</button>
          </form>
        </Modal>
      )}
    </>
  );
}
