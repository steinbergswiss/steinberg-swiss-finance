// Formatting helpers. Settings-driven where the PHP script was settings-driven
// (currency_position, date_format, time_format).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getSetting(settings, key, fallback = '') {
  const row = settings[key];
  return row === undefined || row === null || row === '' ? fallback : String(row);
}

export function currencyName(currencyId, currencies) {
  const c = currencies.find((x) => x.id === currencyId);
  return c ? c.name : 'GBP';
}

// PHP: decimalPlace($amount, currency($currency->name))
export function formatMoney(amount, currencyId, currencies, settings) {
  const num = Number(amount || 0);
  const sym = currencyName(currencyId, currencies);
  const text = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const pos = getSetting(settings, 'currency_position', 'left');
  return pos === 'right' ? `${text} ${sym}` : `${sym} ${text}`;
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// PHP date_format / time_format tokens (subset): d, m, M, Y, H, i, s
export function formatDate(iso, settings) {
  if (!iso) return '—';
  const d = new Date(iso);
  const df = getSetting(settings, 'date_format', 'Y-m-d');
  const tf = getSetting(settings, 'time_format', 'H:i');
  const map = {
    d: String(d.getDate()).padStart(2, '0'),
    j: String(d.getDate()),
    m: String(d.getMonth() + 1).padStart(2, '0'),
    n: String(d.getMonth() + 1),
    M: MONTHS[d.getMonth()],
    F: d.toLocaleString('en-US', { month: 'long' }),
    Y: String(d.getFullYear()),
    y: String(d.getFullYear()).slice(-2),
    H: String(d.getHours()).padStart(2, '0'),
    i: String(d.getMinutes()).padStart(2, '0'),
    s: String(d.getSeconds()).padStart(2, '0'),
  };
  const render = (fmt) => fmt.replace(/[djmnMFYyHis]/g, (m) => map[m] ?? m);
  return `${render(df)} ${render(tf)}`;
}

export function formatDateOnly(iso, settings) {
  return formatDate(iso, settings).split(' ').slice(0, -1).join(' ') || formatDate(iso, settings);
}

export function maskPan(pan) {
  const digits = String(pan || '').replace(/\s/g, '');
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

export function groupAccountNumber(num) {
  const digits = String(num || '').replace(/[^\d]/g, '');
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function toIsoDate(d) {
  const dt = new Date(d);
  const p = (x) => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

export function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}
