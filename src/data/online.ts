/**
 * REAL internet calls (no API keys needed). These need the device/emulator to be online.
 *  - Frankfurter (ECB reference rates)  https://api.frankfurter.dev
 *  - India Post pincode directory        https://api.postalpincode.in
 * Every call has a timeout and respects QA Lab → "Simulate offline".
 */
import { runtime } from '@/state/AppContext';
import { ApiError } from './api';

async function getJson<T>(url: string, timeoutMs = 9000): Promise<T> {
  if (runtime.state.qa.offline || !runtime.netOnline) throw new ApiError('NETWORK', 'No internet connection. Connect to Wi-Fi or mobile data and retry.');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new ApiError('SERVER', `Server responded ${res.status}. Please retry.`);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error)?.name === 'AbortError') throw new ApiError('NETWORK', `Request timed out after ${timeoutMs / 1000}s. Check your connection.`);
    throw new ApiError('NETWORK', 'Could not reach the server. Check your internet connection.');
  } finally {
    clearTimeout(t);
  }
}

export const FX_CODES = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CNY', 'SAR'] as const;
export type FxCode = (typeof FX_CODES)[number];
export interface FxRate {
  code: FxCode;
  rate: number; // 1 INR = rate CODE
  perUnit: number; // 1 CODE = perUnit INR
}

type V2Row = { date: string; base: string; quote: string; rate: number };

/** Latest INR rates. Handles Frankfurter v2 (array) and falls back to v1 (object). */
export async function fetchFxRates(): Promise<{ date: string; rates: FxRate[] }> {
  try {
    const rows = await getJson<V2Row[]>(`https://api.frankfurter.dev/v2/rates?base=INR&quotes=${FX_CODES.join(',')}`);
    if (!Array.isArray(rows) || !rows.length) throw new Error('empty');
    return {
      date: rows[0].date,
      rates: FX_CODES.map((code) => {
        const r = rows.find((x) => x.quote === code)?.rate ?? 0;
        return { code, rate: r, perUnit: r ? 1 / r : 0 };
      }).filter((x) => x.rate > 0),
    };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'NETWORK') throw e;
    const v1 = await getJson<{ date: string; rates: Record<string, number> }>(`https://api.frankfurter.app/latest?from=INR&to=${FX_CODES.join(',')}`);
    return {
      date: v1.date,
      rates: FX_CODES.filter((c) => v1.rates[c]).map((code) => ({ code, rate: v1.rates[code], perUnit: 1 / v1.rates[code] })),
    };
  }
}

/** Daily 1-CODE-in-INR values for the last `days` days (for the trend chart). */
export async function fetchFxSeries(code: FxCode, days = 30): Promise<{ date: string; inr: number }[]> {
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  try {
    const rows = await getJson<V2Row[]>(`https://api.frankfurter.dev/v2/rates?base=INR&quotes=${code}&from=${from}`);
    return rows.map((r) => ({ date: r.date, inr: 1 / r.rate }));
  } catch (e) {
    if (e instanceof ApiError && e.code === 'NETWORK') throw e;
    const v1 = await getJson<{ rates: Record<string, Record<string, number>> }>(`https://api.frankfurter.app/${from}..?from=INR&to=${code}`);
    return Object.entries(v1.rates).map(([date, r]) => ({ date, inr: 1 / r[code] }));
  }
}

export interface PostOffice {
  Name: string;
  BranchType: string;
  DeliveryStatus: string;
  District: string;
  Division: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

/** Live India Post lookup: 500016 → Begumpet, Hyderabad, Telangana (+ all post offices). */
export async function lookupPincodeOnline(pin: string): Promise<PostOffice[]> {
  const data = await getJson<{ Status: string; Message: string; PostOffice: PostOffice[] | null }[]>(`https://api.postalpincode.in/pincode/${pin}`);
  const first = data?.[0];
  if (!first || first.Status !== 'Success' || !first.PostOffice?.length) throw new ApiError('NOT_FOUND', `India Post has no record of pincode ${pin}.`);
  return first.PostOffice;
}

/** Official GSTIN checksum (mod-36). Runs offline; the portal check runs in the Web portal screen. */
export function gstinChecksumValid(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = chars.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(v / 36) + (v % 36);
  }
  return chars[(36 - (sum % 36)) % 36] === g[14];
}
