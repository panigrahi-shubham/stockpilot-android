import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { useRouter, usePreventRemove } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { COD_LIMIT, cartSummary } from '@/state/cart';
import { api } from '@/data/api';
import { Address, INDIAN_STATES, Order, PINCODES } from '@/data/seed';
import { lookupPincodeOnline, PostOffice } from '@/data/online';
import { addDays, fmtDay, inr, validators } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Card, Checkbox, Divider, RadioGroup, Row, TextField } from '@/components/ui';
import { LoadingOverlay, SelectField, useToast } from '@/components/overlays';
import { DateField } from '@/components/DateField';

const STEPS = ['Address', 'Delivery', 'Payment', 'Review'];
const SLOTS = [
  { value: 'morning', label: 'Morning', description: '8 AM – 12 PM' },
  { value: 'afternoon', label: 'Afternoon', description: '12 PM – 4 PM' },
  { value: 'evening', label: 'Evening', description: '4 PM – 8 PM · Fully booked', disabled: true },
] as const;
type Slot = (typeof SLOTS)[number]['value'];
type Pay = 'credit' | 'upi' | 'neft' | 'cod';

export default function Checkout() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const sum = cartSummary(state);
  const user = state.user!;
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string>(state.addresses.find((a) => a.isDefault)?.id ?? state.addresses[0]?.id);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [unload, setUnload] = useState(false);
  const [pay, setPay] = useState<Pay | null>(null);
  const [upi, setUpi] = useState('');
  const [po, setPo] = useState('');
  const [poFile, setPoFile] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [placing, setPlacing] = useState(false);
  const [upiWait, setUpiWait] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const disablePrevention = usePreventRemove(!placing && sum.lineCount > 0, ({ repeat }) => {
    Alert.alert('Leave checkout?', 'Your cart is saved, but delivery and payment details you entered will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: repeat },
    ]);
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const address = state.addresses.find((a) => a.id === addressId);
  const creditOk = user.creditLimit > 0 && sum.total <= sum.availableCredit;

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0 && !address) e.address = 'Select a delivery address';
    if (step === 1) {
      if (!date) e.date = 'Select a delivery date';
      else if (date.getDay() === 0) e.date = 'We don’t deliver on Sundays. Pick another day.';
      if (!slot) e.slot = 'Select a delivery slot';
    }
    if (step === 2) {
      if (!pay) e.pay = 'Select a payment method';
      if (pay === 'upi' && !validators.upi(upi)) e.upi = 'Enter a valid UPI ID (e.g. ravi@okicici)';
      if (po && !/^[A-Z0-9\-\/]{4,20}$/i.test(po)) e.po = 'PO number can contain letters, digits, - and / (4–20 chars)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const finalize = async () => {
    try {
      const { id } = await api.placeOrder();
      const now = new Date().toISOString();
      const status: Order['status'] = sum.needsApproval ? 'pending_approval' : 'confirmed';
      const order: Order = {
        id,
        createdAt: now,
        status,
        lines: sum.lines.map((l) => ({ sku: l.sku, name: l.product.name, variantLabel: l.variant.label, qty: l.qty, unitPrice: l.unitPrice, gst: l.product.gst })),
        subtotal: sum.subtotal,
        discount: sum.couponDiscount,
        gst: sum.gst,
        delivery: sum.delivery,
        total: sum.total,
        paymentMethod: pay!,
        deliveryDate: date!.toISOString(),
        slot: SLOTS.find((s) => s.value === slot)!.label + ` (${SLOTS.find((s) => s.value === slot)!.description})`,
        address: address!,
        poNumber: po || undefined,
        history: [{ status, at: now, note: status === 'pending_approval' ? 'Sent to manager for approval' : undefined }],
        placedBy: user.name,
      };
      actions.addOrder(order);
      if (pay === 'credit') actions.updateUser({ creditUsed: user.creditUsed + sum.total });
      actions.clearCart();
      actions.addNotification({ id: `N-${Date.now()}`, kind: 'order', title: status === 'pending_approval' ? 'Order sent for approval' : 'Order confirmed', body: `${id} · ${inr(sum.total)}`, at: now, read: false, link: `/order/${id}` });
      scheduleOrderNotification(id, status === 'confirmed' && state.settings.notifOrders, () => actions.setOrderStatus(id, 'packed'));
      disablePrevention();
      router.replace({ pathname: '/order-success', params: { id } });
    } catch (e) {
      setPlacing(false);
      onError(e);
    }
  };

  const place = () => {
    if (!terms) return setErrors({ terms: 'Please accept the Terms of Trade' });
    if (pay === 'upi') {
      setUpiWait(true);
      return;
    }
    setPlacing(true);
    finalize();
  };

  return (
    <Screen testID="checkout-screen">
      <AppHeader testID="checkout-header" title="Checkout" subtitle={`Step ${step + 1} of 4 · ${STEPS[step]}`} showCart={false} />
      <View testID="checkout-stepper" style={{ flexDirection: 'row', backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12, gap: 6, borderBottomWidth: 1, borderBottomColor: c.border }}>
        {STEPS.map((s, i) => {
          const status = i < step ? 'done' : i === step ? 'active' : 'todo';
          return (
            <View key={s} testID={`checkout-step-${i}-${status}`} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: status === 'todo' ? c.border : c.primary }}>
                {status === 'done' ? <Ionicons name="checkmark" size={15} color={c.onPrimary} /> : <Text style={[font.small, { color: status === 'todo' ? c.textMuted : c.onPrimary, fontWeight: '800' }]}>{i + 1}</Text>}
              </View>
              <Text style={[font.tiny, { color: status === 'todo' ? c.textFaint : c.text }]}>{s.toUpperCase()}</Text>
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} testID="checkout-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 130 }}>
          {step === 0 ? (
            <>
              <Text style={[font.h3, { color: c.text }]}>Deliver to</Text>
              <RadioGroup
                testID="checkout-address"
                value={addressId}
                onChange={setAddressId}
                options={state.addresses.map((a) => ({ value: a.id, label: `${a.label}${a.isDefault ? ' · Default' : ''}`, description: `${a.name}, ${a.line1}, ${a.city}, ${a.state} – ${a.pincode} · ${a.phone}` }))}
              />
              {errors.address ? <Text testID="checkout-address-error" style={[font.small, { color: c.danger }]}>{errors.address}</Text> : null}
              {adding ? (
                <AddressForm
                  onCancel={() => setAdding(false)}
                  onSave={(a) => {
                    actions.addAddress(a);
                    setAddressId(a.id);
                    setAdding(false);
                    toast.show('Address saved', 'success');
                  }}
                />
              ) : (
                <Button testID="checkout-add-address-button" title="Add a new address" icon="add" variant="outline" onPress={() => setAdding(true)} />
              )}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <DateField
                testID="checkout-delivery-date"
                label="Delivery date"
                value={date}
                onChange={(d) => {
                  setDate(d);
                  setErrors((e) => ({ ...e, date: undefined }));
                }}
                minimumDate={addDays(new Date(), 1)}
                maximumDate={addDays(new Date(), 30)}
                error={errors.date}
              />
              <Text style={[font.small, { color: c.textMuted, marginTop: -6 }]}>Deliveries run Monday – Saturday. Earliest: tomorrow.</Text>
              <Text style={[font.h3, { color: c.text, marginTop: 6 }]}>Time slot</Text>
              <RadioGroup testID="checkout-slot" value={slot} onChange={(v) => { setSlot(v); setErrors((e) => ({ ...e, slot: undefined })); }} options={SLOTS.map((s) => ({ ...s }))} />
              {errors.slot ? <Text testID="checkout-slot-error" style={[font.small, { color: c.danger }]}>{errors.slot}</Text> : null}
              <TextField
                testID="checkout-instructions-input"
                label="Delivery instructions (optional)"
                placeholder="e.g. Use the back entrance, call before arriving"
                multiline
                maxLength={200}
                showCounter
                value={notes}
                onChangeText={setNotes}
              />
              <Checkbox testID="checkout-unload-checkbox" label="I need unloading assistance (₹0 — free for orders above ₹25,000)" checked={unload} onChange={setUnload} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={[font.h3, { color: c.text }]}>Payment method</Text>
              <RadioGroup
                testID="checkout-payment"
                value={pay}
                onChange={(v) => {
                  setPay(v);
                  setErrors((e) => ({ ...e, pay: undefined }));
                }}
                options={[
                  { value: 'credit', label: 'StockPilot Credit (Net-30)', description: user.creditLimit ? `Available ${inr(sum.availableCredit, { decimals: false })}${creditOk ? '' : ' · insufficient for this order'}` : 'Not available — complete KYC', disabled: !creditOk },
                  { value: 'upi', label: 'UPI', description: 'Approve the request in any UPI app' },
                  { value: 'neft', label: 'NEFT / RTGS', description: 'Order ships after payment is received' },
                  { value: 'cod', label: 'Cash on delivery', description: sum.total > COD_LIMIT ? `Not available above ${inr(COD_LIMIT, { decimals: false })}` : '₹40 handling fee may apply', disabled: sum.total > COD_LIMIT },
                ]}
              />
              {errors.pay ? <Text testID="checkout-payment-error" style={[font.small, { color: c.danger }]}>{errors.pay}</Text> : null}
              {pay === 'upi' ? <TextField testID="checkout-upi-input" label="Your UPI ID" placeholder="name@okhdfcbank" autoCapitalize="none" value={upi} onChangeText={setUpi} error={errors.upi} icon="at-outline" /> : null}
              {pay === 'neft' ? (
                <Card testID="checkout-neft-details" style={{ gap: 8 }}>
                  <Text style={[font.h3, { color: c.text }]}>Transfer to</Text>
                  {[
                    ['Account name', 'StockPilot Distribution Pvt Ltd'],
                    ['Account no.', '50200061234567'],
                    ['IFSC', 'HDFC0001234'],
                    ['Bank', 'HDFC Bank, Begumpet'],
                  ].map(([k, v]) => (
                    <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[font.small, { color: c.textMuted, width: 100 }]}>{k}</Text>
                      <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>{v}</Text>
                      <Pressable
                        testID={`checkout-neft-copy-${k.toLowerCase().replace(/[^a-z]/g, '')}`}
                        accessibilityLabel={`Copy ${k}`}
                        onPress={async () => {
                          await Clipboard.setStringAsync(v);
                          toast.show(`${k} copied`, 'success');
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="copy-outline" size={16} color={c.primary} />
                      </Pressable>
                    </View>
                  ))}
                </Card>
              ) : null}
              <Divider />
              <TextField testID="checkout-po-input" label="Purchase order (PO) number — optional" placeholder="e.g. PO-2026-0412" autoCapitalize="characters" value={po} onChangeText={setPo} error={errors.po} />
              {poFile ? (
                <View testID="checkout-po-file" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: c.primarySoft }}>
                  <Ionicons name="document-attach-outline" size={20} color={c.primary} />
                  <Text testID="checkout-po-file-name" numberOfLines={1} style={[font.bodyStrong, { color: c.text, flex: 1 }]}>
                    {poFile}
                  </Text>
                  <Pressable testID="checkout-po-file-remove" accessibilityLabel="Remove PO file" onPress={() => setPoFile(null)}>
                    <Ionicons name="close-circle" size={20} color={c.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Button
                  testID="checkout-po-upload-button"
                  title="Attach PO document (PDF/JPG)"
                  icon="attach"
                  variant="secondary"
                  onPress={async () => {
                    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: false });
                    if (!res.canceled && res.assets[0]) setPoFile(res.assets[0].name);
                  }}
                />
              )}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Card style={{ gap: 4 }}>
                <ReviewLine testID="checkout-review-address" icon="location-outline" title={address?.label ?? ''} body={address ? `${address.line1}, ${address.city} – ${address.pincode}` : ''} onEdit={() => setStep(0)} />
                <Divider />
                <ReviewLine testID="checkout-review-delivery" icon="calendar-outline" title={date ? fmtDay(date) : ''} body={SLOTS.find((s) => s.value === slot)?.description ?? ''} onEdit={() => setStep(1)} />
                <Divider />
                <ReviewLine
                  testID="checkout-review-payment"
                  icon="card-outline"
                  title={{ credit: 'StockPilot Credit (Net-30)', upi: `UPI · ${upi}`, neft: 'NEFT / RTGS', cod: 'Cash on delivery' }[pay ?? 'credit']}
                  body={po ? `PO ${po}` : 'No PO number'}
                  onEdit={() => setStep(2)}
                />
              </Card>
              <Card style={{ gap: 6 }}>
                <Pressable testID="checkout-review-items-toggle" accessibilityRole="button" accessibilityState={{ expanded: itemsOpen }} onPress={() => setItemsOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[font.h3, { color: c.text, flex: 1 }]}>{sum.lineCount} products · {sum.itemCount} packs</Text>
                  <Ionicons name={itemsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={c.textMuted} />
                </Pressable>
                {itemsOpen
                  ? sum.lines.map((l) => (
                      <View key={`${l.sku}-${l.variantId}`} testID={`checkout-review-item-${l.sku}`} style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                        <Text style={[font.small, { color: c.text, flex: 1 }]} numberOfLines={1}>
                          {l.qty} × {l.product.name}
                        </Text>
                        <Text style={[font.small, { color: c.text, fontWeight: '700' }]}>{inr(l.lineTotal)}</Text>
                      </View>
                    ))
                  : null}
                <Divider />
                <Row label="Subtotal" value={inr(sum.subtotal)} testID="checkout-subtotal" />
                {sum.couponDiscount ? <Row label={`Coupon (${state.coupon})`} value={`– ${inr(sum.couponDiscount)}`} testID="checkout-discount" valueColor={c.success} /> : null}
                <Row label="GST" value={inr(sum.gst)} testID="checkout-gst" />
                <Row label="Delivery" value={sum.delivery ? inr(sum.delivery) : 'FREE'} testID="checkout-delivery" />
                <Divider />
                <Row label="Total payable" value={inr(sum.total)} testID="checkout-total" bold />
              </Card>
              {sum.needsApproval ? (
                <View testID="checkout-approval-notice" style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: c.infoSoft }}>
                  <Ionicons name="people-outline" size={18} color={c.info} />
                  <Text style={[font.small, { color: c.text, flex: 1 }]}>This order is above ₹50,000 and will be sent to your manager for approval.</Text>
                </View>
              ) : null}
              <Checkbox testID="checkout-terms-checkbox" checked={terms} onChange={(v) => { setTerms(v); setErrors({}); }}>
                <Text style={[font.body, { color: c.text, flex: 1 }]}>
                  I agree to the{' '}
                  <Text testID="checkout-terms-link" style={{ color: c.primary, fontWeight: '700' }} onPress={() => router.push({ pathname: '/webview', params: { doc: 'terms' } })}>
                    Terms of Trade
                  </Text>{' '}
                  and the returns policy.
                </Text>
              </Checkbox>
              {errors.terms ? <Text testID="checkout-terms-error" style={[font.small, { color: c.danger }]}>{errors.terms}</Text> : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border, padding: 16, paddingBottom: insets.bottom + 12, flexDirection: 'row', gap: 10 }}>
        {step > 0 ? <Button testID="checkout-back-button" title="Back" variant="secondary" full={false} onPress={() => setStep((s) => s - 1)} style={{ paddingHorizontal: 22 }} /> : null}
        {step < 3 ? (
          <Button testID="checkout-continue-button" title={`Continue to ${STEPS[step + 1].toLowerCase()}`} icon="arrow-forward" iconRight style={{ flex: 1 }} onPress={next} />
        ) : (
          <Button testID="checkout-place-order-button" title={`Place order · ${inr(sum.total, { decimals: false })}`} disabled={!terms} style={{ flex: 1 }} onPress={place} />
        )}
      </View>

      <LoadingOverlay visible={placing} message={pay === 'upi' ? 'Confirming UPI payment…' : 'Placing your order…'} />
      <UpiWaitModal
        visible={upiWait}
        upi={upi}
        amount={sum.total}
        onCancel={() => {
          setUpiWait(false);
          toast.show('Payment cancelled. Your order was not placed.', 'error');
        }}
        onPaid={() => {
          setUpiWait(false);
          setPlacing(true);
          finalize();
        }}
      />
    </Screen>
  );
}

