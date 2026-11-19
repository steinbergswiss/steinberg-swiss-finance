import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { approveTransfer, deleteTransfer, pendingTransfers, rejectTransfer } from '../../lib/banking.js';
import { formatMoney, formatDate, getSetting } from '../../lib/format.js';
import { StatusBadge, Modal, EmptyState, KeyValue, Badge } from '../../components/ui.jsx';

export default function AdminPendingTransfers() {
  const { state, currentUser, apply } = useStore();
  const [viewing, setViewing] = useState(null);

  const rows = pendingTransfers(state);
  const userFor = (id) => state.users.find((u) => u.id === id);

  const creditFor = (debit) => state.transactions.find((t) => t.parentId === debit.id && t.drCr === 'cr');

  const act = (fn) => (id) => {
    const label = fn === approveTransfer ? 'Approve' : fn === rejectTransfer ? 'Reject' : 'Delete';
    if (!window.confirm(`${label} transfer #${id}? This updates the ledger only.`)) return;
    apply(fn(state, id));
  };

  const mode = getSetting(state.settings, 'send_money_action', '2');

  return (
    <>
      <div className="page-title-row">
        <h1>Pending transfers</h1>
        <span className="badge badge-neutral">
          Current policy: {mode === '1' ? 'every transfer needs approval' : 'transfers post instantly (seeded items shown for review)'}
        </span>
      </div>

      <div className="card mg-bottom-24">
        <p className="mg-0" style={{ fontSize: 14.5 }}>
          Port of <span className="text-bold">InternalTransferRequestController</span>: approve sets both the
          debit and its matching credit to completed; reject sets both to rejected; delete removes the pair.
          Switch the policy on the Settings page to make new customer transfers land here.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No transfer requests">Make a transfer while approval mode is on, or reset the data to restore the seeded request.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>From</th>
                <th>To</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Amount</th>
                <th className="num">Fee</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((debit) => {
                const credit = creditFor(debit);
                const from = userFor(debit.userId);
                const to = credit ? userFor(credit.userId) : null;
                return (
                  <tr key={debit.id}>
                    <td className="mono">#{debit.id}</td>
                    <td className="text-bold">{from ? from.name : '—'}</td>
                    <td className="text-bold">{to ? to.name : '—'}</td>
                    <td className="nowrap">{formatDate(debit.createdAt, state.settings)}</td>
                    <td><StatusBadge status={debit.status} /></td>
                    <td className="num mono text-bold">
                      {formatMoney(Number(debit.amount) - Number(debit.fee), debit.currencyId, state.currencies, state.settings)}
                    </td>
                    <td className="num mono text-muted">
                      {debit.fee > 0 ? formatMoney(debit.fee, debit.currencyId, state.currencies, state.settings) : '—'}
                    </td>
                    <td className="text-right nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewing(debit)}>Details</button>{' '}
                      {debit.status !== 2 && (
                        <button className="btn btn-success btn-sm" onClick={() => act(approveTransfer)(debit.id)}>Approve</button>
                      )}{' '}
                      {debit.status !== 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => act(rejectTransfer)(debit.id)}>Reject</button>
                      )}{' '}
                      <button className="btn btn-danger-soft btn-sm" onClick={() => act(deleteTransfer)(debit.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <Modal title={`Transfer request #${viewing.id}`} onClose={() => setViewing(null)}>
          {(() => {
            const credit = creditFor(viewing);
            const from = userFor(viewing.userId);
            const to = credit ? userFor(credit.userId) : null;
            return (
              <>
                <KeyValue
                  items={[
                    ['Debit entry', `#${viewing.id} — ${from?.name || '?'} (${viewing.drCr})`],
                    ['Credit entry', credit ? `#${credit.id} — ${to?.name || '?'} (credit)` : 'missing'],
                    ['Amount', formatMoney(Number(viewing.amount) - Number(viewing.fee), viewing.currencyId, state.currencies, state.settings)],
                    ['Fee', formatMoney(viewing.fee, viewing.currencyId, state.currencies, state.settings)],
                    ['Note', viewing.note || '—'],
                    ['Created', formatDate(viewing.createdAt, state.settings)],
                    ['Status', viewing.status === 2 ? 'Completed' : viewing.status === 1 ? 'Pending' : 'Rejected'],
                    ['Reviewed by', currentUser.name],
                  ]}
                />
                <div className="flex gap-8 mg-top-16">
                  {viewing.status !== 2 && (
                    <button className="btn btn-success" onClick={() => { apply(approveTransfer(state, viewing.id)); setViewing(null); }}>
                      Approve
                    </button>
                  )}
                  {viewing.status !== 0 && (
                    <button className="btn btn-ghost" onClick={() => { apply(rejectTransfer(state, viewing.id)); setViewing(null); }}>
                      Reject
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      )}
      <p className="field-hint mg-top-16">
        <Badge tone="warning">Note</Badge> Pending debits already reduce the sender's balance (PHP rule:
        credits count only when completed, debits count unless rejected).
      </p>
    </>
  );
}
