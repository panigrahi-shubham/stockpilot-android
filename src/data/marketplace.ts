/** Seller-side marketplace data: listings, buyer leads, conversations and product reviews. */
import { mulberry32 } from '@/utils/format';
import type { Product } from './catalog';

export type ListingStatus = 'active' | 'inactive' | 'draft';

export interface SellerProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  mrp: number;
  moq: number;
  unit: string;
  description: string;
  specs: [string, string][];
  photos: string[]; // local file URIs (camera / gallery)
  cover: number;
  status: ListingStatus;
  views: number;
  enquiries: number;
  updatedAt: string;
}

export const SELLER_CATEGORIES = ['Staples', 'Beverages', 'Snacks', 'Dairy', 'Packaged Food', 'Personal Care', 'Home Care', 'Baby Care', 'Packaging Material'];
export const UNITS = ['Bag', 'Box', 'Carton', 'Case', 'Kg', 'Litre', 'Piece', 'Tin'];

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'closed';
export const LEAD_STATUS_META: Record<LeadStatus, { label: string; tone: 'info' | 'warning' | 'success' | 'neutral' }> = {
  new: { label: 'New', tone: 'info' },
  contacted: { label: 'Contacted', tone: 'warning' },
  quoted: { label: 'Quoted', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export interface Lead {
  id: string;
  buyerName: string;
  company: string;
  phone: string;
  city: string;
  productTitle: string;
  quantity: number;
  unit: string;
  requirement: string;
  status: LeadStatus;
  createdAt: string;
  quotePrice?: number;
  whatsapp: boolean;
  conversationId?: string;
  source: 'marketplace' | 'enquiry-form';
}

export interface ChatMsg {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
  attachment?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  name: string;
  company: string;
  role: 'Relationship manager' | 'Buyer' | 'Supplier' | 'Logistics';
  color: string;
  starred: boolean;
  archived: boolean;
  unread: number;
  messages: ChatMsg[];
  quickReplies: string[];
}

export interface Review {
  id: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  at: string;
  verified: boolean;
  helpful: number;
}

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export function seedSellerProducts(): SellerProduct[] {
  return [
    {
      id: 'L-2001',
      title: 'Premium Jaggery Blocks (Organic)',
      category: 'Staples',
      price: 1840,
      mrp: 2100,
      moq: 10,
      unit: 'Box',
      description: 'Chemical-free jaggery from Kolhapur farms. 1 kg blocks, 20 per box. FSSAI certified.',
      specs: [['Origin', 'Kolhapur, MH'], ['Shelf life', '9 months'], ['Pack', '20 × 1 kg']],
      photos: [],
      cover: 0,
      status: 'active',
      views: 1284,
      enquiries: 23,
      updatedAt: ago(60 * 26),
    },
    {
      id: 'L-2002',
      title: 'Cold Pressed Coconut Oil 15 L Tin',
      category: 'Staples',
      price: 3150,
      mrp: 3600,
      moq: 5,
      unit: 'Tin',
      description: 'Wood-pressed (marachekku) coconut oil, single filtered.',
      specs: [['Process', 'Wood pressed'], ['Pack', '15 L tin']],
      photos: [],
      cover: 0,
      status: 'active',
      views: 842,
      enquiries: 11,
      updatedAt: ago(60 * 72),
    },
    {
      id: 'L-2003',
      title: 'Corrugated Shipping Boxes 5-ply',
      category: 'Packaging Material',
      price: 28,
      mrp: 35,
      moq: 500,
      unit: 'Piece',
      description: '18×12×12 inch, 5-ply brown boxes for kirana home delivery.',
      specs: [['Size', '18 × 12 × 12 in'], ['Ply', '5'], ['Bursting factor', '18 BF']],
      photos: [],
      cover: 0,
      status: 'inactive',
      views: 310,
      enquiries: 4,
      updatedAt: ago(60 * 24 * 9),
    },
    {
      id: 'L-2004',
      title: 'Masala Peanuts 200 g (draft)',
      category: 'Snacks',
      price: 0,
      mrp: 0,
      moq: 0,
      unit: 'Carton',
      description: '',
      specs: [],
      photos: [],
      cover: 0,
      status: 'draft',
      views: 0,
      enquiries: 0,
      updatedAt: ago(60 * 5),
    },
  ];
}

export function seedLeads(): Lead[] {
  return [
    { id: 'LD-9031', buyerName: 'Venkatesh Rao', company: 'Rao Super Bazaar', phone: '9440012345', city: 'Guntur', productTitle: 'Premium Jaggery Blocks (Organic)', quantity: 40, unit: 'Box', requirement: 'Need weekly supply for 3 stores. Please share best price for 40 boxes/week and credit terms.', status: 'new', createdAt: ago(35), whatsapp: true, conversationId: 'C-buyer-1', source: 'marketplace' },
    { id: 'LD-9030', buyerName: 'Fatima Begum', company: 'Hyderabad Bakers Supply', phone: '9849098490', city: 'Hyderabad', productTitle: 'Cold Pressed Coconut Oil 15 L Tin', quantity: 12, unit: 'Tin', requirement: 'For bakery use. Is FSSAI lab report available?', status: 'new', createdAt: ago(190), whatsapp: false, source: 'marketplace' },
    { id: 'LD-9027', buyerName: 'Arjun Mehta', company: 'FreshKart Dark Stores', phone: '9000098765', city: 'Bengaluru', productTitle: 'Corrugated Shipping Boxes 5-ply', quantity: 5000, unit: 'Piece', requirement: 'Custom print with our logo — 2 colour. Delivery to Whitefield.', status: 'contacted', createdAt: ago(60 * 20), whatsapp: true, source: 'marketplace' },
    { id: 'LD-9021', buyerName: 'Lakshmi Prasanna', company: 'Sri Sai Kirana', phone: '9963312345', city: 'Vijayawada', productTitle: 'Premium Jaggery Blocks (Organic)', quantity: 10, unit: 'Box', requirement: 'Trial order first.', status: 'quoted', quotePrice: 1790, createdAt: ago(60 * 50), whatsapp: false, source: 'marketplace' },
    { id: 'LD-9012', buyerName: 'Mohit Jain', company: 'Jain Traders', phone: '9811112233', city: 'Indore', productTitle: 'Cold Pressed Coconut Oil 15 L Tin', quantity: 30, unit: 'Tin', requirement: 'Price too high vs local supplier.', status: 'closed', createdAt: ago(60 * 24 * 6), whatsapp: false, source: 'marketplace' },
  ];
}

export function seedConversations(): Conversation[] {
  return [
    {
      id: 'C-rm',
      name: 'Priya Nair',
      company: 'StockPilot',
      role: 'Relationship manager',
      color: '#0E5E4F',
      starred: true,
      archived: false,
      unread: 1,
      messages: [{ id: 'm0', from: 'them', text: 'Hi! I’m Priya, your relationship manager. How can I help your business today?', at: ago(60) }],
      quickReplies: ['Where is my order?', 'Increase my credit limit', 'Change delivery slot', 'Talk to a human'],
    },
    {
      id: 'C-buyer-1',
      name: 'Venkatesh Rao',
      company: 'Rao Super Bazaar',
      role: 'Buyer',
      color: '#2E6BD8',
      starred: false,
      archived: false,
      unread: 2,
      messages: [
        { id: 'b1', from: 'them', text: 'Hello, saw your jaggery listing on StockPilot.', at: ago(40) },
        { id: 'b2', from: 'them', text: 'Can you do ₹1,750 per box for 40 boxes weekly?', at: ago(36) },
      ],
      quickReplies: ['Please share your GSTIN', 'What is your delivery address?', 'Best I can do is ₹1,800', 'Sending price list'],
    },
    {
      id: 'C-supplier-1',
      name: 'Anil Kumar',
      company: 'Deccan Harvest Mills',
      role: 'Supplier',
      color: '#B5446E',
      starred: false,
      archived: false,
      unread: 0,
      messages: [
        { id: 's1', from: 'me', text: 'Do you have Sona Masoori 25 kg in stock?', at: ago(60 * 5), status: 'read' },
        { id: 's2', from: 'them', text: 'Yes, 300 bags ready. Dispatch tomorrow.', at: ago(60 * 4) },
      ],
      quickReplies: ['Please share price list', 'What is the MOQ?', 'Send catalogue'],
    },
    {
      id: 'C-logistics',
      name: 'BlueDart Desk',
      company: 'BlueDart Express',
      role: 'Logistics',
      color: '#8C4A12',
      starred: false,
      archived: false,
      unread: 1,
      messages: [{ id: 'l1', from: 'them', text: 'Your shipment AWB BLUDART7731039 is out for delivery.', at: ago(60 * 9) }],
      quickReplies: ['Expected time?', 'Please call before arriving'],
    },
    {
      id: 'C-buyer-2',
      name: 'Arjun Mehta',
      company: 'FreshKart Dark Stores',
      role: 'Buyer',
      color: '#5B6B66',
      starred: false,
      archived: true,
      unread: 0,
      messages: [{ id: 'a1', from: 'them', text: 'Thanks, will confirm the box order next week.', at: ago(60 * 24 * 3) }],
      quickReplies: ['Sure, thanks!'],
    },
  ];
}

const NAMES = ['Ramesh G.', 'Sunita K.', 'Imran S.', 'Deepa R.', 'Kishore V.', 'Anitha M.', 'Gurpreet S.', 'Harsha N.'];
const CITIES = ['Hyderabad', 'Warangal', 'Guntur', 'Nellore', 'Kurnool', 'Nizamabad', 'Bengaluru', 'Chennai'];
const GOOD = [
  ['Fast moving in my store', 'Customers ask for it by name. Cartons arrived sealed and well within expiry.'],
  ['Good margin', 'Wholesale price is better than my local distributor and delivery was on time.'],
  ['Consistent quality', 'Third order now, same batch quality every time. Recommended for kirana stores.'],
];
const MID = [['Okay product', 'Quality is fine but one carton was slightly damaged. Replacement was quick.']];
const BAD = [['Late delivery', 'Product is good but delivery came two days late during festival week.']];

/** Deterministic rating distribution + reviews for a catalogue product. */
export function reviewsFor(p: Product) {
  const rand = mulberry32(Number(p.sku.replace(/\D/g, '')));
  const total = p.ratingCount;
  const r = p.rating;
  const w5 = Math.max(0.1, (r - 3) / 2) * 0.75 + 0.05;
  const w4 = 0.22;
  const w1 = Math.max(0.02, (4.5 - r) * 0.08);
  const w2 = w1 * 0.8;
  const w3 = Math.max(0.03, 1 - w5 - w4 - w2 - w1);
  const sum = w5 + w4 + w3 + w2 + w1;
  const dist = [w5, w4, w3, w2, w1].map((w) => Math.round((w / sum) * total));
  const reviews: Review[] = Array.from({ length: 5 }, (_, i) => {
    const rating = i < 3 ? 5 - Math.floor(rand() * 2) : i === 3 ? 3 : 2;
    const pool = rating >= 4 ? GOOD : rating === 3 ? MID : BAD;
    const [title, body] = pool[Math.floor(rand() * pool.length)];
    return {
      id: `${p.sku}-R${i}`,
      author: NAMES[Math.floor(rand() * NAMES.length)],
      city: CITIES[Math.floor(rand() * CITIES.length)],
      rating,
      title,
      body,
      at: ago(60 * 24 * (3 + Math.floor(rand() * 90))),
      verified: rand() > 0.25,
      helpful: Math.floor(rand() * 40),
    };
  });
  return { dist, reviews };
}
