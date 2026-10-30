import { PRODUCTS } from './catalog';
import { addDays } from '@/utils/format';

export type Role = 'buyer' | 'approver';
export type UserKind = 'standard' | 'locked' | 'slow' | 'glitch' | 'approver' | 'kycpending';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  kind: UserKind;
  business: string;
  gstin: string;
  pan: string;
  city: string;
  creditLimit: number;
  creditUsed: number;
  kyc: 'verified' | 'pending';
}

/** Test accounts — every password is Pilot@123. Documented in README + QA Lab. */
export const TEST_USERS: (User & { password: string; note: string })[] = [
  {
    id: 'U-1001',
    email: 'buyer@stockpilot.in',
    password: 'Pilot@123',
    note: 'Happy path. Buyer role, KYC verified, ₹5L credit line.',
    name: 'Ravi Teja Kumar',
    phone: '9848012345',
    role: 'buyer',
    kind: 'standard',
    business: 'Sri Lakshmi Kirana Stores',
    gstin: '36AAPFS1234K1ZX',
    pan: 'AAPFS1234K',
    city: 'Hyderabad',
    creditLimit: 500000,
    creditUsed: 182450,
    kyc: 'verified',
  },
  {
    id: 'U-1002',
    email: 'approver@stockpilot.in',
    password: 'Pilot@123',
    note: 'Manager role. Sees Approvals and can approve/reject orders above ₹50,000.',
    name: 'Ananya Reddy',
    phone: '9701198765',
    role: 'approver',
    kind: 'approver',
    business: 'Reddy Super Mart Pvt Ltd',
    gstin: '36AABCR9876M1ZI',
    pan: 'AABCR9876M',
    city: 'Secunderabad',
    creditLimit: 1500000,
    creditUsed: 412900,
    kyc: 'verified',
  },
  {
    id: 'U-1003',
    email: 'slow@stockpilot.in',
    password: 'Pilot@123',
    note: 'Every API call takes 4–7 s extra. Practise explicit waits.',
    name: 'Mohammed Irfan',
    phone: '9000011122',
    role: 'buyer',
    kind: 'slow',
    business: 'Irfan General Traders',
    gstin: '36AKZPI4567L1Z7',
    pan: 'AKZPI4567L',
    city: 'Warangal',
    creditLimit: 200000,
    creditUsed: 15400,
    kyc: 'verified',
  },
  {
    id: 'U-1004',
    email: 'glitch@stockpilot.in',
    password: 'Pilot@123',
    note: 'Has 4 planted functional bugs. Find them! (answer key in EXERCISES.md)',
    name: 'Priya Sharma',
    phone: '9123456780',
    role: 'buyer',
    kind: 'glitch',
    business: 'Sharma Wholesale Depot',
    gstin: '36ABEPS2468Q1ZV',
    pan: 'ABEPS2468Q',
    city: 'Karimnagar',
    creditLimit: 300000,
    creditUsed: 288000,
    kyc: 'verified',
  },
  {
    id: 'U-1005',
    email: 'newstore@stockpilot.in',
    password: 'Pilot@123',
    note: 'KYC pending — checkout is blocked until documents are uploaded.',
    name: 'Kiran Naidu',
    phone: '9988776655',
    role: 'buyer',
    kind: 'kycpending',
    business: 'Naidu Fresh Mart',
    gstin: '',
    pan: '',
    city: 'Vijayawada',
    creditLimit: 0,
    creditUsed: 0,
    kyc: 'pending',
  },
  {
    id: 'U-1006',
    email: 'locked@stockpilot.in',
    password: 'Pilot@123',
    note: 'Always fails login with "account locked".',
    name: 'Locked User',
    phone: '9000000000',
    role: 'buyer',
    kind: 'locked',
    business: '—',
    gstin: '',
    pan: '',
    city: '—',
    creditLimit: 0,
    creditUsed: 0,
    kyc: 'pending',
  },
];

