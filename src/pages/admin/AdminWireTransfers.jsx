import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { approveWire, deleteWire, rejectWire, wireTransfers } from '../../lib/banking.js';
import { formatMoney, formatDate } from '../../lib/format.js';
import { StatusBadge, Modal, KeyValue, EmptyState } from '../../components/ui.jsx';

export default function AdminWireTransfers() {
  const { state, apply } = useStore();
  const [viewing, setViewing] = useState(null);
  const rows = wireTransfers(state);
  const pending = rows.filter((t) => t.status === 1).length;
  const userFor = (id) => state.users.find((u) => u.id === id);

  const act = (fn) => (id) => {
    const label = fn === approveWire ? 'Approve' : fn === rejectWire ? 'Reject' : 'Delete';
    if (!window.confirm(`${label} wire transfer #${id}? This updates the ledger only.`)) return;
    apply(fn(state, id));
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Wire transfers</h1>
        <span className="badge badge-neutral">{pending} pending</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No wire transfer requests" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>From</th>
                <th>Beneficiary</th>
                <th>Bank</th>
                <th>Date</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const u = userFor(t.userId);
                const d = t.transactionDetails || {};
                return (
                  <tr key={t.id}>
                    <td className="mono">#{t.id}</td>
                    <td className="text-bold">{u ? u.name : `user ${t.userId}`}</td>
                    <td>{d.accountHolderName || '—'}</td>
                    <td>{t.bank || '—'}</td>
                    <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                    <td className="num mono text-bold">
                      {formatMoney(t.amount, t.currencyId, state.currencies, state.settings)}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-right nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewing(t)}>Details</button>{' '}
                      {t.status !== 2 && (
                        <button className="btn btn-success btn-sm" onClick={() => act(approveWire)(t.id)}>Approve</button>
                      )}{' '}
                      {t.status !== 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => act(rejectWire)(t.id)}>Reject</button>
                      )}{' '}
                      <button className="btn btn-danger-soft btn-sm" onClick={() => act(deleteWire)(t.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <Modal title={`Wire transfer #${viewing.id}`} onClose={() => setViewing(null)}>
          {(() => {
            const u = userFor(viewing.userId);
            const d = viewing.transactionDetails || {};
            return (
              <>
                <KeyValue
                  items={[
                    ['Sender', u ? `${u.name} (${u.accountNumber})` : `user ${viewing.userId}`],
                    ['Beneficiary', d.accountHolderName || '—'],
                    ['Beneficiary account', d.accountNumber || '—'],
                    ['Bank', viewing.bank || '—'],
                    ['SWIFT / BIC', d.swiftCode || '—'],
                    ['Amount', formatMoney(viewing.amount, viewing.currencyId, state.currencies, state.settings)],
                    ['Note', viewing.note || '—'],
                    ['Date', formatDate(viewing.createdAt, state.settings)],
                    ['Status', viewing.status === 2 ? 'Completed' : viewing.status === 1 ? 'Pending' : 'Rejected'],
                  ]}
                />
                <div className="flex gap-8 mg-top-16">
                  {viewing.status !== 2 && (
                    <button className="btn btn-success" onClick={() => { apply(approveWire(state, viewing.id)); setViewing(null); }}>
                      Approve
                    </button>
                  )}
                  {viewing.status !== 0 && (
                    <button className="btn btn-ghost" onClick={() => { apply(rejectWire(state, viewing.id)); setViewing(null); }}>
                      Reject
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </>
  );
}
