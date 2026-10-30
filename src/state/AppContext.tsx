import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '@/i18n';
import {
  Address,
  AppNotification,
  DEFAULT_ADDRESSES,
  Order,
  OrderStatus,
  User,
  seedNotifications,
  seedOrders,
} from '@/data/seed';
import {
  ChatMsg,
  Conversation,
  Lead,
  LeadStatus,
  ListingStatus,
  Review,
  SellerProduct,
  seedConversations,
  seedLeads,
  seedSellerProducts,
} from '@/data/marketplace';

export interface CartItem {
  sku: string;
  variantId: string;
  qty: number;
}

export interface QuickListItem {
  sku: string;
  qty: number;
}

export type { ChatMsg as ChatMessage };

export type KycDocId = 'gst' | 'pan' | 'licence' | 'cheque';
export interface KycDoc {
  status: 'verified' | 'review' | 'rejected' | 'missing';
  fileName?: string;
  uploadedAt?: string;
  note?: string;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  language: Lang;
  biometricLogin: boolean;
  appLock: boolean;
  notifOrders: boolean;
  notifOffers: boolean;
  notifPayments: boolean;
  compactCatalog: boolean;
}

export interface QaConfig {
  latencyMs: number;
  failRate: number; // 0..100
  offline: boolean;
  promoMode: 'random' | 'always' | 'never';
  skipOtp: boolean;
  devUnlocked: boolean;
  animations: boolean;
}

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  user: User | null;
  pendingUser: User | null;
  rememberedEmail: string;
  biometricEmail: string;
  sessionExpired: boolean;
  settings: Settings;
  qa: QaConfig;
  cart: CartItem[];
  coupon: string | null;
  favorites: string[];
  quickList: QuickListItem[];
  orders: Order[];
  notifications: AppNotification[];
  addresses: Address[];
  recentSearches: string[];
  recentScans: string[];
  kyc: Record<KycDocId, KycDoc>;
  mode: 'buyer' | 'seller';
  sellerProducts: SellerProduct[];
  leads: Lead[];
  conversations: Conversation[];
  compare: string[];
  myReviews: Record<string, Review[]>;
  placedOrders: number;
  appRated: boolean;
  promoShownThisSession: boolean;
}

const STORAGE_KEY = 'stockpilot.state.v4';

export function initialState(): AppState {
  const orders = seedOrders();
  return {
    hydrated: false,
    onboarded: false,
    user: null,
    pendingUser: null,
    rememberedEmail: '',
    biometricEmail: '',
    sessionExpired: false,
    settings: {
      theme: 'system',
      language: 'en',
      biometricLogin: false,
      appLock: false,
      notifOrders: true,
      notifOffers: true,
      notifPayments: true,
      compactCatalog: false,
    },
    qa: { latencyMs: 600, failRate: 0, offline: false, promoMode: 'random', skipOtp: false, devUnlocked: false, animations: true },
    cart: [],
    coupon: null,
    favorites: ['SKU-10003', 'SKU-10021'],
    quickList: [
      { sku: 'SKU-10001', qty: 4 },
      { sku: 'SKU-10006', qty: 10 },
      { sku: 'SKU-10013', qty: 6 },
      { sku: 'SKU-10027', qty: 12 },
      { sku: 'SKU-10044', qty: 3 },
      { sku: 'SKU-10060', qty: 8 },
    ],
    orders,
    notifications: seedNotifications(orders),
    addresses: DEFAULT_ADDRESSES,
    recentSearches: ['rice', 'ghee', 'detergent'],
    recentScans: [],
    kyc: {
      gst: { status: 'verified', fileName: 'GST_Certificate_2024.pdf', uploadedAt: '2026-03-02T10:00:00.000Z' },
      pan: { status: 'verified', fileName: 'PAN_Business.jpg', uploadedAt: '2026-03-02T10:02:00.000Z' },
      licence: { status: 'review', fileName: 'Trade_Licence_GHMC.pdf', uploadedAt: '2026-10-12T15:30:00.000Z' },
      cheque: { status: 'missing' },
    },
    mode: 'buyer',
    sellerProducts: seedSellerProducts(),
    leads: seedLeads(),
    conversations: seedConversations(),
    compare: [],
    myReviews: {},
    placedOrders: 0,
    appRated: false,
    promoShownThisSession: false,
  };
}

type Updater = (s: AppState) => AppState;
type Action = { type: 'update'; fn: Updater } | { type: 'replace'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'update':
      return action.fn(state);
    case 'replace':
      return action.state;
  }
}

