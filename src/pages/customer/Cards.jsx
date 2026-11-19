import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { toggleCardFreeze } from '../../lib/banking.js';
import { maskPan, formatMoney, formatDate } from '../../lib/format.js';
import { Badge, EmptyState } from '../../components/ui.jsx';

export default function Cards() {
  const { state, currentUser, apply } = useStore();
  const [revealed, setRevealed] = useState({});
  const mine = state.cards.filter((c) => c.userId === currentUser.id);

  const toggle = (id) => apply(toggleCardFreeze(state, currentUser.id, id));

  return (
    <>
      <div className="page-title-row">
        <h1>Cards</h1>
        <span className="badge badge-neutral">Masked PANs</span>
      </div>

      <p className="mg-bottom-24">
        The PHP dashboard shows cards with masked numbers (•••• •••• ••••). The PANs below use the
        "4000…" range and belong to no payment network.
      </p>

      {mine.length === 0 ? (
        <EmptyState title="No cards">This account has no cards.</EmptyState>
      ) : (
        <div className="grid grid-2">
          {mine.map((c) => (
            <div key={c.id} className={`bank-card ${c.id % 2 ? 'red' : 'dark'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{c.type}</span>
                {c.status === 'frozen' ? <Badge tone="warning">Frozen</Badge> : <Badge tone="success">Active</Badge>}
              </div>
              <div className="pan mono">{revealed[c.id] ? c.pan : maskPan(c.pan)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13 }}>
                  Expiry {c.expiry} · {formatMoney(0, c.currencyId, state.currencies, state.settings)} limit · Added{' '}
                  {formatDate(c.createdAt, state.settings)}
                </span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{c.network}</span>
              </div>
              <div className="flex gap-8 mg-top-16">
                <button className="btn btn-secondary btn-sm" onClick={() => setRevealed({ ...revealed, [c.id]: !revealed[c.id] })}>
                  {revealed[c.id] ? 'Hide PAN' : 'Reveal PAN'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => toggle(c.id)}>
                  {c.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
