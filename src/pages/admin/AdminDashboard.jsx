import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { balancesForUser, pendingTransfers } from '../../lib/banking.js';
import { formatMoney, formatDate, getSetting } from '../../lib/format.js';
import { StatusBadge, Badge } from '../../components/ui.jsx';

export default function AdminDashboard() {
  const { state } = useStore();
  const customers = state.users.filter((u) => u.userType === 'customer');
  const active = customers.filter((u) => Number(u.status) === 1).length;
  const inactive = customers.length - active;
  const base = Number(getSetting(state.settings, 'base_currency', '1'));

  const totalPerCurrency = state.currencies.map((c) => ({
    currency: c,
    total: customers.reduce((sum, u) => sum + balancesForUser(state, u.id).find((b) => b.currencyId === c.id)?.balance || 0, 0),
  }));

  const recent = [...state.transactions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8);
  const pending = pendingTransfers(state).filter((t) => t.status === 1);
  const openTickets = state.tickets.filter((t) => t.status !== 2).length;

  const userFor = (id) => state.users.find((u) => u.id === id);

  return (
    <>
      <div className="page-title-row">
        <h1>Admin console</h1>
        <Link className="btn btn-sm" to="/admin/pending-transfers">Review pending transfers</Link>
      </div>

      <div className="grid grid-4 mg-bottom-24">
        <div className="stat-box">
          <div className="title">Active customers</div>
          <div className="value">{active}</div>
        </div>
        <div className="stat-box">
          <div className="title">Inactive customers</div>
          <div className="value">{inactive}</div>
        </div>
        <div className="stat-box">
          <div className="title">Pending transfers</div>
          <div className="value text-warning">{pending.length}</div>
        </div>
        <div className="stat-box">
          <div className="title">Open tickets</div>
          <div className="value">{openTickets}</div>
        </div>
      </div>

      <div className="grid grid-3 mg-bottom-24">
        {totalPerCurrency.map(({ currency, total }) => (
          <div className="stat-box" key={currency.id}>
            <div className="title">Liabilities — {currency.name}</div>
            <div className="value mono" style={{ fontSize: 19 }}>{formatMoney(total, currency.id, state.currencies, state.settings)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">
          Recent transactions (all customers)
          <Link className="btn-link" to="/admin/transactions">View all</Link>
        </div>
        <div className="table-wrap" style={{ boxShadow: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => {
                const u = userFor(t.userId);
                return (
                  <tr key={t.id}>
                    <td className="mono">#{t.id}</td>
                    <td className="text-bold">{u ? u.name : '—'}</td>
                    <td>{t.type.replace(/_/g, ' ')}</td>
                    <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className={`num mono text-bold ${t.drCr === 'dr' ? 'text-danger' : 'text-success'}`}>
                      {t.drCr === 'dr' ? '− ' : '+ '}
                      {formatMoney(Number(t.amount) - Number(t.fee), t.currencyId, state.currencies, state.settings)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="field-hint mg-top-16">
          {base === 1 ? 'GBP is the base currency.' : ''} Balances follow the PHP rule
          (completed credits minus non-rejected debits).
        </p>
      </div>
    </>
  );
}
