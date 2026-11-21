import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { balanceFor, balancesForUser } from '../../lib/banking.js';
import { formatMoney, formatDate, getSetting } from '../../lib/format.js';
import { KeyValue } from '../../components/ui.jsx';

export default function Accounts() {
  const { state, currentUser } = useStore();
  const userId = currentUser.id;
  const branch = state.branches.find((b) => b.id === currentUser.branchId);
  const base = Number(getSetting(state.settings, 'base_currency', '1'));

  const holdings = balancesForUser(state, userId).map((b) => ({
    currency: state.currencies.find((c) => c.id === b.currencyId),
    balance: b.balance,
  }));

  return (
    <>
      <div className="page-title-row">
        <h1>Accounts</h1>
        <Link className="btn btn-sm" to="/app/statements">Statements</Link>
      </div>

      <div className="wallet-card mg-bottom-24">
        <div className="wc-top">
          <div>
            <div className="wc-label">Current account — GBP</div>
            <div className="wc-account mono">{currentUser.accountNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="wc-label">Balance</div>
            <div className="wc-balance mono">
              {formatMoney(balanceFor(state, userId, base), base, state.currencies, state.settings)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">Currency holdings</div>
          <div className="table-wrap" style={{ boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th className="num">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.currency.id}>
                    <td className="text-bold">{h.currency.name}</td>
                    <td className="num mono">{formatMoney(h.balance, h.currency.id, state.currencies, state.settings)}</td>
                    <td>Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="field-hint mg-top-16">
            Balances follow the PHP rule: completed credits minus every debit that is not rejected.
            Pending debits already reduce the available balance; pending credits appear only after approval.
          </p>
        </div>

        <div className="card">
          <div className="card-title">Account details</div>
          <KeyValue
            items={[
              ['Account holder', currentUser.name],
              ['Account number', currentUser.accountNumber],
              ['Account type', 'Current'],
              ['Email', currentUser.email],
              ['Phone', `+${currentUser.countryCode} ${currentUser.phone}`],
              ['Opened', formatDate(currentUser.createdAt, state.settings)],
              ['Status', Number(currentUser.status) === 1 ? 'Active' : 'Inactive'],
            ]}
          />
          <p className="field-hint mg-top-16">
            The PHP data model has one account number per customer plus per-currency balances — this page
            mirrors exactly that.
          </p>
        </div>
      </div>
    </>
  );
}