/** Module-level mirror so the mock API (outside React) can read QA config and current user. */
export const runtime: { state: AppState; netOnline: boolean } = { state: initialState(), netOnline: true };

interface Ctx {
  state: AppState;
  update: (fn: Updater) => void;
  actions: ReturnType<typeof makeActions>;
}

const AppCtx = createContext<Ctx | null>(null);

function makeActions(update: (fn: Updater) => void) {
  return {
    completeOnboarding: () => update((s) => ({ ...s, onboarded: true })),
    setLanguage: (language: Lang) => update((s) => ({ ...s, settings: { ...s.settings, language } })),
    setSettings: (p: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    setQa: (p: Partial<QaConfig>) => update((s) => ({ ...s, qa: { ...s.qa, ...p } })),
    setPendingUser: (u: User | null) => update((s) => ({ ...s, pendingUser: u })),
    signIn: (u: User, remember: boolean) =>
      update((s) => ({
        ...s,
        user: u,
        pendingUser: null,
        sessionExpired: false,
        rememberedEmail: remember ? u.email : '',
        promoShownThisSession: false,
        kyc:
          u.kyc === 'pending'
            ? { gst: { status: 'missing' }, pan: { status: 'missing' }, licence: { status: 'missing' }, cheque: { status: 'missing' } }
            : s.user?.id === u.id
              ? s.kyc
              : initialState().kyc,
      })),
    signOut: (reason?: 'expired') =>
      update((s) => ({ ...s, user: null, pendingUser: null, sessionExpired: reason === 'expired' })),
    expireSession: () => update((s) => ({ ...s, sessionExpired: true })),
    clearSessionFlag: () => update((s) => ({ ...s, sessionExpired: false })),
    setBiometricEmail: (email: string) => update((s) => ({ ...s, biometricEmail: email })),
    markPromoShown: () => update((s) => ({ ...s, promoShownThisSession: true })),

    addToCart: (sku: string, variantId: string, qty: number) =>
      update((s) => {
        const idx = s.cart.findIndex((c) => c.sku === sku && c.variantId === variantId);
        const cart = [...s.cart];
        if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty };
        else cart.push({ sku, variantId, qty });
        return { ...s, cart };
      }),
    setCartQty: (sku: string, variantId: string, qty: number) =>
      update((s) => ({
        ...s,
        cart: qty <= 0
          ? s.cart.filter((c) => !(c.sku === sku && c.variantId === variantId))
          : s.cart.map((c) => (c.sku === sku && c.variantId === variantId ? { ...c, qty } : c)),
      })),
    removeFromCart: (sku: string, variantId: string) =>
      update((s) => ({ ...s, cart: s.cart.filter((c) => !(c.sku === sku && c.variantId === variantId)) })),
    clearCart: () => update((s) => ({ ...s, cart: [], coupon: null })),
    setCoupon: (code: string | null) => update((s) => ({ ...s, coupon: code })),

    toggleFavorite: (sku: string) =>
      update((s) => ({
        ...s,
        favorites: s.favorites.includes(sku) ? s.favorites.filter((x) => x !== sku) : [...s.favorites, sku],
      })),
    setQuickList: (quickList: QuickListItem[]) => update((s) => ({ ...s, quickList })),
    addToQuickList: (sku: string, qty: number) =>
      update((s) => (s.quickList.some((q) => q.sku === sku) ? s : { ...s, quickList: [...s.quickList, { sku, qty }] })),

    addOrder: (o: Order) => update((s) => ({ ...s, orders: [o, ...s.orders], placedOrders: s.placedOrders + 1 })),
    setOrderStatus: (id: string, status: OrderStatus, note?: string) =>
      update((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                cancelReason: status === 'cancelled' ? note : o.cancelReason,
                history: [...o.history, { status, at: new Date().toISOString(), note }],
              }
            : o,
        ),
      })),
    rateOrder: (id: string, rating: number) =>
      update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, rating } : o)) })),

    addNotification: (n: AppNotification) => update((s) => ({ ...s, notifications: [n, ...s.notifications] })),
    markNotificationRead: (id: string) =>
      update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllRead: () => update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    deleteNotification: (id: string) =>
      update((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) })),

    addAddress: (a: Address) => update((s) => ({ ...s, addresses: [...s.addresses, a] })),
    pushRecentSearch: (q: string) =>
      update((s) => ({
        ...s,
        recentSearches: [q, ...s.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6),
      })),
    clearRecentSearches: () => update((s) => ({ ...s, recentSearches: [] })),
    pushRecentScan: (ean: string) =>
      update((s) => ({ ...s, recentScans: [ean, ...s.recentScans.filter((x) => x !== ean)].slice(0, 5) })),
    setKyc: (id: KycDocId, doc: KycDoc) => update((s) => ({ ...s, kyc: { ...s.kyc, [id]: doc } })),
    // ---------- messaging
    pushMessage: (cid: string, m: ChatMsg, incoming = false) =>
      update((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === cid ? { ...c, messages: [...c.messages, m], archived: false, unread: incoming ? c.unread + 1 : c.unread } : c,
        ),
      })),
    setMessageStatus: (cid: string, mid: string, status: ChatMsg['status']) =>
      update((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === cid ? { ...c, messages: c.messages.map((m) => (m.id === mid ? { ...m, status } : m)) } : c,
        ),
      })),
    markConversationRead: (cid: string, read = true) =>
      update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === cid ? { ...c, unread: read ? 0 : Math.max(1, c.unread) } : c)) })),
    toggleStar: (cid: string) =>
      update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === cid ? { ...c, starred: !c.starred } : c)) })),
    setArchived: (cid: string, archived: boolean) =>
      update((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === cid ? { ...c, archived } : c)) })),
    deleteConversation: (cid: string) => update((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== cid) })),
    ensureConversation: (c: Conversation) =>
      update((s) => (s.conversations.some((x) => x.id === c.id) ? s : { ...s, conversations: [c, ...s.conversations] })),

    // ---------- seller
    setMode: (mode: 'buyer' | 'seller') => update((s) => ({ ...s, mode })),
    upsertListing: (p: SellerProduct) =>
      update((s) => ({
        ...s,
        sellerProducts: s.sellerProducts.some((x) => x.id === p.id)
          ? s.sellerProducts.map((x) => (x.id === p.id ? p : x))
          : [p, ...s.sellerProducts],
      })),
    setListingStatus: (id: string, status: ListingStatus) =>
      update((s) => ({ ...s, sellerProducts: s.sellerProducts.map((x) => (x.id === id ? { ...x, status, updatedAt: new Date().toISOString() } : x)) })),
    deleteListing: (id: string) => update((s) => ({ ...s, sellerProducts: s.sellerProducts.filter((x) => x.id !== id) })),
    addLead: (l: Lead) => update((s) => ({ ...s, leads: [l, ...s.leads] })),
    setLead: (id: string, p: Partial<Lead>) => update((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, ...p } : l)) })),
    setLeadStatus: (id: string, status: LeadStatus) => update((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) })),

    // ---------- compare & reviews
    toggleCompare: (sku: string) =>
      update((s) => ({ ...s, compare: s.compare.includes(sku) ? s.compare.filter((x) => x !== sku) : [...s.compare, sku].slice(-3) })),
    clearCompare: () => update((s) => ({ ...s, compare: [] })),
    addReview: (sku: string, r: Review) => update((s) => ({ ...s, myReviews: { ...s.myReviews, [sku]: [r, ...(s.myReviews[sku] ?? [])] } })),
    setAppRated: () => update((s) => ({ ...s, appRated: true })),
    updateUser: (p: Partial<User>) => update((s) => (s.user ? { ...s, user: { ...s.user, ...p } } : s)),
  };
}

const PERSIST_EXCLUDE: (keyof AppState)[] = ['hydrated', 'pendingUser', 'promoShownThisSession'];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const update = useCallback((fn: Updater) => dispatch({ type: 'update', fn }), []);
  const actions = useMemo(() => makeActions(update), [update]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  runtime.state = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const base = initialState();
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppState>;
          dispatch({
            type: 'replace',
            state: {
              ...base,
              ...saved,
              settings: { ...base.settings, ...saved.settings },
              qa: { ...base.qa, ...saved.qa },
              hydrated: true,
              pendingUser: null,
              promoShownThisSession: false,
            },
          });
        } else {
          dispatch({ type: 'replace', state: { ...base, hydrated: true } });
        }
      } catch {
        dispatch({ type: 'replace', state: { ...initialState(), hydrated: true } });
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const copy: Partial<AppState> = { ...state };
      PERSIST_EXCLUDE.forEach((k) => delete copy[k]);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(copy)).catch(() => {});
    }, 250);
  }, [state]);

  const value = useMemo(() => ({ state, update, actions }), [state, update, actions]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export async function resetPersistedState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
