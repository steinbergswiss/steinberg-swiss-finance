import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { balanceFor } from '../../lib/banking.js';
import { formatMoney, formatDate, toIsoDate } from '../../lib/format.js';
import { StatusBadge, EmptyState } from '../../components/ui.jsx';

// PHP ReportController: filter by date1..date2, status, transaction_type,
// then render a table or download a PDF. The static port renders the table,
// prints it, or exports CSV (client-side PDF is out of scope — see README).

export default function Statements() {
  const { state, currentUser } = useStore();
  const [date1, setDate1] = useState(toIsoDate(Date.now() - 45 * 86400000));
  const [date2, setDate2] = useState(toIsoDate(Date.now()));
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const rows = useMemo(() => {
    return state.transactions
      .filter((t) => t.userId === currentUser.id)
      .filter((t) => {
        const d = toIsoDate(t.createdAt);
        return d >= date1 && d <= date2;
      })
      .filter((t) => (status === '' ? true : t.status === Number(status)))
      .filter((t) => (type === '' ? true : t.type === type))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [state.transactions, currentUser.id, date1, date2, status, type]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['id', 'date', 'type', 'dr_cr', 'currency', 'amount', 'fee', 'status', 'note'].join(',');
    const lines = rows.map((t) =>
      [
        t.id,
        formatDate(t.createdAt, state.settings),
        t.type,
        t.drCr,
        state.currencies.find((c) => c.id === t.currencyId)?.name || t.currencyId,
        t.amount,
        t.fee,
        t.status === 2 ? 'completed' : t.status === 1 ? 'pending' : 'rejected',
        esc(t.note || ''),
      ].join(','),
    );
    const blob = new Blob([header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `steinberg-statement_${date1}_${date2}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const opening = balanceFor(state, currentUser.id, Number(state.settings.base_currency || 1));

  return (
    <>
      <div className="page-title-row">
        <h1>Statements</h1>
        <div className="actions no-print">
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Print</button>
          <button className="btn btn-sm" onClick={exportCsv}>Download CSV</button>
        </div>
      </div>

      <div className="card mg-bottom-24 no-print">
        <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
          <label className="field-label mg-0">From</label>
          <input type="date" className="input" style={{ width: 170 }} value={date1} onChange={(e) => setDate1(e.target.value)} />
          <label className="field-label mg-0">To</label>
          <input type="date" className="input" style={{ width: 170 }} value={date2} onChange={(e) => setDate2(e.target.value)} />
          <select className="select" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="2">Completed</option>
            <option value="1">Pending</option>
            <option value="0">Rejected</option>
          </select>
          <select className="select" style={{ width: 170 }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option>Deposit</option>
            <option>Withdraw</option>
            <option>Transfer</option>
            <option>Payment</option>
            <option>Exchange</option>
          </select>
        </div>
      </div>

      <div className="card mg-bottom-24">
        <div className="card-title">Statement summary</div>
        <p className="field-hint mg-0">
          {currentUser.name} · {currentUser.accountNumber} · {date1} to {date2} · {rows.length} entries ·
          opening balance {formatMoney(opening, Number(state.settings.base_currency || 1), state.currencies, state.settings)}.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No transactions in this range">Widen the date range or clear the filters.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Currency</th>
                <th className="num">Amount</th>
                <th className="num">Fee</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="mono">#{t.id}</td>
                  <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                  <td>{t.type.replace(/_/g, ' ')}</td>
                  <td>{t.drCr === 'dr' ? 'Debit' : 'Credit'}</td>
                  <td>{state.currencies.find((c) => c.id === t.currencyId)?.name}</td>
                  <td className="num mono text-bold">{formatMoney(t.amount, t.currencyId, state.currencies, state.settings)}</td>
                  <td className="num mono text-muted">{t.fee > 0 ? formatMoney(t.fee, t.currencyId, state.currencies, state.settings) : '—'}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-muted">{t.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
