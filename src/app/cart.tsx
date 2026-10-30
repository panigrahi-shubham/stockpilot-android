import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { CartLine, FREE_DELIVERY_ABOVE, MIN_ORDER_VALUE, cartSummary, couponCheck, isGlitch } from '@/state/cart';
import { COUPONS } from '@/data/seed';
import { inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, ProductArt, Screen } from '@/components/chrome';
import { Button, Card, Divider, EmptyState, ProgressBar, Row, Stepper, TextField } from '@/components/ui';
import { ConfirmDialog, useToast } from '@/components/overlays';

export default function Cart() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const sum = cartSummary(state);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [offersOpen, setOffersOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const kycBlocked = state.user?.kyc !== 'verified';

  const applyCode = (raw: string) => {
    const k = raw.trim().toUpperCase();
    if (!k) return setCodeError('Enter a coupon code');
    const chk = couponCheck(k, sum.subtotal, state);
    if (!chk.ok) return setCodeError(chk.error);
    setCodeError(null);
    setCode('');
    actions.setCoupon(k);
    toast.show(`Coupon ${k} applied`, 'success');
  };

  if (!sum.lineCount) {
    return (
      <Screen testID="cart-screen">
        <AppHeader testID="cart-header" title="Your cart" showCart={false} />
        <EmptyState
          testID="cart-empty"
          icon="cart-outline"
          title="Your cart is empty"
          subtitle="Add products from the catalogue or reorder from your past orders."
          action="Browse catalogue"
          onAction={() => router.navigate('/catalog')}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="cart-screen">
      <AppHeader
        testID="cart-header"
        title="Your cart"
        subtitle={`${sum.lineCount} products · ${sum.itemCount} packs`}
        showCart={false}
        right={
          <Pressable testID="cart-clear-button" accessibilityRole="button" onPress={() => setConfirmClear(true)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={[font.small, { color: c.danger, fontWeight: '800' }]}>Clear</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView testID="cart-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 140 }}>
          {sum.subtotal < FREE_DELIVERY_ABOVE ? (
            <View testID="cart-free-delivery-progress" style={{ gap: 6 }}>
              <Text style={[font.small, { color: c.text }]}>
                Add <Text style={{ fontWeight: '800' }}>{inr(FREE_DELIVERY_ABOVE - sum.subtotal, { decimals: false })}</Text> more for <Text style={{ color: c.success, fontWeight: '800' }}>FREE delivery</Text>
              </Text>
              <ProgressBar value={sum.subtotal / FREE_DELIVERY_ABOVE} color={c.success} />
            </View>
          ) : (
            <View testID="cart-free-delivery-unlocked" style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={16} color={c.success} />
              <Text style={[font.small, { color: c.success, fontWeight: '700' }]}>You’ve unlocked free delivery</Text>
            </View>
          )}

          <Text style={[font.small, { color: c.textFaint }]}>Tip: swipe an item left to delete, right to save it for later.</Text>
          {sum.lines.map((l) => (
            <CartRow key={`${l.sku}-${l.variantId}`} line={l} step={isGlitch(state) ? 2 : 1} />
          ))}

          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="pricetag-outline" size={18} color={c.primary} />
              <Text style={[font.h3, { color: c.text, flex: 1 }]}>Coupons & offers</Text>
              <Pressable testID="cart-offers-toggle" accessibilityRole="button" onPress={() => setOffersOpen((o) => !o)}>
                <Text style={[font.small, { color: c.primary, fontWeight: '700' }]}>{offersOpen ? 'Hide offers' : 'View offers'}</Text>
              </Pressable>
            </View>
            {state.coupon ? (
              <View testID="cart-coupon-applied" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: sum.couponError ? c.dangerSoft : c.successSoft }}>
                <Ionicons name={sum.couponError ? 'alert-circle' : 'checkmark-circle'} size={20} color={sum.couponError ? c.danger : c.success} />
                <View style={{ flex: 1 }}>
                  <Text testID="cart-coupon-code" style={[font.bodyStrong, { color: c.text }]}>
                    {state.coupon}
                  </Text>
                  <Text testID="cart-coupon-status" style={[font.small, { color: sum.couponError ? c.danger : c.success }]}>
                    {sum.couponError ?? `You save ${inr(sum.couponDiscount)}`}
                  </Text>
                </View>
                <Pressable testID="cart-coupon-remove" accessibilityLabel="Remove coupon" onPress={() => actions.setCoupon(null)} hitSlop={8}>
                  <Text style={[font.small, { color: c.danger, fontWeight: '800' }]}>REMOVE</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <TextField
                  testID="cart-coupon-input"
                  placeholder="Enter coupon code"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={code}
                  onChangeText={(t) => {
                    setCode(t);
                    setCodeError(null);
                  }}
                  error={codeError}
                  containerStyle={{ flex: 1 }}
                  onSubmitEditing={() => applyCode(code)}
                />
                <Button testID="cart-coupon-apply-button" title="Apply" full={false} variant="outline" onPress={() => applyCode(code)} style={{ height: 50 }} />
              </View>
            )}
            {offersOpen ? (
              <View testID="cart-offers-list" style={{ gap: 8 }}>
                {Object.entries(COUPONS).map(([k, o]) => (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[font.bodyStrong, { color: c.text, letterSpacing: 1 }]}>{k}</Text>
                      <Text style={[font.small, { color: c.textMuted }]}>{o.label}</Text>
                    </View>
                    <Pressable testID={`cart-offer-apply-${k}`} onPress={() => applyCode(k)}>
                      <Text style={[font.small, { color: c.primary, fontWeight: '800' }]}>APPLY</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          <Card testID="cart-summary" style={{ gap: 2 }}>
            <Text style={[font.h3, { color: c.text, marginBottom: 6 }]}>Price details</Text>
            <Row label={`Subtotal (${sum.itemCount} packs)`} value={inr(sum.subtotal)} testID="cart-subtotal" />
            {sum.couponDiscount ? <Row label="Coupon discount" value={`– ${inr(sum.couponDiscount)}`} testID="cart-coupon-discount" valueColor={c.success} /> : null}
            <Row label="GST" value={inr(sum.gst)} testID="cart-gst" />
            <Row label="Delivery" value={sum.delivery ? inr(sum.delivery) : 'FREE'} testID="cart-delivery" valueColor={sum.delivery ? undefined : c.success} />
            <Divider />
            <Row label="Total payable" value={inr(sum.total)} testID="cart-total" bold />
            <Text testID="cart-savings" style={[font.small, { color: c.success, fontWeight: '700', marginTop: 6 }]}>
              You save {inr(sum.savings, { decimals: false })} vs MRP on this order
            </Text>
          </Card>

          {!sum.minOrderOk ? (
            <Notice testID="cart-min-order-warning" tone="warning" icon="information-circle-outline" text={`Minimum order value is ${inr(MIN_ORDER_VALUE, { decimals: false })}. Add ${inr(sum.shortBy, { decimals: false })} more to checkout.`} />
          ) : null}
          {kycBlocked ? <Notice testID="cart-kyc-warning" tone="danger" icon="document-lock-outline" text="Complete KYC to place orders. Upload your GST certificate and PAN from Account → KYC." /> : null}
          {!kycBlocked && sum.total > sum.availableCredit ? (
            <Notice testID="cart-credit-warning" tone="warning" icon="wallet-outline" text={`Order exceeds your available credit (${inr(sum.availableCredit, { decimals: false })}). You can still pay by UPI or NEFT.`} />
          ) : null}
          {sum.needsApproval ? <Notice testID="cart-approval-notice" tone="info" icon="people-outline" text="Orders above ₹50,000 need your manager’s approval before they are confirmed." /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border, padding: 16, paddingBottom: insets.bottom + 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Text testID="cart-bottom-total" style={[font.h2, { color: c.text }]}>
            {inr(sum.total)}
          </Text>
          <Text style={[font.small, { color: c.textMuted }]}>incl. GST</Text>
        </View>
        <Button testID="cart-checkout-button" title="Checkout" icon="arrow-forward" iconRight full={false} disabled={!sum.minOrderOk || kycBlocked} onPress={() => router.push('/checkout')} style={{ paddingHorizontal: 28 }} />
      </View>

      <ConfirmDialog
        testID="clear-cart-dialog"
        visible={confirmClear}
        title="Clear cart?"
        message={`All ${sum.lineCount} products will be removed from your cart. This can’t be undone.`}
        confirmLabel="Clear cart"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          actions.clearCart();
          setConfirmClear(false);
          toast.show('Cart cleared', 'info');
        }}
      />
    </Screen>
  );
}

function Notice({ testID, tone, icon, text }: { testID: string; tone: 'warning' | 'danger' | 'info'; icon: any; text: string }) {
  const { c } = useTheme();
  const bg = tone === 'warning' ? c.warningSoft : tone === 'danger' ? c.dangerSoft : c.infoSoft;
  const fg = tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : c.info;
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: bg }}>
      <Ionicons name={icon} size={18} color={fg} />
      <Text testID={`${testID}-text`} style={[font.small, { color: c.text, flex: 1, lineHeight: 18 }]}>
        {text}
      </Text>
    </View>
  );
}

function CartRow({ line: l, step }: { line: CartLine; step: number }) {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { actions } = useApp();
  const id = `${l.sku}-${l.variantId}`;
  const remove = () => {
    actions.removeFromCart(l.sku, l.variantId);
    toast.show(`Removed ${l.product.name}`, 'info', { label: 'UNDO', onPress: () => actions.addToCart(l.sku, l.variantId, l.qty) });
  };
  return (
    <Swipeable
      friction={2}
      rightThreshold={60}
      leftThreshold={60}
      renderRightActions={() => (
        <Pressable testID={`cart-item-delete-${id}`} accessibilityLabel="Delete item" onPress={remove} style={{ width: 96, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, marginLeft: 8 }}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={[font.small, { color: '#fff', fontWeight: '800', marginTop: 4 }]}>Delete</Text>
        </Pressable>
      )}
      renderLeftActions={() => (
        <Pressable
          testID={`cart-item-save-${id}`}
          accessibilityLabel="Save for later"
          onPress={() => {
            actions.addToQuickList(l.sku, l.qty);
            actions.removeFromCart(l.sku, l.variantId);
            toast.show('Moved to quick order list', 'success');
          }}
          style={{ width: 96, backgroundColor: c.info, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, marginRight: 8 }}
        >
          <Ionicons name="bookmark-outline" size={22} color="#fff" />
          <Text style={[font.small, { color: '#fff', fontWeight: '800', marginTop: 4 }]}>Save</Text>
        </Pressable>
      )}
    >
      <View testID={`cart-item-${id}`} style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: c.border, flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => router.push(`/product/${l.sku}`)}>
          <ProductArt product={l.product} size={72} />
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Text testID={`cart-item-name-${id}`} numberOfLines={2} style={[font.bodyStrong, { color: c.text }]}>
            {l.product.name}
          </Text>
          <Text testID={`cart-item-variant-${id}`} style={[font.small, { color: c.textMuted }]}>
            {l.variant.label} · {inr(l.unitPrice)} each
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Stepper compact testID={`cart-item-qty-${id}`} value={l.qty} min={0} max={Math.max(1, Math.floor(l.product.stock / l.variant.multiplier))} step={step} onChange={(v) => (v === 0 ? remove() : actions.setCartQty(l.sku, l.variantId, v))} />
            <Text testID={`cart-item-line-total-${id}`} style={[font.h3, { color: c.text }]}>
              {inr(l.lineTotal)}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}
