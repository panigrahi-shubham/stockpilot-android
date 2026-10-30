import { COUPONS } from '@/data/seed';
import { PRODUCT_BY_SKU, Product, Variant, unitPriceFor } from '@/data/catalog';
import type { AppState, CartItem } from './AppContext';

export const MIN_ORDER_VALUE = 2000;
export const FREE_DELIVERY_ABOVE = 10000;
export const DELIVERY_FEE = 250;
export const APPROVAL_THRESHOLD = 50000;
export const COD_LIMIT = 50000;

export interface CartLine extends CartItem {
  product: Product;
  variant: Variant;
  unitPrice: number;
  lineTotal: number;
  mrpTotal: number;
}

export function isGlitch(state: AppState) {
  return state.user?.kind === 'glitch';
}

export function couponCheck(code: string, subtotal: number, state: AppState): { ok: true; pct: number; cap: number | null } | { ok: false; error: string } {
  const c = COUPONS[code.trim().toUpperCase()];
  if (!c) return { ok: false, error: 'This coupon code is not valid.' };
  if (code.trim().toUpperCase() === 'FIRSTORDER' && state.orders.some((o) => o.placedBy === state.user?.name))
    return { ok: false, error: 'FIRSTORDER is only valid on your first order.' };
  if (subtotal < c.min) return { ok: false, error: `Add items worth ₹${(c.min - subtotal).toFixed(0)} more to use this code.` };
  // PLANTED BUG (glitch user): B2B10 applies 1% instead of 10%.
  const pct = isGlitch(state) && code.toUpperCase() === 'B2B10' ? 1 : c.pct;
  return { ok: true, pct, cap: code.toUpperCase() === 'DIWALI25' ? null : 2500 };
}

export function cartSummary(state: AppState) {
  const lines: CartLine[] = state.cart
    .map((c) => {
      const product = PRODUCT_BY_SKU[c.sku];
      if (!product) return null;
      const variant = product.variants.find((v) => v.id === c.variantId) ?? product.variants[0];
      const unitPrice = unitPriceFor(product, variant.id, c.qty);
      return {
        ...c,
        product,
        variant,
        unitPrice,
        lineTotal: Math.round(unitPrice * c.qty * 100) / 100,
        mrpTotal: product.mrp * variant.multiplier * c.qty,
      };
    })
    .filter(Boolean) as CartLine[];

  const subtotal = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  const mrpTotal = round(lines.reduce((s, l) => s + l.mrpTotal, 0));
  let couponDiscount = 0;
  let couponError: string | null = null;
  if (state.coupon) {
    const chk = couponCheck(state.coupon, subtotal, state);
    if (chk.ok) {
      couponDiscount = subtotal * (chk.pct / 100);
      if (chk.cap) couponDiscount = Math.min(couponDiscount, chk.cap);
      couponDiscount = round(couponDiscount);
    } else couponError = chk.error;
  }
  const ratio = subtotal > 0 ? (subtotal - couponDiscount) / subtotal : 1;
  // PLANTED BUG (glitch user): GST always computed at 18% regardless of the product's slab.
  const gst = round(lines.reduce((s, l) => s + l.lineTotal * ratio * ((isGlitch(state) ? 18 : l.product.gst) / 100), 0));
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total = round(subtotal - couponDiscount + gst + delivery);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const availableCredit = state.user ? state.user.creditLimit - state.user.creditUsed : 0;

  return {
    lines,
    subtotal,
    mrpTotal,
    savings: round(mrpTotal - subtotal + couponDiscount),
    couponDiscount,
    couponError,
    gst,
    delivery,
    total,
    itemCount,
    lineCount: lines.length,
    minOrderOk: subtotal >= MIN_ORDER_VALUE,
    shortBy: Math.max(0, MIN_ORDER_VALUE - subtotal),
    availableCredit,
    needsApproval: total > APPROVAL_THRESHOLD && state.user?.role !== 'approver',
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function cartQtyFor(state: AppState, sku: string) {
  return state.cart.filter((c) => c.sku === sku).reduce((s, c) => s + c.qty, 0);
}
