import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { balanceFor, balancesForUser } from '../../lib/banking.js';
import { formatMoney, formatDate, maskPan, getSetting } from '../../lib/format.js';
import { StatusBadge, Badge } from '../../components/ui.jsx';

export default function Dashboard() {
  const { state, currentUser } = useStore();
  const userId = currentUser.id;
  const base = Number(getSetting(state.settings, 'base_currency', '1'));
  const balances = balancesForUser(state, userId);
  const baseBal = balanceFor(state, userId, base);

  const recent = state.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 10);

  const myCards = state.cards.filter((c) => c.userId === userId);
  const notices = state.notices.filter((n) => Number(n.status) === 1);
  const openTickets = state.tickets.filter((t) => t.userId === userId && t.status !== 2).length;

  return (
    <>
      <div className="page-title-row">
        <div className="flex items-center gap-12" style={{ gap: 12 }}>
          {currentUser.profilePicture ? (
            <img src={currentUser.profilePicture} alt="Profile" style={{ width: 56, height: 56, borderRadius: 999, objectFit: 'cover', border: '2px solid var(--line)' }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 56, height: 56, fontSize: 22 }}>{currentUser.name.charAt(0).toUpperCase()}</div>
          )}
          <h1>Good day, {currentUser.name.split(' ')[0]}</h1>
        </div>
        <div className="actions">
          <Link className="btn btn-sm" to="/app/transfer">Local transfer</Link>
          <Link className="btn btn-secondary btn-sm" to="/app/wire">International Wire Transfer</Link>
        </div>
      </div>

      <div className="wallet-card mg-bottom-24">
        <div className="wc-top">
          <div>
            <div className="wc-label">Account number</div>
            <div className="wc-account mono">{currentUser.accountNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="wc-label">Available balance</div>
            <div className="wc-balance mono">{formatMoney(baseBal, base, state.currencies, state.settings)}</div>
          </div>
        </div>
        <div className="wc-actions">
          <Link to="/app/transfer" className="btn btn-secondary btn-sm">Local transfer</Link>
          <Link to="/app/wire" className="btn btn-secondary btn-sm">International Wire Transfer</Link>
          <Link to="/app/statements" className="btn btn-secondary btn-sm">Statements</Link>
          <Link to="/app/cards" className="btn btn-secondary btn-sm">Cards</Link>
          <Link to="/app/tickets" className="btn btn-secondary btn-sm">Support</Link>
        </div>
      </div>

      <div className="grid grid-4 mg-bottom-24">
        {balances.map((b) => (
          <div className="stat-box" key={b.currencyId}>
            <div className="title">{b.name} balance</div>
            <div className="value mono" style={{ fontSize: 20 }}>
              {formatMoney(b.balance, b.currencyId, state.currencies, state.settings)}
            </div>
          </div>
        ))}
        <div className="stat-box">
          <div className="title">Open tickets</div>
          <div className="value">{openTickets}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">
            Recent transactions
            <Link className="btn-link" to="/app/transactions">View all</Link>
          </div>
          {recent.length === 0 && <p className="text-muted">No Record Found</p>}
          <div className="table-wrap" style={{ boxShadow: 'none' }}>
            <table className="table">
              <tbody>
                {recent.map((t) => {
                  const net = Number(t.amount) - Number(t.fee);
                  return (
                    <tr key={t.id}>
                      <td>
                        <Link className="row-link" to={`/app/transactions/${t.id}`}>
                          {t.type.replace(/_/g, ' ')}
                        </Link>
                        <div className="text-muted" style={{ fontSize: 12.5 }}>{t.note || '—'} · {formatDate(t.createdAt, state.settings)}</div>
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className={`num mono text-bold ${t.drCr === 'dr' ? 'text-danger' : 'text-success'}`}>
                        {t.drCr === 'dr' ? '− ' : '+ '}
                        {formatMoney(net, t.currencyId, state.currencies, state.settings)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex" style={{ flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-title">
              My cards
              <Link className="btn-link" to="/app/cards">View all</Link>
            </div>
            <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
              {myCards.slice(0, 2).map((c) => (
                <div className={`bank-card ${c.id % 2 ? 'red' : 'dark'}`} key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800 }}>{c.type}</span>
                    {c.status === 'frozen' ? <Badge tone="warning">Frozen</Badge> : <Badge tone="success">Active</Badge>}
                  </div>
                  <div className="pan mono">{maskPan(c.pan)}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Expiry {c.expiry}</span>
                    <span>{c.network}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Updates</div>
            <div className="flex" style={{ flexDirection: 'column', gap: 14 }}>
              {notices.length === 0 && <p className="text-muted">No notices.</p>}
              {notices.map((n) => (
                <div key={n.id}>
                  <div className="text-bold text-ink">{n.title}</div>
                  <div className="text-muted" style={{ fontSize: 13.5 }}>{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
