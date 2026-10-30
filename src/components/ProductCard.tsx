import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { font, radius, useTheme } from '@/theme';
import { Product, discountPct } from '@/data/catalog';
import { useApp } from '@/state/AppContext';
import { inr } from '@/utils/format';
import { ProductArt } from './chrome';
import { Badge, Stepper } from './ui';
import { useToast } from './overlays';

export function StockLabel({ product, testID }: { product: Product; testID?: string }) {
  const { c } = useTheme();
  if (product.stock === 0)
    return (
      <Text testID={testID} style={[font.small, { color: c.danger, fontWeight: '700' }]}>
        Out of stock
      </Text>
    );
  if (product.stock < 12)
    return (
      <Text testID={testID} style={[font.small, { color: c.warning, fontWeight: '700' }]}>
        Only {product.stock} left
      </Text>
    );
  return (
    <Text testID={testID} style={[font.small, { color: c.success, fontWeight: '600' }]}>
      In stock
    </Text>
  );
}

export function ProductCard({
  product,
  layout,
  onLongPress,
  width,
}: {
  product: Product;
  layout: 'grid' | 'list' | 'mini';
  onLongPress?: (p: Product) => void;
  width?: number;
}) {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const inCart = state.cart.find((x) => x.sku === product.sku && x.variantId === 'single');
  const off = discountPct(product);
  const fav = state.favorites.includes(product.sku);
  const sku = product.sku;

  const add = () => {
    if (product.stock === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    actions.addToCart(sku, 'single', product.moq);
    toast.show(`Added ${product.moq} × ${product.name.split(' ').slice(-2).join(' ')} to cart`, 'success', {
      label: 'VIEW CART',
      onPress: () => router.push('/cart'),
    });
  };

  const buyArea = (
    <View style={{ marginTop: layout === 'list' ? 0 : 8 }}>
      {product.stock === 0 ? (
        <Pressable
          testID={`product-notify-${sku}`}
          accessibilityRole="button"
          onPress={() => toast.show('We’ll notify you when it’s back in stock', 'info')}
          style={{ height: 34, borderRadius: radius.sm, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }}
        >
          <Text style={[font.small, { color: c.textMuted, fontWeight: '800' }]}>NOTIFY ME</Text>
        </Pressable>
      ) : inCart ? (
        <Stepper
          compact
          fill={layout !== 'list'}
          testID={`product-qty-${sku}`}
          value={inCart.qty}
          min={0}
          max={product.stock}
          onChange={(v) => actions.setCartQty(sku, 'single', v < product.moq ? 0 : v)}
        />
      ) : (
        <Pressable
          testID={`product-add-${sku}`}
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
          onPress={add}
          style={({ pressed }) => ({
            height: 34,
            borderRadius: radius.sm,
            borderWidth: 1.5,
            borderColor: c.primary,
            backgroundColor: pressed ? c.primary : c.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 4,
            paddingHorizontal: 14,
          })}
        >
          <Ionicons name="add" size={16} color={c.primary} />
          <Text style={[font.small, { color: c.primary, fontWeight: '800' }]}>ADD</Text>
        </Pressable>
      )}
    </View>
  );

  const price = (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
      <Text testID={`product-price-${sku}`} style={[font.h3, { color: c.text }]}>
        {inr(product.price)}
      </Text>
      <Text style={[font.small, { color: c.textFaint }]}>
        MRP <Text style={{ textDecorationLine: 'line-through' }}>{inr(product.mrp, { decimals: false })}</Text>
      </Text>
      {off > 0 ? <Text style={[font.small, { color: c.success, fontWeight: '800' }]}>{off}% off</Text> : null}
    </View>
  );

  if (layout === 'list') {
    return (
      <View testID={`product-card-${sku}`} style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 12, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: c.border }}>
        <Pressable
          testID={`product-card-${sku}-open`}
          accessibilityRole="button"
          accessibilityLabel={product.name}
          onPress={() => router.push(`/product/${sku}`)}
          onLongPress={() => onLongPress?.(product)}
          delayLongPress={450}
          style={{ flexDirection: 'row', gap: 12, flex: 1 }}
        >
          <ProductArt product={product} size={84} />
          <View style={{ flex: 1 }}>
            <Text testID={`product-name-${sku}`} numberOfLines={2} style={[font.bodyStrong, { color: c.text }]}>
              {product.name}
            </Text>
            <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
              {product.unit} · MOQ {product.moq}
            </Text>
            {price}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <StockLabel product={product} testID={`product-stock-${sku}`} />
            </View>
          </View>
        </Pressable>
        <View style={{ justifyContent: 'flex-end' }}>{buyArea}</View>
      </View>
    );
  }

  return (
    <View
      testID={`product-card-${sku}`}
      style={{ width, backgroundColor: c.card, borderRadius: radius.lg, padding: 10, borderWidth: 1, borderColor: c.border, flex: layout === 'grid' ? 1 : undefined }}
    >
      <Pressable
        testID={`product-card-${sku}-open`}
        accessibilityRole="button"
        accessibilityLabel={product.name}
        onPress={() => router.push(`/product/${sku}`)}
        onLongPress={() => onLongPress?.(product)}
        delayLongPress={450}
      >
        <View>
          <ProductArt product={product} size={(width ?? 160) - 20} />
          <View style={{ position: 'absolute', top: 6, left: 6, gap: 4 }}>
            {product.tags.includes('bestseller') ? <Badge label="Bestseller" tone="accent" /> : null}
            {product.tags.includes('new') ? <Badge label="New" tone="info" /> : null}
          </View>
          {fav ? (
            <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 3 }}>
              <Ionicons testID={`product-fav-icon-${sku}`} name="heart" size={14} color={c.danger} />
            </View>
          ) : null}
        </View>
        <Text testID={`product-name-${sku}`} numberOfLines={2} style={[font.bodyStrong, { color: c.text, marginTop: 8, minHeight: 38 }]}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
          {product.unit}
        </Text>
        {price}
        <View style={{ marginTop: 3 }}>
          <StockLabel product={product} testID={`product-stock-${sku}`} />
        </View>
      </Pressable>
      {buyArea}
    </View>
  );
}
