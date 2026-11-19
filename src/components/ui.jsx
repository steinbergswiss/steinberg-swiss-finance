// Small shared UI pieces, all styled by the template-derived design system.

export function Alert({ type = 'info', children, onClose }) {
  const cls = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-error' : type === 'warning' ? 'alert-warning' : 'alert-info';
  return (
    <div className={`alert ${cls}`} role="alert">
      <span className="flex gap-8" style={{ flex: 1, flexWrap: 'wrap' }}>{children}</span>
      {onClose && (
        <button className="btn-link" onClick={onClose} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  // PHP transaction_status(): 0 rejected, 1 pending, 2 completed
  if (status === 2) return <Badge tone="success">Completed</Badge>;
  if (status === 1) return <Badge tone="warning">Pending</Badge>;
  if (status === 0) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="neutral">Unknown</Badge>;
}

export function TicketStatusBadge({ status }) {
  if (status === 0) return <Badge tone="warning">Pending</Badge>;
  if (status === 1) return <Badge tone="info">Active</Badge>;
  return <Badge tone="neutral">Closed</Badge>;
}

export function UserStatusBadge({ status }) {
  return Number(status) === 1 ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>;
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 860 } : undefined} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', children }) {
  return (
    <div className="card text-center" style={{ padding: '48px 24px' }}>
      <h3 className="text-muted">{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  return (
    <div className="field">
      <label className="field-label">
        {label} {required && <span className="span-primary">*</span>}
      </label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export function Stat({ title, value, tone }) {
  return (
    <div className="stat-box">
      <div className="title">{title}</div>
      <div className={`value ${tone ? `text-${tone}` : ''}`}>{value}</div>
    </div>
  );
}

export function KeyValue({ items }) {
  return (
    <dl className="detail-list">
      {items.map(([k, v], i) => (
        <span key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </span>
      ))}
    </dl>
  );
}
