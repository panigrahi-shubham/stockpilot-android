/**
 * Mock backend. Everything is local, but behaves like a real API:
 *  - configurable latency + random 5xx failures + offline mode (QA Lab)
 *  - per-user behaviour (slow / locked / glitch)
 *  - session expiry
 */
import { runtime } from '@/state/AppContext';
import { BRANDS, CategoryId, PRODUCTS, PRODUCT_BY_EAN, PRODUCT_BY_SKU, Product } from './catalog';
import { PINCODES, TEST_USERS, User } from './seed';
import { addDays, sleep } from '@/utils/format';

export class ApiError extends Error {
  constructor(public code: 'NETWORK' | 'SERVER' | 'SESSION_EXPIRED' | 'VALIDATION' | 'AUTH' | 'LOCKED' | 'NOT_FOUND', message: string) {
    super(message);
  }
}

async function simulate(opts: { auth?: boolean; light?: boolean } = {}) {
  const { qa, user, sessionExpired } = runtime.state;
  const jitter = Math.random() * 250;
  let wait = (opts.light ? qa.latencyMs * 0.4 : qa.latencyMs) + jitter;
  const kind = user?.kind ?? runtime.state.pendingUser?.kind;
  if (kind === 'slow') wait += 4000 + Math.random() * 3000;
  await sleep(wait);
  if (qa.offline || !runtime.netOnline) throw new ApiError('NETWORK', 'No internet connection. Check your network and try again.');
  if (opts.auth !== false && user && sessionExpired)
    throw new ApiError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  if (qa.failRate > 0 && Math.random() * 100 < qa.failRate)
    throw new ApiError('SERVER', 'Something went wrong on our side (HTTP 503). Please retry.');
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    await simulate({ auth: false });
    const u = TEST_USERS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (u?.kind === 'locked')
      throw new ApiError('LOCKED', 'Your account is locked after multiple failed attempts. Contact your relationship manager.');
    if (!u || u.password !== password) throw new ApiError('AUTH', 'Incorrect email or password. 2 attempts left.');
    const { password: _pw, note: _note, ...user } = u;
    return user;
  },

  async sendOtp(): Promise<string> {
    await simulate({ auth: false, light: true });
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async requestPasswordReset(email: string) {
    await simulate({ auth: false });
    if (!TEST_USERS.some((u) => u.email === email.trim().toLowerCase()))
      throw new ApiError('NOT_FOUND', 'We couldn’t find an account with that email.');
    return true;
  },

  async products(q: {
    page: number;
    pageSize?: number;
    search?: string;
    category?: CategoryId | 'all';
    sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'discount';
    maxPrice?: number;
    brands?: string[];
    inStockOnly?: boolean;
    favoritesOnly?: string[];
  }): Promise<{ items: Product[]; total: number; hasMore: boolean }> {
    await simulate();
    const pageSize = q.pageSize ?? 20;
    let list = PRODUCTS.slice();
    if (q.category && q.category !== 'all') list = list.filter((p) => p.category === q.category);
    if (q.search) {
      const s = q.search.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s) || p.sku.toLowerCase() === s || p.ean === s,
      );
    }
    if (q.maxPrice) list = list.filter((p) => p.price <= q.maxPrice!);
    if (q.brands?.length) list = list.filter((p) => q.brands!.includes(p.brand));
    if (q.inStockOnly) list = list.filter((p) => p.stock > 0);
    if (q.favoritesOnly) list = list.filter((p) => q.favoritesOnly!.includes(p.sku));
    const glitch = runtime.state.user?.kind === 'glitch';
    switch (q.sort) {
      case 'price_asc':
        // PLANTED BUG (glitch user): "Low to High" actually sorts High to Low.
        list.sort((a, b) => (glitch ? b.price - a.price : a.price - b.price));
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        list.sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp);
        break;
    }
    const start = (q.page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total: list.length, hasMore: start + pageSize < list.length };
  },

  async product(sku: string): Promise<Product> {
    await simulate({ light: true });
    const p = PRODUCT_BY_SKU[sku.toUpperCase()];
    if (!p) throw new ApiError('NOT_FOUND', `No product found for ${sku}.`);
    return p;
  },

  async lookupBarcode(ean: string): Promise<Product> {
    await simulate({ light: true });
    const p = PRODUCT_BY_EAN[ean];
    if (!p) throw new ApiError('NOT_FOUND', `Barcode ${ean} is not in the StockPilot catalogue.`);
    return p;
  },

  async checkPincode(pin: string) {
    await simulate({ light: true });
    const hit = PINCODES[pin.slice(0, 3)];
    if (!hit) return { serviceable: false as const, city: '', state: '' };
    return { ...hit, eta: addDays(new Date(), 2 + (Number(pin[5]) % 3)) };
  },

  async placeOrder(): Promise<{ id: string }> {
    await simulate();
    await sleep(1200); // payment gateway
    const d = new Date();
    const ymd = `${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    return { id: `SP-${ymd}-${Math.floor(5000 + Math.random() * 4999)}` };
  },

  async generic<T>(value: T, light = false): Promise<T> {
    await simulate({ light });
    return value;
  },

  brands: BRANDS,
};

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Unexpected error';
}
