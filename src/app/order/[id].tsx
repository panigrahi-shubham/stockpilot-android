import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { PRODUCT_BY_SKU } from '@/data/catalog';
import { Order, OrderStatus, STATUS_FLOW, STATUS_META } from '@/data/seed';
import { fmtDate, fmtDateTime, fmtDay, inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, ProductArt, Screen } from '@/components/chrome';
import { Badge, Button, Card, Divider, EmptyState, RadioGroup, Row, Stars, TextField } from '@/components/ui';
import { LoadingOverlay, SelectField, Sheet, useToast } from '@/components/overlays';

const CANCEL_REASONS = [
  { value: 'mistake', label: 'Ordered by mistake' },
  { value: 'price', label: 'Found a better price' },
  { value: 'delay', label: 'Delivery date too late' },
  { value: 'other', label: 'Other reason' },
] as const;

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const { state, actions } = useApp();
  const order = state.orders.find((o) => o.id === id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState<(typeof CANCEL_REASONS)[number]['value'] | null>(null);
  const [other, setOther] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!order)
    return (
      <Screen testID="order-detail-screen">
        <AppHeader testID="order-detail-header" title="Order" />
        <EmptyState testID="order-not-found" icon="search" title="Order not found" subtitle={`We couldn’t find an order with ID ${id}.`} action="Go to my orders" onAction={() => router.replace('/orders')} />
      </Screen>
    );

  const meta = STATUS_META[order.status];
  const cancellable = ['pending_approval', 'confirmed', 'packed'].includes(order.status);
  const isApprover = state.user?.role === 'approver';

  const doCancel = () => {
    if (!reason) return toast.show('Select a reason to cancel', 'error');
    if (reason === 'other' && other.trim().length < 5) return toast.show('Tell us a little more (min 5 characters)', 'error');
    Alert.alert('Cancel this order?', `${order.id} will be cancelled and any credit used will be released. This can’t be undone.`, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelOpen(false);
          setBusy('Cancelling order…');
          try {
            await api.generic(true);
            actions.setOrderStatus(order.id, 'cancelled', reason === 'other' ? other.trim() : CANCEL_REASONS.find((r) => r.value === reason)!.label);
            toast.show('Order cancelled', 'success');
          } catch (e) {
            onError(e);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const decide = async (approve: boolean) => {
    setBusy(approve ? 'Approving…' : 'Rejecting…');
    try {
      await api.generic(true);
      actions.setOrderStatus(order.id, approve ? 'confirmed' : 'rejected', approve ? `Approved by ${state.user!.name}` : rejectNote);
      toast.show(approve ? 'Order approved' : 'Order rejected', approve ? 'success' : 'info');
      setRejectOpen(false);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  };

  const reorder = () => {
    let added = 0;
    order.lines.forEach((l) => {
      const p = PRODUCT_BY_SKU[l.sku];
      if (p && p.stock > 0) {
        actions.addToCart(l.sku, 'single', Math.max(l.qty, p.moq));
        added++;
      }
    });
    toast.show(added === order.lines.length ? `All ${added} products added to cart` : `${added} of ${order.lines.length} products added (rest out of stock)`, added ? 'success' : 'error');
    if (added) router.push('/cart');
  };

  const invoice = async () => {
    setBusy('Generating invoice…');
    try {
      await api.generic(true, true);
      const html = invoiceHtml(order, state.user?.business ?? '', state.user?.gstin ?? '');
      const file = new File(Paths.cache, `Invoice_${order.id}.html`);
      if (file.exists) file.delete();
      file.create();
      file.write(html);
      setBusy(null);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'text/html', dialogTitle: `Invoice ${order.id}` });
      else toast.show(`Invoice saved to ${file.uri}`, 'success');
    } catch (e) {
      setBusy(null);
      onError(e);
    }
  };

  return (
    <Screen testID="order-detail-screen">
      <AppHeader
        testID="order-detail-header"
        title={order.id}
        subtitle={`Placed ${fmtDateTime(order.createdAt)}`}
        right={
          <Pressable
            testID="order-detail-copy-id"
            accessibilityLabel="Copy order ID"
            hitSlop={8}
            onPress={async () => {
              await Clipboard.setStringAsync(order.id);
              toast.show('Order ID copied', 'success');
            }}
            style={{ padding: 8 }}
          >
            <Ionicons name="copy-outline" size={20} color={c.text} />
          </Pressable>
        }
      />
      <ScrollView testID="order-detail-scroll" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[font.h3, { color: c.text, flex: 1 }]}>Order status</Text>
            <Badge testID="order-detail-status" label={meta.label} tone={meta.tone} />
          </View>
          {order.status === 'cancelled' || order.status === 'rejected' ? (
            <Text testID="order-detail-cancel-reason" style={[font.body, { color: c.danger }]}>
              Reason: {order.cancelReason ?? order.history[order.history.length - 1]?.note ?? '—'}
            </Text>
          ) : order.status !== 'delivered' ? (
            <Text testID="order-detail-eta" style={[font.body, { color: c.textMuted }]}>
              Expected by {fmtDay(order.deliveryDate)} · {order.slot}
            </Text>
          ) : null}
          {order.trackingId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.cardAlt, padding: 10, borderRadius: radius.md }}>
              <Ionicons name="cube-outline" size={18} color={c.textMuted} />
              <Text style={[font.small, { color: c.textMuted }]}>BlueDart AWB</Text>
              <Text testID="order-detail-tracking-id" selectable style={[font.bodyStrong, { color: c.text, flex: 1 }]}>
                {order.trackingId}
              </Text>
            </View>
          ) : null}
          <Timeline order={order} />
        </Card>

        {order.status === 'pending_approval' && isApprover ? (
          <Card testID="order-approval-card" style={{ gap: 10, backgroundColor: c.warningSoft }}>
            <Text style={[font.h3, { color: c.text }]}>Needs your approval</Text>
            <Text style={[font.small, { color: c.textMuted }]}>Placed by {order.placedBy}. Total {inr(order.total)}.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button testID="order-reject-button" title="Reject" variant="outline" style={{ flex: 1 }} onPress={() => setRejectOpen(true)} />
              <Button testID="order-approve-button" title="Approve" style={{ flex: 1 }} onPress={() => decide(true)} />
            </View>
          </Card>
        ) : null}

        <Card style={{ gap: 10 }}>
          <Text style={[font.h3, { color: c.text }]}>Items ({order.lines.length})</Text>
          {order.lines.map((l) => {
            const p = PRODUCT_BY_SKU[l.sku];
            return (
              <Pressable key={l.sku} testID={`order-item-${l.sku}`} onPress={() => p && router.push(`/product/${l.sku}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                {p ? <ProductArt product={p} size={52} /> : null}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={[font.bodyStrong, { color: c.text }]}>
                    {l.name}
                  </Text>
                  <Text style={[font.small, { color: c.textMuted }]}>
                    {l.qty} × {inr(l.unitPrice)} · {l.variantLabel}
                  </Text>
                </View>
                <Text style={[font.bodyStrong, { color: c.text }]}>{inr(l.qty * l.unitPrice)}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Card style={{ gap: 2 }}>
          <Text style={[font.h3, { color: c.text, marginBottom: 6 }]}>Payment</Text>
          <Row label="Subtotal" value={inr(order.subtotal)} testID="order-detail-subtotal" />
          {order.discount ? <Row label="Discount" value={`– ${inr(order.discount)}`} testID="order-detail-discount" valueColor={c.success} /> : null}
          <Row label="GST" value={inr(order.gst)} testID="order-detail-gst" />
          <Row label="Delivery" value={order.delivery ? inr(order.delivery) : 'FREE'} testID="order-detail-delivery" />
          <Divider />
          <Row label="Total" value={inr(order.total)} testID="order-detail-total" bold />
          <Text testID="order-detail-payment-method" style={[font.small, { color: c.textMuted, marginTop: 6 }]}>
            Paid via {{ credit: 'StockPilot Credit (Net-30)', upi: 'UPI', neft: 'NEFT / RTGS', cod: 'Cash on delivery' }[order.paymentMethod]}
            {order.poNumber ? ` · PO ${order.poNumber}` : ''}
          </Text>
        </Card>

        <Card style={{ gap: 6 }}>
          <Text style={[font.h3, { color: c.text }]}>Delivery address</Text>
          <Text testID="order-detail-address" style={[font.body, { color: c.textMuted, lineHeight: 20 }]}>
            {order.address.name} · {order.address.phone}
            {'\n'}
            {order.address.line1}, {order.address.city}, {order.address.state} – {order.address.pincode}
          </Text>
        </Card>

        {order.status === 'delivered' ? (
          <Card style={{ gap: 10, alignItems: 'center' }}>
            <Text style={[font.h3, { color: c.text }]}>{order.rating ? 'Thanks for rating!' : 'Rate this delivery'}</Text>
            <Stars testID="order-rate-stars" value={order.rating ?? 0} size={30} onChange={order.rating ? undefined : (v) => { actions.rateOrder(order.id, v); toast.show('Thanks for your feedback!', 'success'); }} />
          </Card>
        ) : null}

        <View style={{ gap: 10 }}>
          {order.status === 'delivered' || order.status === 'shipped' || order.status === 'out_for_delivery' ? (
            <Button testID="order-invoice-button" title="Download GST invoice" icon="download-outline" variant="secondary" onPress={invoice} />
          ) : null}
          <Button testID="order-reorder-button" title="Reorder all items" icon="repeat-outline" variant="outline" onPress={reorder} />
          {order.status === 'delivered' ? <Button testID="order-dispute-button" title="Report a problem" icon="alert-circle-outline" variant="ghost" onPress={() => setDisputeOpen(true)} /> : null}
          {cancellable && !(isApprover && order.status === 'pending_approval') ? (
            <Button testID="order-cancel-button" title="Cancel order" icon="close-circle-outline" variant="danger" onPress={() => setCancelOpen(true)} />
          ) : null}
          <Button testID="order-help-button" title="Need help with this order?" icon="chatbubbles-outline" variant="ghost" onPress={() => router.push({ pathname: '/chat', params: { orderId: order.id } })} />
        </View>
      </ScrollView>

      <Sheet visible={cancelOpen} onClose={() => setCancelOpen(false)} title="Why are you cancelling?" testID="cancel-order-sheet" footer={<Button testID="cancel-order-confirm" title="Cancel order" variant="danger" onPress={doCancel} />}>
        <View style={{ gap: 12 }}>
          <RadioGroup testID="cancel-reason" value={reason} onChange={setReason} options={CANCEL_REASONS.map((r) => ({ ...r }))} />
          {reason === 'other' ? <TextField testID="cancel-other-input" placeholder="Tell us why" value={other} onChangeText={setOther} maxLength={120} showCounter /> : null}
        </View>
      </Sheet>

      <Sheet visible={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject order" testID="reject-order-sheet" footer={<Button testID="reject-order-confirm" title="Reject order" variant="danger" disabled={rejectNote.trim().length < 5} onPress={() => decide(false)} />}>
        <TextField testID="reject-note-input" label="Note for the buyer" placeholder="e.g. Over budget for October" multiline value={rejectNote} onChangeText={setRejectNote} maxLength={200} showCounter />
      </Sheet>

      <DisputeSheet visible={disputeOpen} onClose={() => setDisputeOpen(false)} orderId={order.id} />
      <LoadingOverlay visible={!!busy} message={busy ?? ''} />
    </Screen>
  );
}

function Timeline({ order }: { order: Order }) {
  const { c } = useTheme();
  const flow: OrderStatus[] =
    order.status === 'cancelled'
      ? ['confirmed', 'cancelled']
      : order.status === 'rejected'
        ? ['pending_approval', 'rejected']
        : order.history[0]?.status === 'pending_approval'
          ? ['pending_approval', ...STATUS_FLOW]
          : STATUS_FLOW;
  const doneIdx = flow.indexOf(order.status);
  return (
    <View testID="order-timeline" style={{ marginTop: 4 }}>
      {flow.map((s, i) => {
        const h = order.history.find((x) => x.status === s);
        const done = i <= doneIdx;
        const bad = s === 'cancelled' || s === 'rejected';
        const color = bad ? c.danger : done ? c.primary : c.border;
        return (
          <View key={s} testID={`order-timeline-${s}${done ? '-done' : ''}`} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 20 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: done ? color : c.card, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Ionicons name={bad ? 'close' : 'checkmark'} size={11} color="#fff" /> : null}
              </View>
              {i < flow.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 26, backgroundColor: i < doneIdx ? c.primary : c.border }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 14 }}>
              <Text style={[font.bodyStrong, { color: done ? c.text : c.textFaint }]}>{STATUS_META[s].label}</Text>
              {h ? (
                <Text style={[font.small, { color: c.textMuted }]}>
                  {fmtDateTime(h.at)}
                  {h.note ? ` · ${h.note}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function DisputeSheet({ visible, onClose, orderId }: { visible: boolean; onClose: () => void; orderId: string }) {
  const { c } = useTheme();
  const toast = useToast();
  const [kind, setKind] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const pick = async (camera: boolean) => {
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return toast.show('Camera permission is needed to take a photo', 'error');
    }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].fileName ?? res.assets[0].uri.split('/').pop() ?? 'photo.jpg');
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!kind) e.kind = 'Select an issue type';
    if (desc.trim().length < 15) e.desc = 'Describe the problem in at least 15 characters';
    if (kind === 'damaged' && !photo) e.photo = 'A photo is required for damaged items';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    setBusy(false);
    onClose();
    setKind(null);
    setDesc('');
    setPhoto(null);
    toast.show(`Ticket TKT-${Math.floor(100000 + Math.random() * 899999)} raised for ${orderId}`, 'success');
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Report a problem" testID="dispute-sheet" footer={<Button testID="dispute-submit" title="Submit" loading={busy} onPress={submit} />}>
      <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
        <SelectField
          testID="dispute-type-select"
          label="Issue type"
          value={kind}
          onChange={(v) => { setKind(v); setErr((x) => ({ ...x, kind: undefined })); }}
          error={err.kind}
          options={[
            { value: 'damaged', label: 'Item damaged in transit' },
            { value: 'missing', label: 'Item missing' },
            { value: 'wrong', label: 'Wrong item delivered' },
            { value: 'expiry', label: 'Near-expiry stock' },
            { value: 'invoice', label: 'Invoice mismatch' },
          ]}
        />
        <TextField testID="dispute-description-input" label="Describe the problem" multiline maxLength={500} showCounter value={desc} onChangeText={setDesc} error={err.desc} />
        <View style={{ gap: 8 }}>
          <Text style={[font.small, { color: c.textMuted, fontWeight: '600' }]}>Photo</Text>
          {photo ? (
            <View testID="dispute-photo-attached" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: c.primarySoft }}>
              <Ionicons name="image-outline" size={20} color={c.primary} />
              <Text testID="dispute-photo-name" style={[font.bodyStrong, { color: c.text, flex: 1 }]} numberOfLines={1}>
                {photo}
              </Text>
              <Pressable testID="dispute-photo-remove" onPress={() => setPhoto(null)}>
                <Ionicons name="close-circle" size={20} color={c.textMuted} />
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button testID="dispute-photo-camera" title="Take photo" icon="camera-outline" variant="secondary" style={{ flex: 1 }} onPress={() => pick(true)} />
              <Button testID="dispute-photo-gallery" title="Gallery" icon="image-outline" variant="secondary" style={{ flex: 1 }} onPress={() => pick(false)} />
            </View>
          )}
          {err.photo ? <Text testID="dispute-photo-error" style={[font.small, { color: c.danger }]}>{err.photo}</Text> : null}
        </View>
      </ScrollView>
    </Sheet>
  );
}

