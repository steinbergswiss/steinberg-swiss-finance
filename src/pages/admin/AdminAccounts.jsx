import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { balanceFor } from '../../lib/banking.js';
import { formatMoney, formatDate } from '../../lib/format.js';
import { UserStatusBadge } from '../../components/ui.jsx';

export default function AdminAccounts() {
  const { state } = useStore();
  const [q, setQ] = useState('');

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
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="mono text-bold">{u.accountNumber}</td>
                <td className="text-bold">{u.name}</td>
                <td>{u.email}</td>
                <td><UserStatusBadge status={u.status} /></td>
                <td className="nowrap">{formatDate(u.createdAt, state.settings)}</td>
                {state.currencies.filter((c) => c.status === 1).map((c) => (
                  <td key={c.id} className="num mono">{formatMoney(balanceFor(state, u.id, c.id), c.id, state.currencies, state.settings)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field-hint mg-top-16">
        One account number per customer plus per-currency balances — the exact data model of the PHP script.
      </p>
    </>
  );
}
