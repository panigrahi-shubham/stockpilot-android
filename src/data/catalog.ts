import { mulberry32 } from '@/utils/format';

export type CategoryId =
  | 'staples'
  | 'beverages'
  | 'snacks'
  | 'dairy'
  | 'packaged'
  | 'personal'
  | 'home'
  | 'baby';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // MaterialCommunityIcons
  colors: [string, string];
}

export const CATEGORIES: Category[] = [
  { id: 'staples', name: 'Staples', icon: 'sack', colors: ['#F6E7C8', '#E9C98B'] },
  { id: 'beverages', name: 'Beverages', icon: 'bottle-soda-classic', colors: ['#D9EEF7', '#9ECFE6'] },
  { id: 'snacks', name: 'Snacks', icon: 'cookie', colors: ['#FBE1D3', '#F2B18E'] },
  { id: 'dairy', name: 'Dairy', icon: 'cup', colors: ['#EEF3FB', '#C9D8F0'] },
  { id: 'packaged', name: 'Packaged Food', icon: 'noodles', colors: ['#FCEBC4', '#F3C766'] },
  { id: 'personal', name: 'Personal Care', icon: 'lotion-outline', colors: ['#F3E3F4', '#DDB6E0'] },
  { id: 'home', name: 'Home Care', icon: 'spray-bottle', colors: ['#DDF3EA', '#A6DDC6'] },
  { id: 'baby', name: 'Baby Care', icon: 'baby-bottle-outline', colors: ['#FDE6EC', '#F6B6C8'] },
];

export interface Variant {
  id: string;
  label: string;
  multiplier: number;
  extraDiscountPct: number;
}

export interface PriceTier {
  min: number;
  max: number | null;
  price: number;
}

export interface Product {
  sku: string;
  ean: string;
  name: string;
  brand: string;
  category: CategoryId;
  icon: string;
  colors: [string, string];
  unit: string;
  mrp: number;
  price: number;
  gst: 5 | 12 | 18;
  moq: number;
  stock: number;
  rating: number;
  ratingCount: number;
  tiers: PriceTier[];
  variants: Variant[];
  tags: ('bestseller' | 'new' | 'deal')[];
  leadTimeDays: number;
  description: string;
  highlights: string[];
  specs: [string, string][];
}

type Template = [name: string, unit: string, basePrice: number, icon: string, gst: 5 | 12 | 18];

