import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { formatMoney, formatDate } from '../../lib/format.js';
import { StatusBadge, EmptyState } from '../../components/ui.jsx';

const TYPES = ['All', 'Deposit', 'Withdraw', 'Transfer', 'Payment', 'Exchange'];

export default function Transactions() {
  const { state, currentUser } = useStore();
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('all');
  const [currency, setCurrency] = useState('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return state.transactions
      .filter((t) => t.userId === currentUser.id)
      .filter((t) => (type === 'All' ? true : t.type === type))
      .filter((t) => (status === 'all' ? true : t.status === Number(status)))
      .filter((t) => (currency === 'all' ? true : t.currencyId === Number(currency)))
      .filter((t) =>
        q.trim()
          ? (t.note || '').toLowerCase().includes(q.toLowerCase()) ||
            String(t.id).includes(q.trim()) ||
            t.type.toLowerCase().includes(q.toLowerCase())
          : true,
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [state.transactions, currentUser.id, type, status, currency, q]);

  return (
    <>
      <div className="page-title-row">
        <h1>Transactions</h1>
        <Link className="btn btn-sm" to="/app/statements">Export statement</Link>
      </div>

      <div className="card mg-bottom-24">
        <div className="flex flex-wrap gap-12 items-center" style={{ gap: 12 }}>
          <input className="input" style={{ flex: '1 1 220px' }} placeholder="Search note, type or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" style={{ flex: '0 0 180px' }} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select className="select" style={{ flex: '0 0 160px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="2">Completed</option>
            <option value="1">Pending</option>
            <option value="0">Rejected</option>
          </select>
          <select className="select" style={{ flex: '0 0 130px' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="all">All currencies</option>
            {state.currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No transactions match">Try different filters.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Note</th>
                <th>Status</th>
                <th className="num">Amount</th>
                <th className="num">Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const net = Number(t.amount) - Number(t.fee);
                return (
                  <tr key={t.id}>
                    <td>
                      <Link className="row-link" to={`/app/transactions/${t.id}`}>#{t.id}</Link>
                    </td>
                    <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                    <td>{t.type.replace(/_/g, ' ')}</td>
                    <td className="text-muted" style={{ maxWidth: 260 }}>{t.note || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className={`num mono text-bold ${t.drCr === 'dr' ? 'text-danger' : 'text-success'}`}>
                      {t.drCr === 'dr' ? '− ' : '+ '}
                      {formatMoney(net, t.currencyId, state.currencies, state.settings)}
                    </td>
                    <td className="num mono text-muted">
                      {t.fee > 0 ? formatMoney(t.fee, t.currencyId, state.currencies, state.settings) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