async function scheduleOrderNotification(id: string, enabled: boolean, onPacked: () => void) {
  if (!enabled) return;
  setTimeout(onPacked, 15000);
  try {
    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.granted;
    if (!granted && perm.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Order ${id} packed 📦`,
        body: 'Your order is packed and will be handed to the courier today.',
        data: { url: `/order/${id}` },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 15, channelId: 'orders' },
    });
  } catch {}
}

function ReviewLine({ testID, icon, title, body, onEdit }: { testID: string; icon: any; title: string; body: string; onEdit: () => void }) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 4 }}>
      <Ionicons name={icon} size={20} color={c.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[font.bodyStrong, { color: c.text }]}>{title}</Text>
        <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{body}</Text>
      </View>
      <Pressable testID={`${testID}-edit`} accessibilityRole="button" accessibilityLabel="Edit" onPress={onEdit} hitSlop={8}>
        <Text style={[font.small, { color: c.primary, fontWeight: '800' }]}>EDIT</Text>
      </Pressable>
    </View>
  );
}

function UpiWaitModal({ visible, upi, amount, onCancel, onPaid }: { visible: boolean; upi: string; amount: number; onCancel: () => void; onPaid: () => void }) {
  const { c } = useTheme();
  const [left, setLeft] = useState(120);
  useEffect(() => {
    if (!visible) return;
    setLeft(120);
    const id = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [visible]);
  useEffect(() => {
    if (visible && left === 0) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
        <View testID="upi-wait-modal" style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, alignItems: 'center' }}>
          <Ionicons name="phone-portrait-outline" size={44} color={c.primary} />
          <Text style={[font.h2, { color: c.text, textAlign: 'center' }]}>Approve payment in your UPI app</Text>
          <Text style={[font.body, { color: c.textMuted, textAlign: 'center' }]}>
            A collect request of {inr(amount)} has been sent to {upi}.
          </Text>
          <Text testID="upi-wait-timer" style={[font.h1, { color: c.primary, fontVariant: ['tabular-nums'] }]}>
            {Math.floor(left / 60)}:{(left % 60).toString().padStart(2, '0')}
          </Text>
          <Button testID="upi-confirm-button" title="I have approved the payment" onPress={onPaid} />
          <Button testID="upi-cancel-button" title="Cancel payment" variant="ghost" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

function AddressForm({ onSave, onCancel }: { onSave: (a: Address) => void; onCancel: () => void }) {
  const { c } = useTheme();
  const toast = useToast();
  const [f, setF] = useState({ label: '', name: '', phone: '', line1: '', pincode: '', city: '', state: '' });
  const [e, setE] = useState<Record<string, string | undefined>>({});
  const [locating, setLocating] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: undefined }));
  };

  const [pinLookup, setPinLookup] = useState<{ status: 'idle' | 'loading' | 'live' | 'offline' | 'notfound'; offices: PostOffice[] }>({ status: 'idle', offices: [] });

  // Live India Post lookup (online). Falls back to the built-in table when offline.
  useEffect(() => {
    if (f.pincode.length !== 6) {
      setPinLookup({ status: 'idle', offices: [] });
      return;
    }
    let cancelled = false;
    setPinLookup({ status: 'loading', offices: [] });
    lookupPincodeOnline(f.pincode)
      .then((offices) => {
        if (cancelled) return;
        const first = offices[0];
        setPinLookup({ status: 'live', offices });
        setF((x) => ({ ...x, city: first.District, state: INDIAN_STATES.find((st) => st.toLowerCase() === first.State.toLowerCase()) ?? x.state }));
      })
      .catch((err) => {
        if (cancelled) return;
        const hit = PINCODES[f.pincode.slice(0, 3)];
        if (hit) setF((x) => ({ ...x, city: hit.city, state: hit.state }));
        setPinLookup({ status: err?.code === 'NOT_FOUND' ? 'notfound' : 'offline', offices: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [f.pincode]);

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Location permission denied. Enter the address manually.', 'error');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [g] = await Location.reverseGeocodeAsync(pos.coords);
      setF((x) => ({
        ...x,
        line1: [g?.name, g?.street, g?.district].filter(Boolean).join(', ') || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        city: g?.city ?? x.city,
        state: INDIAN_STATES.find((s) => s === g?.region) ?? x.state,
        pincode: g?.postalCode ?? x.pincode,
      }));
      toast.show('Address filled from your current location', 'success');
    } catch {
      toast.show('Couldn’t get your location. Check that GPS is on.', 'error');
    } finally {
      setLocating(false);
    }
  };

  const save = () => {
    const er: Record<string, string> = {};
    if (!f.label.trim()) er.label = 'Give this address a name, e.g. “Branch 2”';
    if (f.name.trim().length < 3) er.name = 'Enter the receiver’s full name';
    if (!validators.phone(f.phone)) er.phone = 'Enter a valid 10-digit mobile number starting with 6–9';
    if (f.line1.trim().length < 8) er.line1 = 'Enter shop/building number and street';
    if (!validators.pincode(f.pincode)) er.pincode = 'Enter a valid 6-digit pincode';
    else if (PINCODES[f.pincode.slice(0, 3)]?.serviceable === false) er.pincode = 'We don’t deliver to this pincode yet';
    if (!f.city.trim()) er.city = 'City is required';
    if (!f.state) er.state = 'Select a state';
    setE(er);
    if (Object.keys(er).length) return;
    onSave({ id: `A-${Date.now()}`, ...f });
  };

  return (
    <Card testID="address-form" style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[font.h3, { color: c.text, flex: 1 }]}>New address</Text>
        <Button testID="address-use-location-button" title="Use my location" icon="navigate-outline" size="sm" variant="secondary" full={false} loading={locating} onPress={locate} />
      </View>
      <TextField testID="address-label-input" label="Address name" placeholder="e.g. Branch 2" value={f.label} onChangeText={set('label')} error={e.label} />
      <TextField testID="address-name-input" label="Receiver name" value={f.name} onChangeText={set('name')} error={e.name} />
      <TextField testID="address-phone-input" label="Mobile" keyboardType="phone-pad" maxLength={10} value={f.phone} onChangeText={(v) => set('phone')(v.replace(/[^0-9]/g, ''))} error={e.phone} />
      <TextField testID="address-line1-input" label="Shop / building, street, area" value={f.line1} onChangeText={set('line1')} error={e.line1} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextField testID="address-pincode-input" label="Pincode" keyboardType="number-pad" maxLength={6} value={f.pincode} onChangeText={(v) => set('pincode')(v.replace(/[^0-9]/g, ''))} error={e.pincode} containerStyle={{ flex: 1 }} />
        <TextField testID="address-city-input" label="City" value={f.city} onChangeText={set('city')} error={e.city} containerStyle={{ flex: 1 }} />
      </View>
      {pinLookup.status !== 'idle' ? (
        <View testID="address-pincode-lookup" style={{ gap: 6, marginTop: -4 }}>
          <Text testID="address-pincode-result" style={[font.small, { color: pinLookup.status === 'live' ? c.success : pinLookup.status === 'loading' ? c.textMuted : c.warning }]}>
            {pinLookup.status === 'loading'
              ? 'Looking up India Post…'
              : pinLookup.status === 'live'
                ? `✓ India Post: ${pinLookup.offices.length} post office${pinLookup.offices.length > 1 ? 's' : ''} in ${pinLookup.offices[0].District}, ${pinLookup.offices[0].State}`
                : pinLookup.status === 'notfound'
                  ? 'India Post has no record of this pincode — please double-check it.'
                  : 'Offline — filled city/state from saved data.'}
          </Text>
          {pinLookup.status === 'live' && pinLookup.offices.length > 1 ? (
            <SelectField
              testID="address-post-office-select"
              label="Locality / post office"
              value={null}
              placeholder="Choose your locality (optional)"
              options={pinLookup.offices.map((o) => ({ value: o.Name, label: `${o.Name} · ${o.BranchType}` }))}
              onChange={(v) => set('line1')(f.line1 && !f.line1.includes(v) ? `${f.line1}, ${v}` : f.line1 || v)}
            />
          ) : null}
        </View>
      ) : null}
      <SelectField testID="address-state-select" label="State" value={f.state || null} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} onChange={set('state')} error={e.state} searchable />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button testID="address-cancel-button" title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onCancel} />
        <Button testID="address-save-button" title="Save address" style={{ flex: 2 }} onPress={save} />
      </View>
    </Card>
  );
}
