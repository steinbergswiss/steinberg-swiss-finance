import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { formatMoney, formatDate } from '../../lib/format.js';
import { StatusBadge, KeyValue, Alert } from '../../components/ui.jsx';

export default function AdminTransactionDetail() {
  const { id } = useParams();
  const { state } = useStore();
  const t = state.transactions.find((x) => x.id === Number(id));

  if (!t) {
    return (
      <>
        <div className="page-title-row"><h1>Transaction details</h1></div>
        <Alert type="error">Transaction not found.</Alert>
        <Link className="btn btn-secondary btn-sm" to="/admin/transactions">Back</Link>
      </>
    );
  }

  const user = state.users.find((u) => u.id === t.userId);
  const pair = t.parentId
    ? state.transactions.find((x) => x.id === t.parentId)
    : state.transactions.find((x) => x.parentId === t.id);
  const pairUser = pair ? state.users.find((u) => u.id === pair.userId) : null;
  const d = t.transactionDetails || {};

  return (
    <>
      <div className="page-title-row">
        <h1>Transaction #{t.id}</h1>
        <Link className="btn btn-secondary btn-sm" to="/admin/transactions">Back</Link>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">
            {t.type.replace(/_/g, ' ')}
            <StatusBadge status={t.status} />
          </div>
          <KeyValue
            items={[
              ['Account', user ? `${user.name} — ${user.accountNumber}` : `user ${t.userId}`],
              ['Direction', t.drCr === 'dr' ? 'Debit (out)' : 'Credit (in)'],
              ['Amount', formatMoney(t.amount, t.currencyId, state.currencies, state.settings)],
              ['Fee', t.fee > 0 ? formatMoney(t.fee, t.currencyId, state.currencies, state.settings) : '—'],
              ['Method', t.method || '—'],
              ['Date', formatDate(t.createdAt, state.settings)],
              ['Note', t.note || '—'],
              ['Status', t.status === 2 ? 'Completed' : t.status === 1 ? 'Pending' : 'Rejected'],
            ]}
          />
        </div>

        <div className="card">
          <div className="card-title">Counterparty / beneficiary</div>
          {pair ? (
            <KeyValue
              items={[
                ['Paired entry', `#${pair.id} (${pair.drCr === 'dr' ? 'debit' : 'credit'})`],
                ['Account holder', pairUser ? pairUser.name : '—'],
                ['Account number', pairUser?.accountNumber || '—'],
                ['Paired amount', formatMoney(pair.amount, pair.currencyId, state.currencies, state.settings)],
                ['Paired status', pair.status === 2 ? 'Completed' : pair.status === 1 ? 'Pending' : 'Rejected'],
              ]}
            />
          ) : d.accountNumber ? (
            <KeyValue
              items={[
                ['Account holder', d.accountHolderName || '—'],
                ['Account number', d.accountNumber || '—'],
                ['Bank', t.bank || '—'],
                ['SWIFT / BIC', d.swiftCode || '—'],
                ['Transaction ID', d.txHash || '—'],
              ]}
            />
          ) : (
            <p className="text-muted">No counterparty information.</p>
          )}
        </div>
      </div>
    </>
  );
}