function invoiceHtml(o: Order, business: string, gstin: string) {
  const rows = o.lines
    .map((l, i) => `<tr><td>${i + 1}</td><td>${l.name}<br/><small>${l.variantLabel}</small></td><td>${l.qty}</td><td>${inr(l.unitPrice)}</td><td>${l.gst}%</td><td>${inr(l.qty * l.unitPrice)}</td></tr>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${o.id}</title>
<style>body{font-family:-apple-system,Roboto,sans-serif;padding:24px;color:#13201C}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:13px}h1{color:#0E5E4F}</style></head>
<body><h1>TAX INVOICE</h1><p><b>StockPilot Distribution Pvt Ltd</b><br/>GSTIN 36AAACS7788P1Z3 · Begumpet, Hyderabad</p>
<p>Invoice no: INV-${o.id.slice(3)}<br/>Order: ${o.id}<br/>Date: ${fmtDate(o.createdAt)}</p>
<p>Billed to: <b>${business}</b><br/>GSTIN ${gstin || 'Unregistered'}<br/>${o.address.line1}, ${o.address.city} – ${o.address.pincode}</p>
<table><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>${rows}</table>
<p>Subtotal: ${inr(o.subtotal)}<br/>Discount: ${inr(o.discount)}<br/>GST: ${inr(o.gst)}<br/>Delivery: ${inr(o.delivery)}<br/><b>Total: ${inr(o.total)}</b></p>
<p><small>This is a computer generated invoice from the StockPilot demo app.</small></p></body></html>`;
}
