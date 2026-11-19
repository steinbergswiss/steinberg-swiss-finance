import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { createTicket } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { Field, Modal, TicketStatusBadge, EmptyState, Alert } from '../../components/ui.jsx';

export default function Tickets() {
  const { state, currentUser, apply } = useStore();
  const [filter, setFilter] = useState('all'); // all | pending | active | closed
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [errors, setErrors] = useState([]);

  const mine = state.tickets
    .filter((t) => t.userId === currentUser.id)
    .filter((t) => (filter === 'all' ? true : filter === 'pending' ? t.status === 0 : filter === 'active' ? t.status === 1 : t.status === 2))
    .sort((a, b) => b.id - a.id);

  const submit = (e) => {
    e.preventDefault();
    setErrors([]);
    const result = createTicket(state, currentUser.id, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setCreating(false);
    setForm({ subject: '', message: '' });
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Support tickets</h1>
        <button className="btn btn-sm" onClick={() => setCreating(true)}>Create new ticket</button>
      </div>

      <div className="flex flex-wrap gap-8 mg-bottom-24">
        {[['all', 'All'], ['pending', 'Pending'], ['active', 'Active'], ['closed', 'Closed']].map(([k, label]) => (
          <button key={k} className={`btn btn-sm ${filter === k ? '' : 'btn-ghost'}`} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      {mine.length === 0 ? (
        <EmptyState title="No tickets here">Create a ticket to try the flow.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((t) => (
                <tr key={t.id}>
                  <td className="mono">#{t.id}</td>
                  <td>
                    <Link className="row-link" to={`/app/tickets/${t.id}`}>{t.subject}</Link>
                  </td>
                  <td><TicketStatusBadge status={t.status} /></td>
                  <td className="nowrap">{formatDate(t.createdAt, state.settings)}</td>
                  <td className="text-right">
                    <Link className="btn btn-ghost btn-sm" to={`/app/tickets/${t.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <Modal title="Create new ticket" onClose={() => setCreating(false)}>
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={submit} noValidate>
            <Field label="Subject" required>
              <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </Field>
            <Field label="Message" required hint="Attachments are not available in the static site (PHP allows jpeg/png/doc/pdf/docx/zip).">
              <textarea className="textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Field>
            <button className="btn btn-block" type="submit">Submit ticket</button>
          </form>
        </Modal>
      )}
    </>
  );
}
