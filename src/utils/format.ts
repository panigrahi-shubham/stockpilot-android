/** Indian number grouping: 1234567.5 -> ₹12,34,567.50 */
export function inr(value: number, opts: { decimals?: boolean } = {}): string {
  const neg = value < 0;
  const abs = Math.abs(value);
  const fixed = opts.decimals === false ? Math.round(abs).toString() : abs.toFixed(2);
  const [intPart, dec] = fixed.split('.');
  let grouped = intPart;
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = `${rest},${last3}`;
  }
  const out = dec && dec !== '00' ? `${grouped}.${dec}` : grouped;
  return `${neg ? '-' : ''}₹${out}`;
}

export function compactInr(value: number): string {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return inr(value, { decimals: false });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function fmtDate(d: Date | string | number): string {
  const x = new Date(d);
  return `${x.getDate().toString().padStart(2, '0')} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}

export function fmtDay(d: Date | string | number): string {
  const x = new Date(d);
  return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]}`;
}

export function fmtTime(d: Date | string | number): string {
  const x = new Date(d);
  let h = x.getHours();
  const m = x.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export function fmtDateTime(d: Date | string | number): string {
  return `${fmtDate(d)}, ${fmtTime(d)}`;
}

export function timeAgo(d: Date | string | number): string {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return fmtDate(d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Deterministic PRNG so the catalogue is identical on every install (tests can rely on it). */
export function mulberry32(seed: number) {
  return function rand() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  phone: (v: string) => /^[6-9]\d{9}$/.test(v.trim()),
  pincode: (v: string) => /^[1-9]\d{5}$/.test(v.trim()),
  gstin: (v: string) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.trim().toUpperCase()),
  pan: (v: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(v.trim().toUpperCase()),
  upi: (v: string) => /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v.trim()),
  ean13: (v: string) => {
    if (!/^\d{13}$/.test(v)) return false;
    const digits = v.split('').map(Number);
    const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10 === digits[12];
  },
};

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
