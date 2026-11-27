import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { balanceFor, enabledCurrenciesFor, submitWireTransfer } from '../../lib/banking.js';
import { formatMoney, formatDate } from '../../lib/format.js';
import { Field, Alert, StatusBadge, Modal } from '../../components/ui.jsx';
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
  const [codeStep, setCodeStep] = useState(0); // 0 closed | 1 COT | 2 IMF | 3 Swift
  const [codeInput, setCodeInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 5s SS spinner before each step
  const [codeError, setCodeError] = useState('');

  const STEP_META = [
    null,
    {
      label: 'COT Code',
      hint: 'Contact support to provide code.',
      expected: () => String(currentUser?.cotCode || '').trim(),
    },
    {
      label: 'IMF Code',
      hint: 'Contact support to provide code.',
      expected: () => String(currentUser?.imfCode || '').trim(),
    },
  ];
  const currencies = enabledCurrenciesFor(state, currentUser.id);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const balance = form.currencyId ? balanceFor(state, currentUser.id, Number(form.currencyId)) : null;

  const finishTransfer = () => {
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
      setCodeStep(0);
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
    setCodeStep(0);
    setCodeInput('');
  };

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    setDone(null);

    // Basic completeness check before the code sequence starts
    const missing = [];
    if (!String(form.bank).trim()) missing.push('The bank name field is required.');
    if (!String(form.swiftCode).trim()) missing.push('The swift code field is required.');
    if (!form.currencyId) missing.push('The currency field is required.');
    if (!String(form.amount).trim()) missing.push('The amount field is required.');
    if (!String(form.accountNumber).trim()) missing.push('The beneficiary account number field is required.');
    if (!String(form.accountHolderName).trim()) missing.push('The beneficiary account name field is required.');
    if (missing.length) {
      setErrors(missing);
      return;
    }

    setCodeError('');
    setCodeInput('');
    // 5 seconds of the spinning SS favicon before Step 1 (COT)
    setLoadingStep(1);
    setTimeout(() => {
      setLoadingStep(0);
      setCodeStep(1);
    }, 5000);
  };

  const verifyCode = () => {
    if (checking) return;
    setChecking(true);
    setCodeError('');
    // Simulated bank verification round-trip
    setTimeout(() => {
      const expected = STEP_META[codeStep].expected();
      if (String(codeInput).trim().toUpperCase() !== expected.toUpperCase()) {
        setChecking(false);
        setCodeError(`${STEP_META[codeStep].label} is invalid.`);
        return;
      }
      setChecking(false);
      if (codeStep < 2) {
        // 5 seconds of the spinning SS favicon before the next step
        setLoadingStep(codeStep + 1);
        setTimeout(() => {
          setLoadingStep(0);
          setCodeStep(codeStep + 1);
          setCodeInput('');
        }, 5000);
      } else {
        finishTransfer();
      }
    }, 800);
  };

  const mine = state.transactions
    .filter((t) => t.userId === currentUser.id && t.type === 'Wire_Transfer')
    .sort((a, b) => b.id - a.id);

  return (
    <>
      {celebrate && <SuccessOverlay {...celebrate} onClose={() => setCelebrate(null)} />}
      {loadingStep > 0 && (
        <div className="success-overlay" style={{ cursor: 'wait' }}>
          <div className="success-card">
            <svg className="boot-logo" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#f20823"></rect>
              <text x="16" y="22" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">SS</text>
            </svg>
            <h2>Processing…</h2>
          </div>
        </div>
      )}
      {codeStep > 0 && loadingStep === 0 && (
        <Modal
          title={`Verify ${STEP_META[codeStep].label}`}
          onClose={() => {
            if (!checking) {
              setCodeStep(0);
              setCodeInput('');
              setCodeError('');
            }
          }}
        >
          {codeError && <Alert type="error">{codeError}</Alert>}
          <Field label={STEP_META[codeStep].label} required>
            <input
              className="input mono text-center"
              autoFocus
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              disabled={checking}
            />
          </Field>
          <button className="btn btn-block btn-lg" type="button" onClick={verifyCode} disabled={checking}>
            {checking ? (
              <>
                <span className="mini-spin" /> Verifying…
              </>
            ) : codeStep === 2 ? (
              'Verify & send wire transfer'
            ) : (
              'Verify & continue'
            )}
          </button>
        </Modal>
      )}
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
              <Field label="Beneficiary account name" required>
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
