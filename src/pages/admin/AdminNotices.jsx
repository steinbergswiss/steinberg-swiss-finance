import { useState } from 'react';
import { useStore } from '../../lib/store.jsx';
import { deleteNotice, saveNotice } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { Field, Modal, Badge, EmptyState, Alert } from '../../components/ui.jsx';

const EMPTY = { title: '', body: '', status: 1 };

export default function AdminNotices() {
  const { state, apply } = useStore();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);

  const notices = [...state.notices].sort((a, b) => b.id - a.id);

  const open = (n) => {
    setEditing(n || {});
    setForm(n ? { title: n.title, body: n.body, status: n.status } : EMPTY);
    setErrors([]);
  };

  const save = (e) => {
    e.preventDefault();
    const result = saveNotice(state, form, editing?.id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setEditing(null);
  };

  const remove = (id) => {
    if (!window.confirm('Delete this notice?')) return;
    apply(deleteNotice(state, id));
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Notices</h1>
        <button className="btn btn-sm" onClick={() => open(null)}>New notice</button>
      </div>

      <p className="mg-bottom-24">
        Published notices appear under “Updates” on every customer dashboard. The PHP script has News and
        email/SMS templates; on the static site those are collapsed into this in-app notice board.
      </p>

      {notices.length === 0 ? (
        <EmptyState title="No notices" />
      ) : (
        <div className="flex" style={{ flexDirection: 'column', gap: 16 }}>
          {notices.map((n) => (
            <div className="card" key={n.id}>
              <div className="card-title">
                {n.title}
                <span className="flex gap-8">
                  {Number(n.status) === 1 ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
                </span>
              </div>
              <p>{n.body}</p>
              <p className="field-hint">Updated {formatDate(n.updatedAt, state.settings)}</p>
              <div className="flex gap-8">
                <button className="btn btn-ghost btn-sm" onClick={() => open(n)}>Edit</button>
                <button className="btn btn-danger-soft btn-sm" onClick={() => remove(n.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit notice' : 'New notice'} onClose={() => setEditing(null)}>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={save} noValidate>
            <Field label="Title" required>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Body" required>
              <textarea className="textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
                <option value={1}>Published</option>
                <option value={0}>Draft</option>
              </select>
            </Field>
            <button className="btn btn-block" type="submit">{editing.id ? 'Save notice' : 'Publish notice'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
