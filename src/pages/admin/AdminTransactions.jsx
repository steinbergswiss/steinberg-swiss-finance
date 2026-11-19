import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { formatMoney, formatDate } from '../../lib/format.js';
import { StatusBadge, EmptyState } from '../../components/ui.jsx';

export default function AdminTransactions() {
  const { state } = useStore();
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    return state.transactions
      .filter((t) => (type === 'All' ? true : t.type === type))
      .filter((t) => (status === 'all' ? true : t.status === Number(status)))
      .filter((t) => {
        if (!q.trim()) return true;
        const user = state.users.find((u) => u.id === t.userId);
        return (
          (user?.name || '').toLowerCase().includes(q.toLowerCase()) ||
          (t.note || '').toLowerCase().includes(q.toLowerCase()) ||
          String(t.id).includes(q.trim())
        );
      })
      .sort((a, b) => b.id - a.id);
  }, [state, type, status, q]);

  const userFor = (id) => state.users.find((u) => u.id === id);

  return (
    <>
      <div className="page-title-row">
        <h1>Transactions</h1>
        <span className="badge badge-neutral">{rows.length} rows</span>
      </div>

      <div className="card mg-bottom-24">
        <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
          <input className="input" style={{ flex: '1 1 260px' }} placeholder="Search customer, note or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" style={{ width: 160 }} value={type} onChange={(e) => setType(e.target.value)}>
            {['All', 'Deposit', 'Withdraw', 'Transfer', 'Payment', 'Exchange'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select className="select" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="2">Completed</option>
            <option value="1">Pending</option>
            <option value="0">Rejected</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No transactions match" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Type</th>
                <th>Method</th>
                <th>Status</th>
                <th className="num">Amount</th>
                <th className="num">Fee</th>
                <th>Pair</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const u = userFor(t.userId);
                return (
                  <tr key={t.id}>
                    <td className="mono">#{t.id}</td>
                    <td className="text-bold">{u ? u.name : `user ${t.userId}`}</td>
                    <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                    <td>{t.type.replace(/_/g, ' ')}</td>
                    <td>{t.method}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className={`num mono text-bold ${t.drCr === 'dr' ? 'text-danger' : 'text-success'}`}>
                      {t.drCr === 'dr' ? '− ' : '+ '}
                      {formatMoney(t.amount, t.currencyId, state.currencies, state.settings)}
                    </td>
                    <td className="num mono text-muted">
                      {t.fee > 0 ? formatMoney(t.fee, t.currencyId, state.currencies, state.settings) : '—'}
                    </td>
                    <td className="mono">{t.parentId ? `child of #${t.parentId}` : 'parent'}</td>
                    <td className="text-muted">{t.note || '—'}</td>
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
