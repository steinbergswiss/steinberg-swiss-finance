import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { deleteBeneficiary, saveBeneficiary } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { Field, Modal, EmptyState, Alert } from '../../components/ui.jsx';

const EMPTY = { name: '', accountNumber: '', bank: '', nickname: '' };

export default function Beneficiaries() {
  const { state, currentUser, apply } = useStore();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, beneficiary = edit
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);

  const mine = state.beneficiaries
    .filter((b) => b.userId === currentUser.id)
    .sort((a, b) => a.id - b.id);

  const open = (b) => {
    setEditing(b || {});
    setForm(b ? { name: b.name, accountNumber: b.accountNumber, bank: b.bank, nickname: b.nickname || '' } : EMPTY);
    setErrors([]);
  };

  const save = (e) => {
    e.preventDefault();
    const result = saveBeneficiary(state, currentUser.id, form, editing?.id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setEditing(null);
  };

  const remove = (id) => {
    if (!window.confirm('Remove this beneficiary?')) return;
    apply(deleteBeneficiary(state, currentUser.id, id));
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Beneficiaries</h1>
        <button className="btn btn-sm" onClick={() => open(null)}>Add beneficiary</button>
      </div>

      <p className="mg-bottom-24">
        Saved payees for the transfer form. The PHP script has no beneficiary table — this screen is a
        showcase extension; the entries are local only.
      </p>

      {mine.length === 0 ? (
        <EmptyState title="No beneficiaries yet">Add one to speed up your transfers.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account number</th>
                <th>Bank</th>
                <th>Nickname</th>
                <th>Added</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((b) => (
                <tr key={b.id}>
                  <td className="text-bold">{b.name}</td>
                  <td className="mono">{b.accountNumber}</td>
                  <td>{b.bank}</td>
                  <td>{b.nickname || '—'}</td>
                  <td className="nowrap">{formatDate(b.createdAt, state.settings)}</td>
                  <td className="text-right nowrap">
                    <button className="btn btn-ghost btn-sm" onClick={() => open(b)}>Edit</button>{' '}
                    <button className="btn btn-danger-soft btn-sm" onClick={() => remove(b.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit beneficiary' : 'Add beneficiary'} onClose={() => setEditing(null)}>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={save} noValidate>
            <Field label="Name" required>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Account number" required>
              <input className="input mono" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
            </Field>
            <Field label="Bank" required hint="Use a bank name, e.g. Helvetia Credit Bank.">
              <input className="input" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
            </Field>
            <Field label="Nickname">
              <input className="input" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            </Field>
            <button className="btn btn-block" type="submit">{editing.id ? 'Save changes' : 'Add beneficiary'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
