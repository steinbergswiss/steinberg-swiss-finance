import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../lib/store.jsx';
import { closeTicket, replyTicket } from '../../lib/banking.js';
import { formatDate } from '../../lib/format.js';
import { TicketStatusBadge, Alert } from '../../components/ui.jsx';

export default function TicketDetail() {
  const { id } = useParams();
  const { state, currentUser, apply } = useStore();
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);

  const ticket = state.tickets.find((t) => t.id === Number(id) && t.userId === currentUser.id);
  if (!ticket) {
    return (
      <>
        <div className="page-title-row"><h1>Ticket</h1></div>
        <Alert type="error">Ticket not found.</Alert>
        <Link className="btn btn-secondary btn-sm" to="/app/tickets">Back</Link>
      </>
    );
  }

  const messages = state.ticketMessages
    .filter((m) => m.supportTicketId === ticket.id)
    .sort((a, b) => a.id - b.id);
  const userFor = (uid) => state.users.find((u) => u.id === uid);

  const reply = (e) => {
    e.preventDefault();
    setErrors([]);
    const result = replyTicket(state, currentUser.id, ticket.id, message);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    apply(result);
    setMessage('');
  };

  const close = () => {
    if (!window.confirm('Close this ticket?')) return;
    apply(closeTicket(state, currentUser.id, ticket.id));
  };

  return (
    <>
      <div className="page-title-row">
        <h1>Ticket #{ticket.id}</h1>
        <div className="actions">
          {ticket.status === 1 && <button className="btn btn-ghost btn-sm" onClick={close}>Close ticket</button>}
          <Link className="btn btn-secondary btn-sm" to="/app/tickets">Back</Link>
        </div>
      </div>

      <div className="card mg-bottom-24">
        <div className="card-title">
          {ticket.subject}
          <TicketStatusBadge status={ticket.status} />
        </div>
        <p className="field-hint mg-0">
          Created {formatDate(ticket.createdAt, state.settings)} · {messages.length} message(s)
        </p>
      </div>

      <div className="thread mg-bottom-24">
        {messages.map((m) => {
          const sender = userFor(m.senderId);
          const staff = sender?.userType === 'admin';
          return (
            <div key={m.id} className={`thread-item ${staff ? 'staff' : ''}`}>
              <div className="meta">
                <span className="who">{sender ? sender.name : 'Unknown'} {staff && '(staff)'}</span>
                <span>{formatDate(m.createdAt, state.settings)}</span>
              </div>
              <div>{m.message}</div>
            </div>
          );
        })}
      </div>

      {ticket.status !== 2 ? (
        <div className="card">
          {errors.length > 0 && <Alert type="error">{errors.join(' ')}</Alert>}
          <form onSubmit={reply} noValidate>
            <label className="field-label">Reply</label>
            <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a reply…" />
            <button className="btn" type="submit">Reply to ticket</button>
          </form>
        </div>
      ) : (
        <Alert type="info">This ticket is closed. The PHP rule prevents replies to closed tickets.</Alert>
      )}
    </>
  );
}
