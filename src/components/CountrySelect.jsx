import { useMemo, useState } from 'react';
import { COUNTRIES, flagEmoji } from '../data/countries.js';

// Searchable country + dial-code dropdown (includes every country, with "+").
export default function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = COUNTRIES.find((c) => c.dial === value) || null;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.dial.includes(needle),
    );
  }, [q]);

  return (
    <div className="country-select">
      <button
        type="button"
        className="input country-toggle"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected
          ? `${flagEmoji(selected.code)} ${selected.name} (${selected.dial})`
          : 'Select country'}
      </button>
      {open && (
        <div className="country-dropdown">
          <input
            autoFocus
            className="input"
            placeholder="Search country or code…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul role="listbox">
            {filtered.slice(0, 80).map((c) => (
              <li key={c.code} role="option" aria-selected={c.dial === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.dial);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  <span>{flagEmoji(c.code)}</span>
                  <span className="country-name">{c.name}</span>
                  <span className="mono">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