export type OrderStatus =
  | 'pending_approval'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export const STATUS_META: Record<OrderStatus, { label: string; tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral' }> = {
  pending_approval: { label: 'Pending approval', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  packed: { label: 'Packed', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'info' },
  out_for_delivery: { label: 'Out for delivery', tone: 'warning' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

export const STATUS_FLOW: OrderStatus[] = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export interface OrderLine {
  sku: string;
  name: string;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  gst: number;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  gst: number;
  delivery: number;
  total: number;
  paymentMethod: 'credit' | 'upi' | 'neft' | 'cod';
  deliveryDate: string;
  slot: string;
  address: Address;
  poNumber?: string;
  trackingId?: string;
  history: { status: OrderStatus; at: string; note?: string }[];
  placedBy: string;
  cancelReason?: string;
  rating?: number;
}

export const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'A-1',
    label: 'Main store',
    name: 'Ravi Teja Kumar',
    phone: '9848012345',
    line1: 'Shop 14, Sai Plaza, Ameerpet X Roads',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500016',
    isDefault: true,
  },
  {
    id: 'A-2',
    label: 'Godown',
    name: 'Suresh (Store manager)',
    phone: '9848098480',
    line1: 'Plot 7, Industrial Area Phase 2, Balanagar',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500037',
  },
];

function line(i: number, qty: number): OrderLine {
  const p = PRODUCTS[i % PRODUCTS.length];
  return { sku: p.sku, name: p.name, variantLabel: p.variants[0].label, qty, unitPrice: p.price, gst: p.gst };
}

function makeOrder(
  seq: number,
  daysAgo: number,
  status: OrderStatus,
  lines: OrderLine[],
  method: Order['paymentMethod'],
  placedBy = 'Ravi Teja Kumar',
): Order {
  const created = addDays(new Date(), -daysAgo);
  created.setHours(9 + (seq % 9), (seq * 7) % 60, 0, 0);
  if (created.getTime() > Date.now()) created.setTime(Date.now() - 90 * 60000);
  const subtotal = Math.round(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100;
  const gst = Math.round(lines.reduce((s, l) => s + (l.unitPrice * l.qty * l.gst) / 100, 0) * 100) / 100;
  const delivery = subtotal > 10000 ? 0 : 250;
  const flowIdx = STATUS_FLOW.indexOf(status);
  const history: Order['history'] = [];
  if (status === 'pending_approval' || status === 'rejected') {
    history.push({ status: 'pending_approval', at: created.toISOString(), note: 'Awaiting manager approval' });
    if (status === 'rejected')
      history.push({ status: 'rejected', at: addDays(created, 1).toISOString(), note: 'Budget exceeded for this month' });
  } else if (status === 'cancelled') {
    history.push({ status: 'confirmed', at: created.toISOString() });
    history.push({ status: 'cancelled', at: new Date(created.getTime() + 5 * 3600000).toISOString(), note: 'Ordered by mistake' });
  } else {
    STATUS_FLOW.slice(0, flowIdx + 1).forEach((s, i) => history.push({ status: s, at: new Date(created.getTime() + i * 14 * 3600000).toISOString() }));
  }
  const ymd = `${created.getFullYear().toString().slice(2)}${(created.getMonth() + 1).toString().padStart(2, '0')}${created
    .getDate()
    .toString()
    .padStart(2, '0')}`;
  return {
    id: `SP-${ymd}-${(4000 + seq * 37).toString()}`,
    createdAt: created.toISOString(),
    status,
    lines,
    subtotal,
    discount: 0,
    gst,
    delivery,
    total: Math.round((subtotal + gst + delivery) * 100) / 100,
    paymentMethod: method,
    deliveryDate: addDays(created, 3).toISOString(),
    slot: 'Morning (8 AM – 12 PM)',
    address: DEFAULT_ADDRESSES[seq % 2],
    trackingId: flowIdx >= 2 ? `BLUDART${7731000 + seq * 13}` : undefined,
    history,
    placedBy,
    cancelReason: status === 'cancelled' ? 'Ordered by mistake' : undefined,
  };
}

export function seedOrders(): Order[] {
  return [
    makeOrder(1, 0, 'confirmed', [line(3, 4), line(17, 10), line(40, 2)], 'credit'),
    makeOrder(2, 1, 'packed', [line(8, 6), line(52, 3)], 'upi'),
    makeOrder(3, 2, 'shipped', [line(21, 12), line(66, 5), line(90, 2), line(101, 8)], 'credit'),
    makeOrder(4, 3, 'out_for_delivery', [line(30, 3)], 'neft'),
    makeOrder(5, 2, 'pending_approval', [line(5, 40), line(11, 25), line(70, 30)], 'credit', 'Suresh (Store manager)'),
    makeOrder(6, 6, 'delivered', [line(14, 5), line(33, 5)], 'credit'),
    makeOrder(7, 9, 'delivered', [line(44, 20)], 'upi'),
    makeOrder(8, 12, 'delivered', [line(2, 2), line(58, 4), line(77, 6)], 'cod'),
    makeOrder(9, 15, 'cancelled', [line(25, 3)], 'upi'),
    makeOrder(10, 21, 'delivered', [line(61, 10), line(82, 10)], 'credit'),
    makeOrder(11, 27, 'rejected', [line(9, 60), line(19, 40)], 'credit', 'Suresh (Store manager)'),
    makeOrder(12, 33, 'delivered', [line(36, 8)], 'neft'),
    makeOrder(13, 41, 'delivered', [line(12, 3), line(48, 7), line(99, 2)], 'credit'),
  ];
}

export type NotificationKind = 'order' | 'offer' | 'account' | 'payment';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  link?: string;
}

export function seedNotifications(orders: Order[]): AppNotification[] {
  const now = Date.now();
  const ago = (min: number) => new Date(now - min * 60000).toISOString();
  return [
    { id: 'N-1', kind: 'order', title: 'Out for delivery', body: `Order ${orders[3].id} will reach you today between 2–6 PM.`, at: ago(18), read: false, link: `/order/${orders[3].id}` },
    { id: 'N-2', kind: 'offer', title: 'Festive Bonanza is live 🎉', body: 'Extra 5% off on orders above ₹25,000. Use code DIWALI25.', at: ago(95), read: false, link: '/promo/DIWALI25' },
    { id: 'N-3', kind: 'payment', title: 'Payment due in 3 days', body: 'Credit line dues of ₹48,210 are due on 21 Oct. Pay early to keep your limit.', at: ago(300), read: false },
    { id: 'N-4', kind: 'order', title: 'Order shipped', body: `${orders[2].id} has been handed over to BlueDart.`, at: ago(1500), read: true, link: `/order/${orders[2].id}` },
    { id: 'N-5', kind: 'account', title: 'New login detected', body: 'A new login from Android 15 (Hyderabad) was detected. Not you? Change password.', at: ago(2900), read: true },
    { id: 'N-6', kind: 'offer', title: 'Price drop on Staples', body: 'Sona Masoori rice now from ₹1,190 per bag. Limited stock.', at: ago(4400), read: true, link: '/catalog' },
    { id: 'N-7', kind: 'order', title: 'Order delivered', body: `${orders[5].id} was delivered. Rate your delivery experience.`, at: ago(8700), read: true, link: `/order/${orders[5].id}` },
    { id: 'N-8', kind: 'account', title: 'KYC verified', body: 'Your GST certificate has been verified. Credit line activated.', at: ago(20000), read: true },
  ];
}

export const BANNERS = [
  { id: 'b1', title: 'Festive Bonanza', subtitle: 'Extra 5% off above ₹25,000', code: 'DIWALI25', colors: ['#0E5E4F', '#1E8C74'] as [string, string], icon: 'gift-outline' },
  { id: 'b2', title: 'Pay later at 0%', subtitle: 'Net-30 credit on every order', code: '', colors: ['#2E3A87', '#4F5FD0'] as [string, string], icon: 'wallet-outline' },
  { id: 'b3', title: 'New: Baby Care', subtitle: 'Top brands at distributor price', code: 'B2B10', colors: ['#B5446E', '#E07AA0'] as [string, string], icon: 'sparkles-outline' },
];

export const COUPONS: Record<string, { pct: number; min: number; label: string }> = {
  B2B10: { pct: 10, min: 5000, label: '10% off on orders above ₹5,000 (max ₹2,500)' },
  DIWALI25: { pct: 5, min: 25000, label: 'Extra 5% off on orders above ₹25,000' },
  FIRSTORDER: { pct: 15, min: 2000, label: '15% off your first order (max ₹2,500)' },
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

/** Pincode prefix → city/state (enough to make the auto-fill feel real). */
export const PINCODES: Record<string, { city: string; state: string; serviceable: boolean }> = {
  '500': { city: 'Hyderabad', state: 'Telangana', serviceable: true },
  '506': { city: 'Warangal', state: 'Telangana', serviceable: true },
  '505': { city: 'Karimnagar', state: 'Telangana', serviceable: true },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh', serviceable: true },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh', serviceable: true },
  '560': { city: 'Bengaluru', state: 'Karnataka', serviceable: true },
  '600': { city: 'Chennai', state: 'Tamil Nadu', serviceable: true },
  '400': { city: 'Mumbai', state: 'Maharashtra', serviceable: true },
  '411': { city: 'Pune', state: 'Maharashtra', serviceable: true },
  '110': { city: 'New Delhi', state: 'Delhi', serviceable: false },
  '831': { city: 'Jamshedpur', state: 'Jharkhand', serviceable: false },
  '834': { city: 'Ranchi', state: 'Jharkhand', serviceable: false },
};

export const FAQS = [
  { q: 'What is the minimum order value?', a: 'The minimum order value is ₹2,000 before GST. Orders above ₹10,000 get free delivery.' },
  { q: 'How does the StockPilot credit line work?', a: 'Verified businesses get a Net-30 credit line. Orders placed on credit are due 30 days after delivery. Paying early restores your available limit immediately.' },
  { q: 'Why does my order need approval?', a: 'If your account has a manager, orders above ₹50,000 are routed to them for approval before they are confirmed.' },
  { q: 'Can I claim GST input credit?', a: 'Yes. Every invoice carries your GSTIN and HSN-wise tax break-up. Invoices can be downloaded from the order details screen.' },
  { q: 'How do I return a damaged item?', a: 'Raise a dispute from the order details screen within 48 hours of delivery and attach a photo of the damaged carton.' },
  { q: 'Which documents are needed for KYC?', a: 'GST certificate, PAN card of the business, a trade licence and a cancelled cheque. PDF or JPG up to 5 MB each.' },
  { q: 'Can I change the delivery slot after ordering?', a: 'Slots can be changed until the order is packed. Contact support from the chat screen.' },
  { q: 'Do you deliver outside Telangana and Andhra Pradesh?', a: 'We currently deliver to major cities in South India and Maharashtra. Check your pincode on any product page.' },
];
