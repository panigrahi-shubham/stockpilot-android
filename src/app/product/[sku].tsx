import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { api, errorMessage } from '@/data/api';
import { PRODUCTS, Product, discountPct, unitPriceFor } from '@/data/catalog';
import { fmtDay, inr, validators } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, ProductArt, Screen } from '@/components/chrome';
import { Badge, Button, Card, Chip, ErrorState, IconButton, Skeleton, Stars, Stepper, TextField } from '@/components/ui';
import { ProductCard, StockLabel } from '@/components/ProductCard';
import { useToast } from '@/components/overlays';
import { EnquirySheet, ReviewsSection } from '@/components/ProductExtras';
import { lookupPincodeOnline } from '@/data/online';

export default function ProductDetail() {
  const { sku } = useLocalSearchParams<{ sku: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { state, actions } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState('single');
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinResult, setPinResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [enquiry, setEnquiry] = useState(false);
  const heart = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const load = async () => {
    setError(null);
    setProduct(null);
    try {
      const p = await api.product(String(sku));
      setProduct(p);
      setQty(p.moq);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku]);

  const similar = useMemo(() => (product ? PRODUCTS.filter((p) => p.category === product.category && p.sku !== product.sku).slice(0, 6) : []), [product]);

  if (error)
    return (
      <Screen testID="product-screen">
        <AppHeader testID="product-header" title="Product" />
        <ErrorState testID="product-error" message={error} onRetry={load} />
      </Screen>
    );

  if (!product)
    return (
      <Screen testID="product-screen">
        <AppHeader testID="product-header" title="Loading…" />
        <View testID="product-loading" style={{ padding: 16, gap: 14 }}>
          <Skeleton width="100%" height={width - 32} radius={20} />
          <Skeleton width="80%" height={22} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="60%" height={28} />
        </View>
      </Screen>
    );

  const p = product;
  const fav = state.favorites.includes(p.sku);
  const unit = unitPriceFor(p, variant, qty);
  const v = p.variants.find((x) => x.id === variant)!;
  const totalUnits = qty * v.multiplier;
  const maxPacks = Math.max(1, Math.floor(p.stock / v.multiplier));
  const activeTier = [...p.tiers].reverse().find((t) => totalUnits >= t.min) ?? p.tiers[0];
  const imgW = width - 32;

  const validateQty = () => {
    if (p.stock === 0) return 'This product is out of stock';
    if (totalUnits < p.moq) return `Minimum order quantity is ${p.moq} units`;
    if (totalUnits > p.stock) return `Only ${p.stock} units available`;
    return null;
  };

  const add = (buyNow: boolean) => {
    const err = validateQty();
    setQtyError(err);
    if (err) return;
    actions.addToCart(p.sku, variant, qty);
    if (buyNow) router.push('/cart');
    else toast.show(`Added ${qty} × ${v.label} to cart`, 'success', { label: 'VIEW CART', onPress: () => router.push('/cart') });
  };

  const toggleFav = (forceOn?: boolean) => {
    if (forceOn && fav) return;
    actions.toggleFavorite(p.sku);
    if (!fav) {
      heart.setValue(0);
      Animated.sequence([
        Animated.spring(heart, { toValue: 1, useNativeDriver: true }),
        Animated.timing(heart, { toValue: 0, duration: 300, delay: 300, useNativeDriver: true }),
      ]).start();
    }
    toast.show(fav ? 'Removed from favourites' : 'Added to favourites', 'success');
  };

  const onImagePress = (index: number) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      toggleFav(true); // double tap = like
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current === now) router.push({ pathname: '/image-viewer', params: { sku: p.sku, index: String(index) } });
    }, 300);
  };

  const checkPin = async () => {
    if (!validators.pincode(pin)) return setPinResult({ ok: false, text: 'Enter a valid 6-digit pincode' });
    setPinBusy(true);
    try {
      const r = await api.checkPincode(pin);
      // Live India Post lookup for the real locality name (falls back silently when offline).
      let place = r.city;
      let live = false;
      try {
        const po = await lookupPincodeOnline(pin);
        place = `${po[0].Name}, ${po[0].District}`;
        live = true;
      } catch {}
      if (!r.serviceable) setPinResult({ ok: false, text: `Sorry, we don’t deliver to ${pin}${place ? ` (${place})` : ''} yet.` });
      else setPinResult({ ok: true, text: `Delivery to ${place} by ${fmtDay(r.eta!)}. Free above ₹10,000.${live ? ' ✓ India Post' : ''}` });
    } catch (e) {
      setPinResult({ ok: false, text: errorMessage(e) });
    } finally {
      setPinBusy(false);
    }
  };

  return (
    <Screen testID="product-screen">
      <AppHeader
        testID="product-header"
        title={p.brand}
        right={
          <>
            <IconButton testID="product-favorite-button" label={fav ? 'Remove from favourites' : 'Add to favourites'} icon={fav ? 'heart' : 'heart-outline'} color={fav ? c.danger : c.text} onPress={() => toggleFav()} />
            <IconButton
              testID="product-compare-button"
              label={state.compare.includes(p.sku) ? 'Remove from compare' : 'Add to compare'}
              icon="git-compare-outline"
              color={state.compare.includes(p.sku) ? c.primary : c.text}
              badge={state.compare.length || undefined}
              onPress={() => {
                const had = state.compare.includes(p.sku);
                actions.toggleCompare(p.sku);
                toast.show(had ? 'Removed from compare' : 'Added to compare', 'success', had ? undefined : { label: 'COMPARE', onPress: () => router.push('/compare') });
              }}
            />
            <IconButton
              testID="product-share-button"
              label="Share product"
              icon="share-social-outline"
              onPress={() => Share.share({ message: `${p.name} – ${inr(p.price)} on StockPilot B2B\nstockpilot://product/${p.sku}` }).catch(() => {})}
            />
          </>
        }
      />
      <ScrollView testID="product-scroll" contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <FlatList
            testID="product-gallery"
            data={[0, 1, 2]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => String(i)}
            onMomentumScrollEnd={(e) => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / imgW))}
            getItemLayout={(_, i) => ({ length: imgW, offset: imgW * i, index: i })}
            renderItem={({ item }) => (
              <Pressable testID={`product-image-${item}`} accessibilityRole="imagebutton" accessibilityLabel={`Product image ${item + 1}. Double tap to like, tap to zoom`} onPress={() => onImagePress(item)}>
                <ProductArt product={p} size={imgW} angle={item} rounded={20} />
              </Pressable>
            )}
          />
          <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 16 + imgW / 2 - 50, left: 16 + imgW / 2 - 50, opacity: heart, transform: [{ scale: heart.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }] }}>
            <Ionicons name="heart" size={100} color="rgba(255,255,255,0.95)" />
          </Animated.View>
          <View style={{ position: 'absolute', right: 28, top: 28, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text testID="product-image-counter" style={[font.small, { color: '#fff', fontWeight: '700' }]}>
              {imgIdx + 1}/3
            </Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {p.tags.map((t) => (
                <Badge key={t} testID={`product-tag-${t}`} label={t === 'bestseller' ? 'Bestseller' : t === 'new' ? 'New arrival' : 'Hot deal'} tone={t === 'deal' ? 'danger' : t === 'new' ? 'info' : 'accent'} />
              ))}
            </View>
            <Text testID="product-title" style={[font.h2, { color: c.text, lineHeight: 26 }]}>
              {p.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Stars testID="product-rating" value={p.rating} />
              <Text style={[font.small, { color: c.textMuted }]}>
                {p.rating.toFixed(1)} · {p.ratingCount.toLocaleString('en-IN')} ratings
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text testID="product-sku" style={[font.small, { color: c.textMuted }]}>
                SKU {p.sku} · EAN {p.ean}
              </Text>
              <Pressable
                testID="product-sku-copy"
                accessibilityLabel="Copy SKU"
                hitSlop={8}
                onPress={async () => {
                  await Clipboard.setStringAsync(p.sku);
                  toast.show(`${p.sku} copied to clipboard`, 'success');
                }}
              >
                <Ionicons name="copy-outline" size={15} color={c.primary} />
              </Pressable>
            </View>
          </View>

          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <Text testID="product-price" style={[font.h1, { color: c.text }]}>
                {inr(unit)}
              </Text>
              <Text style={[font.body, { color: c.textMuted }]}>/ {v.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Text style={[font.small, { color: c.textFaint, textDecorationLine: 'line-through' }]}>MRP {inr(p.mrp * v.multiplier, { decimals: false })}</Text>
              <Text testID="product-discount" style={[font.small, { color: c.success, fontWeight: '800' }]}>
                {discountPct(p)}% below MRP
              </Text>
            </View>
            <Text style={[font.small, { color: c.textMuted }]}>+ {p.gst}% GST · Input credit available</Text>
            <StockLabel product={p} testID="product-stock" />
          </Card>

          <View>
            <Text style={[font.h3, { color: c.text, marginBottom: 8 }]}>Bulk pricing (per unit)</Text>
            <View testID="product-tier-table" style={{ borderRadius: radius.md, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
              {p.tiers.map((t, i) => {
                const active = t === activeTier;
                return (
                  <View
                    key={i}
                    testID={`product-tier-${i}${active ? '-active' : ''}`}
                    style={{ flexDirection: 'row', padding: 12, backgroundColor: active ? c.primarySoft : c.card, borderTopWidth: i ? 1 : 0, borderTopColor: c.border }}
                  >
                    <Text style={[font.body, { color: c.text, flex: 1, fontWeight: active ? '700' : '400' }]}>{t.max ? `${t.min} – ${t.max} units` : `${t.min}+ units`}</Text>
                    <Text style={[font.bodyStrong, { color: active ? c.primary : c.text }]}>{inr(t.price)}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={18} color={c.primary} style={{ marginLeft: 8 }} /> : <View style={{ width: 26 }} />}
                  </View>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={[font.h3, { color: c.text, marginBottom: 8 }]}>Pack size</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.variants.map((x) => (
                <Chip
                  key={x.id}
                  testID={`product-variant-${x.id}`}
                  label={x.extraDiscountPct ? `${x.label} · ${x.extraDiscountPct}% off` : x.label}
                  selected={variant === x.id}
                  onPress={() => {
                    setVariant(x.id);
                    setQty(x.multiplier >= p.moq ? 1 : Math.ceil(p.moq / x.multiplier));
                    setQtyError(null);
                  }}
                />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={[font.h3, { color: c.text }]}>Quantity</Text>
              <Text testID="product-moq-hint" style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
                MOQ {p.moq} units · {totalUnits} units selected
              </Text>
            </View>
            <Stepper
              testID="product-qty"
              value={qty}
              min={1}
              max={maxPacks}
              onChange={(n) => {
                setQty(n);
                setQtyError(null);
              }}
            />
          </View>
          {qtyError ? (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: -6 }}>
              <Ionicons name="alert-circle" size={15} color={c.danger} />
              <Text testID="product-qty-error" style={[font.small, { color: c.danger }]}>
                {qtyError}
              </Text>
            </View>
          ) : null}

          <Pressable testID="product-enquiry-button" accessibilityRole="button" onPress={() => setEnquiry(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.primary, backgroundColor: c.primarySoft }}>
            <Ionicons name="pricetags-outline" size={22} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[font.bodyStrong, { color: c.primary }]}>Buying in bulk? Get best price</Text>
              <Text style={[font.small, { color: c.textMuted }]}>Send your requirement — sellers reply with a quotation</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.primary} />
          </Pressable>

          <Card style={{ gap: 10 }}>
            <Text style={[font.h3, { color: c.text }]}>Check delivery</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <TextField
                testID="product-pincode-input"
                placeholder="Enter pincode"
                keyboardType="number-pad"
                maxLength={6}
                value={pin}
                onChangeText={(t) => {
                  setPin(t.replace(/[^0-9]/g, ''));
                  setPinResult(null);
                }}
                icon="location-outline"
                containerStyle={{ flex: 1 }}
              />
              <Button testID="product-pincode-check-button" title="Check" full={false} loading={pinBusy} onPress={checkPin} style={{ height: 50 }} />
            </View>
            {pinResult ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Ionicons name={pinResult.ok ? 'checkmark-circle' : 'close-circle'} size={16} color={pinResult.ok ? c.success : c.danger} />
                <Text testID="product-pincode-result" style={[font.small, { color: pinResult.ok ? c.success : c.danger, flex: 1 }]}>
                  {pinResult.text}
                </Text>
              </View>
            ) : null}
          </Card>

          <View>
            <Text style={[font.h3, { color: c.text, marginBottom: 6 }]}>About this product</Text>
            <Text testID="product-description" numberOfLines={expanded ? undefined : 3} style={[font.body, { color: c.textMuted, lineHeight: 21 }]}>
              {p.description}
            </Text>
            <Pressable testID="product-read-more" accessibilityRole="button" onPress={() => setExpanded((e) => !e)} hitSlop={6}>
              <Text style={[font.bodyStrong, { color: c.primary, marginTop: 6 }]}>{expanded ? 'Read less' : 'Read more'}</Text>
            </Pressable>
            <View style={{ marginTop: 12, gap: 8 }}>
              {p.highlights.map((h, i) => (
                <View key={i} testID={`product-highlight-${i}`} style={{ flexDirection: 'row', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={17} color={c.success} />
                  <Text style={[font.body, { color: c.text, flex: 1 }]}>{h}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.md, overflow: 'hidden' }}>
            <Pressable
              testID="product-specs-toggle"
              accessibilityRole="button"
              accessibilityState={{ expanded: specsOpen }}
              onPress={() => setSpecsOpen((o) => !o)}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: c.card }}
            >
              <Text style={[font.h3, { color: c.text, flex: 1 }]}>Specifications</Text>
              <Ionicons name={specsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={c.textMuted} />
            </Pressable>
            {specsOpen
              ? p.specs.map(([k, val], i) => (
                  <View key={k} testID={`product-spec-${i}`} style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.card }}>
                    <Text style={[font.body, { color: c.textMuted, width: 130 }]}>{k}</Text>
                    <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>{val}</Text>
                  </View>
                ))
              : null}
          </View>

          <ReviewsSection product={p} />

          <View>
            <Text style={[font.h3, { color: c.text, marginBottom: 10 }]}>Similar products</Text>
            <FlatList
              testID="product-similar-list"
              data={similar}
              horizontal
              keyExtractor={(x) => x.sku}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => <ProductCard product={item} layout="mini" width={160} />}
            />
          </View>
        </View>
      </ScrollView>

      <View
        testID="product-bottom-bar"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: c.card,
          borderTopWidth: 1,
          borderTopColor: c.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[font.small, { color: c.textMuted }]}>Total</Text>
          <Text testID="product-total" style={[font.h3, { color: c.text }]}>
            {inr(unit * qty)}
          </Text>
        </View>
        {p.stock === 0 ? (
          <Button testID="product-notify-button" title="Notify me" icon="notifications-outline" variant="outline" full={false} onPress={() => toast.show('We’ll notify you when it’s back in stock', 'info')} />
        ) : (
          <>
            <Button testID="product-add-to-cart-button" title="Add to cart" variant="outline" full={false} onPress={() => add(false)} />
            <Button testID="product-buy-now-button" title="Buy now" full={false} onPress={() => add(true)} />
          </>
        )}
      </View>
      <EnquirySheet product={p} visible={enquiry} onClose={() => setEnquiry(false)} />
    </Screen>
  );
}
