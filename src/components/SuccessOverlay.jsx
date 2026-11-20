import { useEffect } from 'react';

// Full-page success animation for transfers (local + international wire).
export default function SuccessOverlay({ title, subtitle, amount, detail, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="success-overlay" onClick={onClose} role="dialog" aria-label={title}>
      <div className="success-card">
        <svg className="success-check" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" />
          <path d="M30 52 L45 66 L72 38" />
        </svg>
        <h2>{title}</h2>
        {amount && <div className="success-amount">{amount}</div>}
        {detail && <p>{detail}</p>}
        {subtitle && <p className="success-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