const TEMPLATES: Record<CategoryId, { brands: string[]; items: Template[] }> = {
  staples: {
    brands: ['Annapurna Gold', 'Krishi Fresh', 'Deccan Harvest', 'Sona Fields'],
    items: [
      ['Sona Masoori Rice', '25 kg bag', 1340, 'sack', 5],
      ['Basmati Rice Premium', '10 kg bag', 1180, 'sack', 5],
      ['Chakki Fresh Atta', '10 kg bag', 455, 'grain', 5],
      ['Toor Dal Unpolished', '5 kg pack', 715, 'barley', 5],
      ['Refined Sugar', '50 kg bag', 2140, 'sack', 5],
      ['Iodised Salt', '1 kg x 25', 410, 'shaker-outline', 5],
      ['Cold Pressed Groundnut Oil', '15 L tin', 2690, 'bottle-tonic-outline', 5],
    ],
  },
  beverages: {
    brands: ['Bluewave', 'Assam Valley', 'Nilgiri Brew', 'Frutella'],
    items: [
      ['Premium CTC Tea', '1 kg pack', 412, 'tea', 5],
      ['Filter Coffee Blend', '500 g pack', 289, 'coffee', 5],
      ['Mango Fruit Drink', '200 ml x 30', 540, 'bottle-soda-classic', 12],
      ['Packaged Drinking Water', '1 L x 12', 168, 'water', 18],
      ['Lemon Soda', '250 ml x 24', 456, 'bottle-soda-classic', 18],
      ['Instant Coffee Jar', '200 g jar', 498, 'glass-mug-variant', 18],
    ],
  },
  snacks: {
    brands: ['Crunchmate', 'Haldi Ram & Sons', 'Nimbu', 'Golden Bite'],
    items: [
      ['Salted Potato Chips', '52 g x 20', 360, 'popcorn', 12],
      ['Bhujia Sev', '1 kg pack', 248, 'bowl-mix', 12],
      ['Cream Biscuits', '120 g x 24', 576, 'cookie', 18],
      ['Glucose Biscuits', '800 g x 6', 444, 'cookie', 18],
      ['Roasted Peanuts', '200 g x 20', 620, 'food-croissant', 12],
      ['Chocolate Cookies', '150 g x 12', 588, 'muffin', 18],
    ],
  },
  dairy: {
    brands: ['DailyDew', 'Gokul Farms', 'Amrit Dairy'],
    items: [
      ['Pure Cow Ghee', '1 L tin', 615, 'cup', 12],
      ['Skimmed Milk Powder', '1 kg pack', 342, 'cup', 5],
      ['Processed Cheese Slices', '200 g x 10', 1120, 'cheese', 12],
      ['Table Butter', '500 g x 6', 1580, 'cheese', 12],
      ['Paneer Block', '1 kg', 368, 'cow', 5],
    ],
  },
  packaged: {
    brands: ['Malabar Spice Co', 'QuickChef', 'Ruchi Foods'],
    items: [
      ['Masala Instant Noodles', '70 g x 48', 576, 'noodles', 12],
      ['Garam Masala Powder', '100 g x 20', 840, 'pot-steam', 5],
      ['Turmeric Powder', '500 g x 10', 690, 'pot-steam', 5],
      ['Tomato Ketchup', '1 kg x 6', 594, 'food-variant', 12],
      ['Durum Wheat Pasta', '500 g x 12', 708, 'pasta', 12],
      ['Mixed Fruit Jam', '500 g x 12', 1044, 'food-variant', 12],
    ],
  },
  personal: {
    brands: ['Soft Petal', 'Herbalé', 'Kesar Glow'],
    items: [
      ['Neem Bathing Bar', '100 g x 48', 1296, 'face-woman-shimmer', 18],
      ['Herbal Shampoo', '180 ml x 12', 1188, 'bottle-tonic-outline', 18],
      ['Coconut Hair Oil', '500 ml x 12', 1560, 'bottle-tonic-outline', 18],
      ['Fluoride Toothpaste', '150 g x 24', 1632, 'toothbrush', 18],
      ['Hand Wash Refill', '750 ml x 12', 1140, 'hand-wash', 18],
    ],
  },
  home: {
    brands: ['Swachh', 'Sparkle', 'Brightly'],
    items: [
      ['Detergent Powder', '4 kg x 4', 1468, 'washing-machine', 18],
      ['Dishwash Liquid', '750 ml x 12', 1236, 'spray-bottle', 18],
      ['Floor Cleaner Lemon', '1 L x 12', 1452, 'spray-bottle', 18],
      ['Toilet Cleaner', '500 ml x 24', 1848, 'spray-bottle', 18],
      ['Garbage Bags Large', '30 pcs x 20', 980, 'broom', 18],
    ],
  },
  baby: {
    brands: ['Tiny Toes', 'Mamma Care'],
    items: [
      ['Baby Diapers Medium', '60 pcs x 4', 2796, 'baby-face-outline', 12],
      ['Baby Wipes Aloe', '72 pcs x 12', 1428, 'baby-face-outline', 12],
      ['Baby Massage Oil', '200 ml x 12', 1716, 'baby-bottle-outline', 18],
      ['Infant Cereal Rice', '300 g x 12', 2280, 'baby-bottle-outline', 5],
    ],
  },
};

