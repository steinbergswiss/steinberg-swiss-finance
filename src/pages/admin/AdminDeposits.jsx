import { useStore } from '../../lib/store.jsx';
import { approveDeposit, bitcoinDeposits, deleteDeposit, rejectDeposit } from '../../lib/banking.js';
import { formatMoney, formatDate, getSetting } from '../../lib/format.js';
import { StatusBadge, EmptyState } from '../../components/ui.jsx';

export default function AdminDeposits() {
  const { state, apply } = useStore();
  const rows = bitcoinDeposits(state);
  const pending = rows.filter((t) => t.status === 1).length;
  const address = getSetting(state.settings, 'btc_address', 'bc1qsteinbergswissfinanceexampleaddress000');
  const userFor = (id) => state.users.find((u) => u.id === id);

  const act = (fn) => (id) => {
    const label = fn === approveDeposit ? 'Approve' : fn === rejectDeposit ? 'Reject' : 'Delete';
    if (!window.confirm(`${label} deposit #${id}? This updates the ledger only.`)) return;
    apply(fn(state, id));
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Deposits</h1>
        <span className="badge badge-neutral">{pending} pending</span>
      </div>

      <div className="card mg-bottom-24">
        <div className="card-title">Current Bitcoin deposit address</div>
        <p className="mono" style={{ wordBreak: 'break-all', color: '#0a1023', fontWeight: 700 }}>{address}</p>
        <p className="field-hint mg-0">
          Customers see this address on the Deposit page. Change it under <b>Settings → Bitcoin deposit address</b>.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No deposit requests" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
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
                    <td className="num mono text-bold">
                      {formatMoney(t.amount, t.currencyId, state.currencies, state.settings)}
                    </td>
                    <td className="mono text-muted" style={{ wordBreak: 'break-all', maxWidth: 260 }}>
                      {t.transactionDetails?.txHash || '—'}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-right nowrap">
                      {t.status !== 2 && (
                        <button className="btn btn-success btn-sm" onClick={() => act(approveDeposit)(t.id)}>Approve</button>
                      )}{' '}
                      {t.status !== 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => act(rejectDeposit)(t.id)}>Reject</button>
                      )}{' '}
                      <button className="btn btn-danger-soft btn-sm" onClick={() => act(deleteDeposit)(t.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="field-hint mg-top-16">
        Approving credits the customer's balance; rejecting or deleting leaves it unchanged. Pending
        credits only count toward the balance after approval.
      </p>
    </>
  );
}
