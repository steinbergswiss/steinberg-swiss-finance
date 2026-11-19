import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { formatMoney, formatDate } from '../../lib/format.js';
import { StatusBadge, KeyValue, Alert } from '../../components/ui.jsx';

export default function TransactionDetail() {
  const { id } = useParams();
  const { state, currentUser } = useStore();

  const t = state.transactions.find((x) => x.id === Number(id) && x.userId === currentUser.id);
  if (!t) {
    return (
      <>
        <div className="page-title-row"><h1>Transaction details</h1></div>
        <Alert type="error">Transaction not found or it does not belong to your account.</Alert>
        <Link to="/app/transactions" className="btn btn-secondary btn-sm">Back to transactions</Link>
      </>
    );
  }

  const pair = t.parentId
    ? state.transactions.find((x) => x.id === t.parentId)
    : state.transactions.find((x) => x.parentId === t.id);

  const otherUser = pair ? state.users.find((u) => u.id === pair.userId) : null;
  const net = Number(t.amount) - Number(t.fee);

  return (
    <>
      <div className="page-title-row">
        <h1>Transaction #{t.id}</h1>
        <Link className="btn btn-secondary btn-sm" to="/app/transactions">Back</Link>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">
            {t.type.replace(/_/g, ' ')}
            <StatusBadge status={t.status} />
          </div>
          <KeyValue
            items={[
              ['Direction', t.drCr === 'dr' ? 'Debit (out)' : 'Credit (in)'],
              ['Net amount', formatMoney(net, t.currencyId, state.currencies, state.settings)],
              ['Gross amount', formatMoney(t.amount, t.currencyId, state.currencies, state.settings)],
              ['Fee', t.fee > 0 ? formatMoney(t.fee, t.currencyId, state.currencies, state.settings) : '—'],
              ['Method', t.method || '—'],
              ['Date', formatDate(t.createdAt, state.settings)],
              ['Note', t.note || '—'],
              ['Status', t.status === 2 ? 'Completed' : t.status === 1 ? 'Pending' : 'Rejected'],
            ]}
          />
          {t.status === 1 && (
            <p className="field-hint mg-top-16">
              {t.drCr === 'dr'
                ? 'Pending debits already reduce the available balance (PHP rule). The matching credit will appear for the recipient after admin approval.'
                : 'Pending credits only become available after admin approval (PHP rule).'}
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-title">Counterpart</div>
          {pair ? (
            <KeyValue
              items={[
                ['Pair entry', `#${pair.id} (${pair.drCr === 'dr' ? 'debit' : 'credit'})`],
                ['Account holder', otherUser ? otherUser.name : 'Customer'],
                ['Account number', otherUser?.accountNumber || '—'],
                ['Pair status', pair.status === 2 ? 'Completed' : pair.status === 1 ? 'Pending' : 'Rejected'],
                ['Pair amount', formatMoney(Number(pair.amount) - Number(pair.fee), pair.currencyId, state.currencies, state.settings)],
              ]}
            />
          ) : (
            <p className="text-muted">No paired ledger entry.</p>
          )}
        </div>
      </div>
    </>
  );
}