function ean13(body12: string) {
  const sum = body12
    .split('')
    .map(Number)
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return body12 + ((10 - (sum % 10)) % 10).toString();
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function build(): Product[] {
  const rand = mulberry32(20261018);
  const out: Product[] = [];
  let n = 10001;
  for (const cat of CATEGORIES) {
    const t = TEMPLATES[cat.id];
    for (const [name, unit, base, icon, gst] of t.items) {
      for (const brand of t.brands) {
        // Not every brand stocks every item — keeps the catalogue irregular like real data.
        if (rand() < 0.22 && out.length > 0) continue;
        const sku = `SKU-${n}`;
        const variance = 0.88 + rand() * 0.26;
        const price = round(base * variance);
        const mrp = Math.ceil((price * (1.08 + rand() * 0.22)) / 5) * 5;
        const stockRoll = rand();
        const stock = stockRoll < 0.08 ? 0 : stockRoll < 0.2 ? 3 + Math.floor(rand() * 9) : 40 + Math.floor(rand() * 900);
        const moq = price > 2000 ? 1 : price > 900 ? 2 : [3, 5, 6][Math.floor(rand() * 3)];
        const tags: Product['tags'] = [];
        if (rand() < 0.18) tags.push('bestseller');
        if (rand() < 0.12) tags.push('new');
        if ((mrp - price) / mrp > 0.2) tags.push('deal');
        out.push({
          sku,
          ean: ean13(`890${(4210000 + n).toString().slice(-7)}${Math.floor(rand() * 90 + 10)}`),
          name: `${brand} ${name}`,
          brand,
          category: cat.id,
          icon,
          colors: cat.colors,
          unit,
          mrp,
          price,
          gst,
          moq,
          stock,
          rating: Math.round((3.4 + rand() * 1.6) * 10) / 10,
          ratingCount: 12 + Math.floor(rand() * 2400),
          tiers: [
            { min: moq, max: 9, price },
            { min: 10, max: 49, price: round(price * 0.97) },
            { min: 50, max: null, price: round(price * 0.94) },
          ],
          variants: [
            { id: 'single', label: `1 × ${unit}`, multiplier: 1, extraDiscountPct: 0 },
            { id: 'case6', label: 'Case of 6', multiplier: 6, extraDiscountPct: 2 },
            { id: 'case12', label: 'Case of 12', multiplier: 12, extraDiscountPct: 3.5 },
          ],
          tags,
          leadTimeDays: 1 + Math.floor(rand() * 4),
          description: `${brand} ${name} is supplied directly from the brand's authorised distributor in Hyderabad. Every lot is batch-tracked, carries a minimum of 70% shelf life on delivery and is packed in moisture-proof outer cartons suitable for retail back-rooms. Ideal for kirana stores, supermarkets and HoReCa buyers who need a consistent, fast-moving SKU at a predictable wholesale price. Prices include all transport to your pincode; GST is charged extra as per HSN rules and is fully claimable as input credit on a valid GSTIN.`,
          highlights: [
            'Direct from authorised distributor',
            `Delivered in ${1 + Math.floor(rand() * 3)}–4 working days`,
            'Batch number and expiry printed on every carton',
            'Easy returns for transit damage within 48 hours',
          ],
          specs: [
            ['Brand', brand],
            ['Pack size', unit],
            ['HSN code', `${2000 + Math.floor(rand() * 7000)}`],
            ['GST rate', `${gst}%`],
            ['Shelf life', `${6 + Math.floor(rand() * 18)} months`],
            ['Country of origin', 'India'],
          ],
        });
        n++;
      }
    }
  }
  return out;
}

export const PRODUCTS: Product[] = build();
export const PRODUCT_BY_SKU: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p]));
export const PRODUCT_BY_EAN: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.ean, p]));
export const BRANDS: string[] = Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort();

/** Price per pack for a given quantity of packs (tier pricing + variant discount). */
export function unitPriceFor(p: Product, variantId: string, qty: number): number {
  const v = p.variants.find((x) => x.id === variantId) ?? p.variants[0];
  const totalUnits = qty * v.multiplier;
  const tier = [...p.tiers].reverse().find((t) => totalUnits >= t.min) ?? p.tiers[0];
  return round(tier.price * v.multiplier * (1 - v.extraDiscountPct / 100));
}

export function discountPct(p: Product) {
  return Math.round(((p.mrp - p.price) / p.mrp) * 100);
}
