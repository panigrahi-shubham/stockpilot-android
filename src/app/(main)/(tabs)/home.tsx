import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { useT } from '@/i18n';
import { api } from '@/data/api';
import { PRODUCTS, discountPct } from '@/data/catalog';
import { BANNERS, STATUS_META } from '@/data/seed';
import { compactInr, fmtDate, fmtTime, inr, validators } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, Button, Card, ProgressBar, RadioGroup, SectionHeader, TextField } from '@/components/ui';
import { ProductCard } from '@/components/ProductCard';
import { LoadingOverlay, Sheet, useToast } from '@/components/overlays';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const { c } = useTheme();
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const { width } = useWindowDimensions();
  const { state, actions } = useApp();
  const user = state.user!;
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [promo, setPromo] = useState(false);
  const [paySheet, setPaySheet] = useState(false);

  // Promo interstitial: an "unexpected popup" that automation must handle.
  useEffect(() => {
    if (state.promoShownThisSession || state.qa.promoMode === 'never') return;
    const show = state.qa.promoMode === 'always' || Math.random() < 0.5;
    actions.markPromoShown();
    if (!show) return;
    const id = setTimeout(() => setPromo(true), 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.generic(true);
      setUpdatedAt(new Date());
      toast.show('Dashboard updated', 'success');
    } catch (e) {
      onError(e);
    } finally {
      setRefreshing(false);
    }
  }, [toast, onError]);

  const deals = useMemo(() => [...PRODUCTS].filter((p) => p.stock > 0).sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 8), []);
  const recent = state.orders.slice(0, 3);
  const available = user.creditLimit - user.creditUsed;
  const monthSpend = state.orders
    .filter((o) => new Date(o.createdAt).getMonth() === new Date().getMonth() && !['cancelled', 'rejected'].includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  const quick = [
    { id: 'reorder', label: 'Reorder', icon: 'repeat-outline', onPress: () => router.push(`/order/${state.orders[0]?.id}`) },
    { id: 'quick-list', label: 'Quick list', icon: 'flash-outline', onPress: () => router.push('/quick-list') },
    { id: 'scan', label: 'Scan', icon: 'scan-outline', onPress: () => router.navigate('/scan') },
    { id: 'invoices', label: 'Invoices', icon: 'document-text-outline', onPress: () => router.navigate({ pathname: '/orders', params: { tab: 'delivered' } }) },
    { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', onPress: () => router.push('/reports') },
    { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline', onPress: () => router.push('/messages') },
    { id: 'market', label: 'Live rates', icon: 'trending-up', onPress: () => router.push('/market') },
    { id: 'web', label: 'Web portal', icon: 'globe-outline', onPress: () => router.push('/browser') },
  ] as const;

  return (
    <Screen testID="home-screen">
      <AppHeader
        testID="home-header"
        mode="menu"
        title={`${t('home.greeting') === 'Good day' ? greeting() : t('home.greeting')}, ${user.name.split(' ')[0]}`}
        subtitle={user.business}
        showBell
        showMessages
      />
      <ScrollView
        testID="home-scroll"
        refreshControl={<RefreshControl testID="home-refresh" refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
        contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 40 }}
      >
        <Pressable
          testID="home-search-bar"
          accessibilityRole="search"
          accessibilityLabel="Search products"
          onPress={() => router.navigate({ pathname: '/catalog', params: { focus: String(Date.now()) } })}
          style={{ height: 48, borderRadius: radius.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}
        >
          <Ionicons name="search" size={19} color={c.textFaint} />
          <Text style={[font.body, { color: c.textFaint, flex: 1 }]}>{t('common.search')}</Text>
          <Ionicons name="barcode-outline" size={20} color={c.textMuted} />
        </Pressable>

        {user.kyc === 'pending' ? (
          <Card testID="home-kyc-card" style={{ backgroundColor: c.warningSoft, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Ionicons name="document-lock-outline" size={30} color={c.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[font.h3, { color: c.text }]}>Complete your KYC</Text>
              <Text style={[font.small, { color: c.textMuted, marginTop: 3 }]}>Upload GST & PAN to place orders and unlock up to ₹5L credit.</Text>
            </View>
            <Button testID="home-kyc-button" title="Upload" size="sm" full={false} onPress={() => router.push('/kyc')} />
          </Card>
        ) : (
          <LinearGradient testID="home-credit-card" colors={['#0E5E4F', '#14806A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={[font.small, { color: 'rgba(255,255,255,0.8)', fontWeight: '700' }]}>{t('home.credit').toUpperCase()}</Text>
                <Text testID="home-available-credit" style={[font.h1, { color: '#fff', marginTop: 4, fontSize: 28 }]}>
                  {inr(available, { decimals: false })}
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={[font.tiny, { color: '#fff' }]}>NET-30</Text>
              </View>
            </View>
            <View style={{ marginTop: 14 }}>
              <ProgressBar testID="home-credit-utilisation" value={user.creditUsed / Math.max(1, user.creditLimit)} color="#F5A524" height={7} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text testID="home-credit-used" style={[font.small, { color: 'rgba(255,255,255,0.85)' }]}>
                Used {inr(user.creditUsed, { decimals: false })}
              </Text>
              <Text testID="home-credit-limit" style={[font.small, { color: 'rgba(255,255,255,0.85)' }]}>
                Limit {inr(user.creditLimit, { decimals: false })}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
              <Ionicons name="calendar-outline" size={16} color="#F5B547" />
              <Text style={[font.small, { color: '#fff', flex: 1 }]}>Next due: 21 Oct · ₹48,210</Text>
              <Pressable testID="home-pay-dues-button" accessibilityRole="button" onPress={() => setPaySheet(true)} style={{ backgroundColor: '#F5A524', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
                <Text style={[font.small, { color: '#2B1B00', fontWeight: '800' }]}>Pay dues</Text>
              </Pressable>
            </View>
          </LinearGradient>
        )}

        {state.mode === 'seller' ? (
          <Pressable testID="home-seller-hub-card" accessibilityRole="button" onPress={() => router.push('/seller')}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.accentSoft }}>
              <Ionicons name="storefront-outline" size={28} color={c.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[font.h3, { color: c.text }]}>Seller Hub</Text>
                <Text testID="home-seller-hub-summary" style={[font.small, { color: c.textMuted }]}>
                  {state.leads.filter((l) => l.status === 'new').length} new leads · {state.sellerProducts.filter((l) => l.status === 'active').length} live listings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </Card>
          </Pressable>
        ) : null}

        <BannerCarousel width={width - 32} autoPlay={state.qa.animations} onPress={(code) => (code ? router.push(`/promo/${code}`) : toast.show('Credit is applied automatically at checkout', 'info'))} />

        <View>
          <SectionHeader testID="home-quick-actions-title" title={t('home.quick')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {quick.map((q) => (
              <Pressable
                key={q.id}
                testID={`home-quick-${q.id}`}
                accessibilityRole="button"
                accessibilityLabel={q.label}
                onPress={q.onPress}
                style={({ pressed }) => ({
                  width: (width - 32 - 30) / 4,
                  paddingVertical: 14,
                  borderRadius: radius.lg,
                  backgroundColor: c.card,
                  alignItems: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: c.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={q.icon} size={20} color={c.primary} />
                </View>
                <Text numberOfLines={1} style={[font.tiny, { color: c.text, fontSize: 11 }]}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView testID="home-kpi-scroll" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {[
            { id: 'spend', label: 'Spend this month', value: compactInr(monthSpend), trend: '+12.4%', up: true, icon: 'wallet-outline' },
            { id: 'orders', label: 'Orders placed', value: String(state.orders.length), trend: '+3', up: true, icon: 'receipt-outline' },
            { id: 'savings', label: 'Saved vs MRP', value: compactInr(monthSpend * 0.14), trend: '+8.1%', up: true, icon: 'pricetag-outline' },
            { id: 'pending', label: 'Pending deliveries', value: String(state.orders.filter((o) => ['shipped', 'out_for_delivery', 'packed', 'confirmed'].includes(o.status)).length), trend: '-1', up: false, icon: 'cube-outline' },
            { id: 'returns', label: 'Return rate', value: '0.8%', trend: '-0.3%', up: false, icon: 'repeat-outline' },
          ].map((k) => (
            <View key={k.id} testID={`home-kpi-${k.id}`} style={{ width: 150, backgroundColor: c.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: c.border }}>
              <Ionicons name={k.icon as any} size={18} color={c.textMuted} />
              <Text testID={`home-kpi-${k.id}-value`} style={[font.h2, { color: c.text, marginTop: 8 }]}>
                {k.value}
              </Text>
              <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{k.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 }}>
                <Ionicons name={k.up ? 'trending-up' : 'trending-down'} size={14} color={k.up ? c.success : c.info} />
                <Text style={[font.tiny, { color: k.up ? c.success : c.info }]}>{k.trend} vs last month</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
            <Text testID="home-deals-title" style={[font.h3, { color: c.text, flex: 1 }]}>
              {t('home.deals')}
            </Text>
            <DealTimer />
          </View>
          <FlatList
            testID="home-deals-list"
            horizontal
            data={deals}
            keyExtractor={(p) => p.sku}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => <ProductCard product={item} layout="mini" width={168} />}
          />
        </View>

        <View>
          <SectionHeader testID="home-recent-orders-title" title={t('home.recent')} action={t('home.viewAll')} onAction={() => router.navigate('/orders')} />
          <View style={{ gap: 10 }}>
            {recent.map((o) => (
              <Pressable key={o.id} testID={`home-recent-order-${o.id}`} accessibilityRole="button" onPress={() => router.push(`/order/${o.id}`)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="package-variant-closed" size={22} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[font.bodyStrong, { color: c.text }]}>{o.id}</Text>
                    <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
                      {fmtDate(o.createdAt)} · {o.lines.length} items · {inr(o.total, { decimals: false })}
                    </Text>
                  </View>
                  <Badge label={STATUS_META[o.status].label} tone={STATUS_META[o.status].tone} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        <Text testID="home-last-updated" style={[font.small, { color: c.textFaint, textAlign: 'center' }]}>
          Last updated {fmtTime(updatedAt)} · Pull down to refresh
        </Text>
      </ScrollView>

      <Modal visible={promo} transparent animationType="fade" onRequestClose={() => setPromo(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: 26 }}>
          <View testID="promo-modal" style={{ backgroundColor: c.card, borderRadius: radius.xl, overflow: 'hidden' }}>
            <LinearGradient colors={['#B5446E', '#E8A13A']} style={{ padding: 24, alignItems: 'center' }}>
              <Pressable testID="promo-modal-close" accessibilityRole="button" accessibilityLabel="Close offer" hitSlop={12} onPress={() => setPromo(false)} style={{ position: 'absolute', top: 12, right: 12 }}>
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.9)" />
              </Pressable>
              <Text style={{ fontSize: 46 }}>🪔</Text>
              <Text testID="promo-modal-title" style={[font.h1, { color: '#fff', textAlign: 'center', marginTop: 6 }]}>
                Festive Bonanza
              </Text>
              <Text style={[font.body, { color: '#fff', textAlign: 'center', marginTop: 6 }]}>Extra 5% off on orders above ₹25,000</Text>
            </LinearGradient>
            <View style={{ padding: 20, gap: 12 }}>
              <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.accent, borderRadius: radius.md, padding: 12, alignItems: 'center' }}>
                <Text style={[font.small, { color: c.textMuted }]}>USE CODE</Text>
                <Text testID="promo-modal-code" style={[font.h2, { color: c.text, letterSpacing: 2 }]}>
                  DIWALI25
                </Text>
              </View>
              <Button
                testID="promo-modal-cta"
                title="Shop now"
                onPress={() => {
                  setPromo(false);
                  router.push('/promo/DIWALI25');
                }}
              />
              <Text style={[font.tiny, { color: c.textFaint, textAlign: 'center' }]}>Valid till 31 Oct 2026. T&C apply.</Text>
            </View>
          </View>
        </View>
      </Modal>

      <PayDuesSheet
        visible={paySheet}
        onClose={() => setPaySheet(false)}
        outstanding={48210}
        onPaid={(amt) => {
          actions.updateUser({ creditUsed: Math.max(0, user.creditUsed - amt) });
          toast.show(`Payment of ${inr(amt, { decimals: false })} received. Credit restored.`, 'success');
        }}
      />
    </Screen>
  );
}

function BannerCarousel({ width, onPress, autoPlay }: { width: number; onPress: (code: string) => void; autoPlay: boolean }) {
  const { c } = useTheme();
  const ref = useRef<FlatList>(null);
  const [idx, setIdx] = useState(0);
  const touching = useRef(false);

  useEffect(() => {
    if (!autoPlay) return; // QA Lab → animations off also stops auto-rotation (stable tests)
    const id = setInterval(() => {
      if (touching.current) return;
      setIdx((i) => {
        const n = (i + 1) % BANNERS.length;
        ref.current?.scrollToIndex({ index: n, animated: true });
        return n;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [autoPlay]);

  return (
    <View>
      <FlatList
        ref={ref}
        testID="home-banner-carousel"
        data={BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(b) => b.id}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => (touching.current = true)}
        onMomentumScrollEnd={(e) => {
          touching.current = false;
          setIdx(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item, index }) => (
          <Pressable testID={`home-banner-${index}`} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => onPress(item.code)}>
            <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width, height: 132, borderRadius: radius.xl, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[font.h2, { color: '#fff' }]}>{item.title}</Text>
                <Text style={[font.body, { color: 'rgba(255,255,255,0.9)', marginTop: 4 }]}>{item.subtitle}</Text>
                {item.code ? (
                  <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={[font.small, { color: '#fff', fontWeight: '800', letterSpacing: 1 }]}>{item.code}</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name={item.icon as any} size={64} color="rgba(255,255,255,0.35)" />
            </LinearGradient>
          </Pressable>
        )}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {BANNERS.map((b, i) => (
          <View key={b.id} testID={`home-banner-dot-${i}${i === idx ? '-active' : ''}`} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? c.primary : c.border }} />
        ))}
      </View>
    </View>
  );
}

function DealTimer() {
  const { c } = useTheme();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end.getTime() - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.dangerSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
      <Ionicons name="timer-outline" size={13} color={c.danger} />
      <Text testID="home-deals-timer" style={[font.small, { color: c.danger, fontWeight: '800', fontVariant: ['tabular-nums'] }]}>
        Ends in {pad(h)}:{pad(m)}:{pad(s)}
      </Text>
    </View>
  );
}

function PayDuesSheet({ visible, onClose, outstanding, onPaid }: { visible: boolean; onClose: () => void; outstanding: number; onPaid: (amt: number) => void }) {
  const { c } = useTheme();
  const [amount, setAmount] = useState(String(outstanding));
  const [method, setMethod] = useState<'upi' | 'netbanking'>('upi');
  const [upi, setUpi] = useState('');
  const [err, setErr] = useState<{ amount?: string; upi?: string }>({});
  const [busy, setBusy] = useState(false);
  const onError = useApiError();

  const pay = async () => {
    const amt = Number(amount);
    const e: typeof err = {};
    if (!amt || amt < 1000) e.amount = 'Minimum payment is ₹1,000';
    else if (amt > outstanding) e.amount = `You can pay up to ${inr(outstanding, { decimals: false })}`;
    if (method === 'upi' && !validators.upi(upi)) e.upi = 'Enter a valid UPI ID (e.g. name@okbank)';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.generic(true);
      onClose();
      onPaid(amt);
    } catch (x) {
      onError(x);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Sheet visible={visible && !busy} onClose={onClose} title="Pay credit dues" testID="pay-dues-sheet" footer={<Button testID="pay-dues-submit" title={`Pay ${amount ? inr(Number(amount) || 0, { decimals: false }) : ''}`} onPress={pay} />}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[font.body, { color: c.textMuted }]}>Outstanding</Text>
            <Text testID="pay-dues-outstanding" style={[font.bodyStrong, { color: c.text }]}>
              {inr(outstanding, { decimals: false })}
            </Text>
          </View>
          <TextField testID="pay-dues-amount-input" label="Amount (₹)" keyboardType="number-pad" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))} error={err.amount} />
          <RadioGroup
            testID="pay-dues-method"
            value={method}
            onChange={setMethod}
            options={[
              { value: 'upi', label: 'UPI', description: 'GPay, PhonePe, Paytm, BHIM' },
              { value: 'netbanking', label: 'Net banking', description: 'All major banks' },
            ]}
          />
          {method === 'upi' ? <TextField testID="pay-dues-upi-input" label="UPI ID" autoCapitalize="none" value={upi} onChangeText={setUpi} error={err.upi} placeholder="name@okhdfcbank" /> : null}
        </View>
      </Sheet>
      <LoadingOverlay visible={busy} message="Processing payment…" />
    </>
  );
}
