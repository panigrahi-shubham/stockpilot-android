import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';
import { PRODUCT_BY_SKU, Product, discountPct } from '@/data/catalog';
import { inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, ProductArt, Screen } from '@/components/chrome';
import { Button, EmptyState, Stars } from '@/components/ui';
import { useToast } from '@/components/overlays';

const COL = 150;
const LABEL = 118;

type RowDef = { id: string; label: string; get: (p: Product) => string; best?: (ps: Product[]) => string | null };

const ROWS: RowDef[] = [
  { id: 'price', label: 'Price / pack', get: (p) => inr(p.price), best: (ps) => [...ps].sort((a, b) => a.price - b.price)[0]?.sku ?? null },
  { id: 'mrp', label: 'MRP', get: (p) => inr(p.mrp, { decimals: false }) },
  { id: 'discount', label: 'Discount', get: (p) => `${discountPct(p)}%`, best: (ps) => [...ps].sort((a, b) => discountPct(b) - discountPct(a))[0]?.sku ?? null },
  { id: 'bulk', label: '50+ units price', get: (p) => inr(p.tiers[2].price) },
  { id: 'moq', label: 'MOQ', get: (p) => `${p.moq} units` },
  { id: 'pack', label: 'Pack size', get: (p) => p.unit },
  { id: 'gst', label: 'GST', get: (p) => `${p.gst}%` },
  { id: 'rating', label: 'Rating', get: (p) => `${p.rating.toFixed(1)} ★ (${p.ratingCount})`, best: (ps) => [...ps].sort((a, b) => b.rating - a.rating)[0]?.sku ?? null },
  { id: 'stock', label: 'Stock', get: (p) => (p.stock === 0 ? 'Out of stock' : p.stock < 12 ? `Only ${p.stock}` : 'In stock') },
  { id: 'lead', label: 'Delivery', get: (p) => `${p.leadTimeDays}–4 days` },
  { id: 'brand', label: 'Brand', get: (p) => p.brand },
];

/** Side-by-side comparison of up to 3 products (add from Catalog long-press or Product page). */
export default function Compare() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const products = state.compare.map((s) => PRODUCT_BY_SKU[s]).filter(Boolean);

  if (!products.length)
    return (
      <Screen testID="compare-screen">
        <AppHeader testID="compare-header" title="Compare products" />
        <EmptyState testID="compare-empty" icon="git-compare-outline" title="Nothing to compare" subtitle="Long-press a product in the catalogue and choose “Add to compare”. You can compare up to 3." action="Browse catalogue" onAction={() => router.navigate('/catalog')} />
      </Screen>
    );

  return (
    <Screen testID="compare-screen">
      <AppHeader
        testID="compare-header"
        title="Compare products"
        subtitle={`${products.length} of 3 selected`}
        right={
          <Pressable testID="compare-clear-button" accessibilityRole="button" onPress={() => { actions.clearCompare(); toast.show('Comparison cleared', 'info'); }} style={{ paddingHorizontal: 10 }}>
            <Text style={[font.small, { color: c.danger, fontWeight: '800' }]}>Clear</Text>
          </Pressable>
        }
      />
      <ScrollView testID="compare-scroll" contentContainerStyle={{ paddingBottom: 40 }}>
        <ScrollView testID="compare-table-scroll" horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View testID="compare-table" style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: LABEL }} />
              {products.map((p) => (
                <View key={p.sku} testID={`compare-column-${p.sku}`} style={{ width: COL, paddingHorizontal: 6, gap: 6 }}>
                  <Pressable onPress={() => router.push(`/product/${p.sku}`)}>
                    <ProductArt product={p} size={COL - 12} />
                  </Pressable>
                  <Text testID={`compare-name-${p.sku}`} numberOfLines={3} style={[font.small, { color: c.text, fontWeight: '700', minHeight: 48 }]}>
                    {p.name}
                  </Text>
                  <Stars value={p.rating} size={12} />
                  <Pressable testID={`compare-remove-${p.sku}`} accessibilityRole="button" onPress={() => actions.toggleCompare(p.sku)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="close-circle-outline" size={15} color={c.danger} />
                    <Text style={[font.small, { color: c.danger, fontWeight: '700' }]}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            {ROWS.map((r, ri) => {
              const best = r.best?.(products);
              return (
                <View key={r.id} testID={`compare-row-${r.id}`} style={{ flexDirection: 'row', backgroundColor: ri % 2 ? 'transparent' : c.cardAlt, borderRadius: radius.sm, marginTop: ri ? 2 : 14 }}>
                  <Text style={[font.small, { width: LABEL, padding: 10, color: c.textMuted, fontWeight: '700' }]}>{r.label}</Text>
                  {products.map((p) => {
                    const isBest = products.length > 1 && best === p.sku;
                    return (
                      <View key={p.sku} style={{ width: COL, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text testID={`compare-cell-${r.id}-${p.sku}`} style={[font.small, { color: isBest ? c.success : c.text, fontWeight: isBest ? '800' : '500', flexShrink: 1 }]}>
                          {r.get(p)}
                        </Text>
                        {isBest ? <Ionicons testID={`compare-best-${r.id}`} name="trophy" size={12} color={c.success} /> : null}
                      </View>
                    );
                  })}
                </View>
              );
            })}
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <View style={{ width: LABEL }} />
              {products.map((p) => (
                <View key={p.sku} style={{ width: COL, paddingHorizontal: 6 }}>
                  <Button
                    testID={`compare-add-${p.sku}`}
                    title="Add"
                    size="sm"
                    icon="cart-outline"
                    disabled={p.stock === 0}
                    onPress={() => {
                      actions.addToCart(p.sku, 'single', p.moq);
                      toast.show(`Added ${p.moq} to cart`, 'success');
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        {products.length < 3 ? (
          <Text testID="compare-hint" style={[font.small, { color: c.textMuted, textAlign: 'center', paddingHorizontal: 24 }]}>
            Add {3 - products.length} more product{3 - products.length > 1 ? 's' : ''} from the catalogue to compare side by side.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
