import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { balanceFor, findUserByAccountOrEmail, submitTransfer, transferCharge } from '../../lib/banking.js';
import { formatMoney, getSetting } from '../../lib/format.js';
import { Field, Alert } from '../../components/ui.jsx';

export default function Transfer() {
  const { state, currentUser, apply } = useStore();
  const [form, setForm] = useState({ userAccount: '', currencyId: '', amount: '', note: '' });
  const [errors, setErrors] = useState([]);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const amountN = Number(form.amount);
  const validAmount = form.amount !== '' && !Number.isNaN(amountN) && amountN >= 1;
  const charge = validAmount && form.currencyId ? transferCharge(state, form.currencyId, amountN) : 0;
  const feeType = getSetting(state.settings, 'transfer_fee_type', 'percentage');
  const feeLabel =
    feeType === 'percentage'
      ? `${getSetting(state.settings, 'transfer_fee', '0')}% transaction charge will be applied`
      : `${formatMoney(Number(getSetting(state.settings, 'transfer_fee', '0')), Number(getSetting(state.settings, 'base_currency', '1')), state.currencies, state.settings)} transaction charge will be applied`;

  const recipientPreview = useMemo(
    () => (form.userAccount.trim() ? findUserByAccountOrEmail(state, form.userAccount) : null),
    [state, form.userAccount],
  );

  const balance = form.currencyId ? balanceFor(state, currentUser.id, Number(form.currencyId)) : null;
  const actionMode = getSetting(state.settings, 'send_money_action', '2');

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    setDone(null);
    const result = submitTransfer(state, {
      fromUserId: currentUser.id,
      userAccount: form.userAccount,
      currencyId: form.currencyId,
      amount: form.amount,
      note: form.note,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setDone({ message: result.message, debitId: result.debit.id });
    setForm({ ...form, amount: '', note: '' });
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Internal transfer</h1>
        <span className="badge badge-neutral">Between accounts only</span>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start', maxWidth: 980 }}>
        <div className="card card-accent">
          <h3 className="mg-bottom-16">Send money</h3>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          {done && (
            <Alert type={actionMode === '1' ? 'warning' : 'success'}>
              {done.message} Ledger entries: debit #{done.debitId} and its matching credit.
            </Alert>
          )}
          <form onSubmit={submit} noValidate>
            <Field label="Account number / email" required error={errors.find((x) => x.includes('account') && x.toLowerCase().includes('email'))}>
              <input
                className="input"
                value={form.userAccount}
                onChange={set('userAccount')}
                placeholder="SSF-9000 0003 or luca@steinberg.example"
              />
            </Field>
            {recipientPreview && (
              <Alert type="info">
                Recipient found: {recipientPreview.name} ({recipientPreview.accountNumber})
                {recipientPreview.id === currentUser.id ? ' — that is you. Transfers to your own account are rejected.' : ''}
              </Alert>
            )}
            <Field label="Currency" required>
              <select className="select" value={form.currencyId} onChange={set('currencyId')}>
                <option value="">Select one</option>
                {state.currencies
                  .filter((c) => c.status === 1)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </Field>
            {balance !== null && (
              <p className="field-hint">
                Available {state.currencies.find((c) => c.id === Number(form.currencyId))?.name} balance:{' '}
                <span className="text-bold text-ink">
                  {formatMoney(balance, Number(form.currencyId), state.currencies, state.settings)}
                </span>
              </p>
            )}
            <Field label="Amount" required error={errors.find((x) => x.startsWith('The amount'))}>
              <input
                className="input"
                inputMode="decimal"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0.00"
              />
            </Field>
            <Field label="Note / description">
              <textarea className="textarea" style={{ minHeight: 90 }} value={form.note} onChange={set('note')} placeholder="What is this transfer for?" />
            </Field>
            <button className="btn btn-block btn-lg" type="submit">Send money</button>
          </form>
        </div>

        <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">Transfer summary</div>
            <div className="stat-box mg-bottom-12">
              <div className="title">Transfer amount</div>
              <div className="value mono">
                {validAmount && form.currencyId
                  ? formatMoney(amountN, Number(form.currencyId), state.currencies, state.settings)
                  : '—'}
              </div>
            </div>
            <div className="stat-box mg-bottom-12">
              <div className="title">Fee ({feeType === 'percentage' ? `${getSetting(state.settings, 'transfer_fee', '0')}%` : 'fixed'})</div>
              <div className="value mono">
                {validAmount && form.currencyId
                  ? formatMoney(charge, Number(form.currencyId), state.currencies, state.settings)
                  : '—'}
              </div>
            </div>
            <div className="stat-box">
              <div className="title">Total debit</div>
              <div className="value mono">
                {validAmount && form.currencyId
                  ? formatMoney(amountN + charge, Number(form.currencyId), state.currencies, state.settings)
                  : '—'}
              </div>
            </div>
            <p className="field-hint mg-top-16">{feeLabel}</p>
          </div>

          <div className="card">
            <div className="card-title">Transfer rules (ported from PHP)</div>
            <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14 }}>
              <li>Recipient must be a customer found by email or account number — not yourself.</li>
              <li>Amount must be numeric and at least 1.00.</li>
              <li>Balance check is amount + fee against your available balance.</li>
              <li>
                {actionMode === '1'
                  ? 'The admin must approve the transfer; until then the debit already reduces your balance (PHP rule).'
                  : 'Transfers post instantly as a debit + credit pair (PHP default).'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
