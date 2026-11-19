import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { submitBitcoinDeposit } from '../../lib/banking.js';
import { formatMoney, formatDate, getSetting } from '../../lib/format.js';
import { Field, Alert, StatusBadge } from '../../components/ui.jsx';

const FALLBACK_BTC = 'bc1qsteinbergswissfinanceexampleaddress000';

export default function Deposit() {
  const { state, currentUser, apply } = useStore();
  const [form, setForm] = useState({ amount: '', txHash: '', note: '' });
  const [errors, setErrors] = useState([]);
  const [copied, setCopied] = useState(false);

  const address = getSetting(state.settings, 'btc_address', FALLBACK_BTC);
  const mine = state.transactions
    .filter((t) => t.userId === currentUser.id && t.type === 'Deposit' && t.method === 'Bitcoin')
    .sort((a, b) => b.id - a.id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy the address:', address);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    const result = submitBitcoinDeposit(state, {
      userId: currentUser.id,
      amount: form.amount,
      txHash: form.txHash,
      note: form.note,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setForm({ amount: '', txHash: '', note: '' });
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Deposit</h1>
        <span className="badge badge-neutral">Bitcoin</span>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">Bitcoin deposit address</div>
          <div className="stat-box mg-bottom-16" style={{ wordBreak: 'break-all' }}>
            <div className="title">Send BTC to</div>
            <div className="value mono" style={{ fontSize: 16 }}>{address}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <p className="field-hint mg-top-16">
            Send only Bitcoin to this address. The address is maintained by the administrator and may
            change at any time — always check this page before sending.
          </p>
        </div>

        <div className="card card-accent">
          <h3 className="mg-bottom-16">Submit deposit request</h3>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={submit} noValidate>
            <Field label="Amount (GBP)" required>
              <input
                className="input"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="Bitcoin transaction ID" required hint="The transaction hash (txid) from your wallet.">
              <input
                className="input mono"
                value={form.txHash}
                onChange={(e) => setForm({ ...form, txHash: e.target.value })}
                placeholder="a1b2c3…"
              />
            </Field>
            <Field label="Note">
              <input
                className="input"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Optional note"
              />
            </Field>
            <button className="btn btn-block" type="submit">Submit deposit request</button>
          </form>
          <p className="field-hint mg-top-16">
            The request is reviewed and credited to your account once approved.
          </p>
        </div>
      </div>

      <div className="card mg-top-24">
        <div className="card-title">Your deposit requests</div>
        {mine.length === 0 ? (
          <p className="text-muted">No deposit requests yet.</p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">#{t.id}</td>
                    <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                    <td className="num mono text-bold">
                      {formatMoney(t.amount, t.currencyId, state.currencies, state.settings)}
                    </td>
                    <td className="mono text-muted" style={{ wordBreak: 'break-all', maxWidth: 320 }}>
                      {t.transactionDetails?.txHash || '—'}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
