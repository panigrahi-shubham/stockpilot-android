import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { QuickListItem, useApp } from '@/state/AppContext';
import { PRODUCT_BY_SKU } from '@/data/catalog';
import { inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, ProductArt, Screen } from '@/components/chrome';
import { Button, EmptyState, Stepper } from '@/components/ui';
import { useToast } from '@/components/overlays';

const ROW_H = 96;

/**
 * Quick order list with drag-and-drop re-ordering.
 * Long-press (or press-and-drag) the ☰ handle on a row and move it up/down.
 * Each row shows its position (#1, #2 …) so tests can assert the new order.
 */
export default function QuickList() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const items = state.quickList.filter((q) => PRODUCT_BY_SKU[q.sku]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const from = useRef<number | null>(null);
  const hoverRef = useRef<number | null>(null);

  const startDrag = (i: number) => {
    from.current = i;
    hoverRef.current = i;
    dragY.setValue(0);
    setDragging(i);
    setHover(i);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };
  const moveDrag = (dy: number) => {
    if (from.current === null) return;
    dragY.setValue(dy);
    const h = Math.max(0, Math.min(items.length - 1, from.current + Math.round(dy / ROW_H)));
    if (h !== hoverRef.current) {
      hoverRef.current = h;
      setHover(h);
      Haptics.selectionAsync().catch(() => {});
    }
  };
  const endDrag = () => {
    const f = from.current;
    const h = hoverRef.current;
    from.current = null;
    setDragging(null);
    setHover(null);
    dragY.setValue(0);
    if (f === null || h === null || f === h) return;
    const next = [...items];
    const [moved] = next.splice(f, 1);
    next.splice(h, 0, moved);
    actions.setQuickList(next);
    toast.show(`Moved to position ${h + 1}`, 'info');
  };

  const positionOf = (i: number) => {
    if (dragging === null || hover === null || i === dragging) return i;
    if (dragging < hover && i > dragging && i <= hover) return i - 1;
    if (dragging > hover && i < dragging && i >= hover) return i + 1;
    return i;
  };

  const total = items.reduce((s, q) => s + PRODUCT_BY_SKU[q.sku].price * q.qty, 0);

  const addAll = () => {
    let n = 0;
    items.forEach((q) => {
      const p = PRODUCT_BY_SKU[q.sku];
      if (p.stock > 0) {
        actions.addToCart(q.sku, 'single', Math.max(q.qty, p.moq));
        n++;
      }
    });
    toast.show(`${n} of ${items.length} items added to cart`, n ? 'success' : 'error', { label: 'VIEW CART', onPress: () => router.push('/cart') });
  };

  const update = (sku: string, qty: number) => actions.setQuickList(items.map((q) => (q.sku === sku ? { ...q, qty } : q)));
  const remove = (sku: string) => actions.setQuickList(items.filter((q) => q.sku !== sku));

  return (
    <Screen testID="quick-list-screen">
      <AppHeader testID="quick-list-header" title="Quick order list" subtitle="Drag ☰ to set your re-order priority" />
      {items.length === 0 ? (
        <EmptyState testID="quick-list-empty" icon="flash-outline" title="Your quick list is empty" subtitle="Long-press any product in the catalogue and choose “Add to quick order list”." action="Open catalogue" onAction={() => router.navigate('/catalog')} />
      ) : (
        <>
          <ScrollView testID="quick-list-scroll" scrollEnabled={dragging === null} contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
            <View testID="quick-list-items" style={{ height: items.length * ROW_H }}>
              {items.map((q, i) => (
                <DraggableRow
                  key={q.sku}
                  item={q}
                  index={i}
                  position={positionOf(i)}
                  isDragging={dragging === i}
                  dragY={dragY}
                  onStart={() => startDrag(i)}
                  onMove={moveDrag}
                  onEnd={endDrag}
                  onQty={(v) => update(q.sku, v)}
                  onRemove={() => remove(q.sku)}
                />
              ))}
            </View>
          </ScrollView>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border, padding: 16, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[font.small, { color: c.textMuted }]}>{items.length} items · est.</Text>
              <Text testID="quick-list-total" style={[font.h3, { color: c.text }]}>
                {inr(total, { decimals: false })}
              </Text>
            </View>
            <Button testID="quick-list-add-all-button" title="Add all to cart" icon="cart-outline" full={false} onPress={addAll} />
          </View>
        </>
      )}
    </Screen>
  );
}

function DraggableRow({
  item,
  index,
  position,
  isDragging,
  dragY,
  onStart,
  onMove,
  onEnd,
  onQty,
  onRemove,
}: {
  item: QuickListItem;
  index: number;
  position: number;
  isDragging: boolean;
  dragY: Animated.Value;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: () => void;
  onQty: (v: number) => void;
  onRemove: () => void;
}) {
  const { c } = useTheme();
  const p = PRODUCT_BY_SKU[item.sku];
  const cb = useRef({ onStart, onMove, onEnd });
  cb.current = { onStart, onMove, onEnd };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => cb.current.onStart(),
        onPanResponderMove: (_e, g) => cb.current.onMove(g.dy),
        onPanResponderRelease: () => cb.current.onEnd(),
        onPanResponderTerminate: () => cb.current.onEnd(),
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  const top = position * ROW_H;
  return (
    <Animated.View
      testID={`quick-list-row-${item.sku}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: isDragging ? index * ROW_H : top,
        height: ROW_H - 10,
        zIndex: isDragging ? 10 : 1,
        elevation: isDragging ? 8 : 0,
        transform: isDragging ? [{ translateY: dragY }, { scale: 1.02 }] : [],
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.card, borderRadius: radius.lg, paddingHorizontal: 10, borderWidth: 1.5, borderColor: isDragging ? c.primary : c.border, shadowColor: '#000', shadowOpacity: isDragging ? 0.2 : 0, shadowRadius: 10 }}>
        <View
          testID={`quick-list-handle-${item.sku}`}
          accessibilityLabel={`Drag handle for ${p.name}`}
          accessibilityHint="Press and drag up or down to reorder"
          {...responder.panHandlers}
          style={{ width: 34, height: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="reorder-three-outline" size={26} color={isDragging ? c.primary : c.textFaint} />
        </View>
        <ProductArt product={p} size={52} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text testID={`quick-list-name-${item.sku}`} numberOfLines={1} style={[font.small, { color: c.text, fontWeight: '700' }]}>
            {p.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text testID={`quick-list-position-${item.sku}`} style={[font.tiny, { color: c.primary, backgroundColor: c.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
              #{index + 1}
            </Text>
            <Text style={[font.tiny, { color: c.textMuted, flex: 1 }]} numberOfLines={1}>
              {inr(p.price)}
            </Text>
            <Stepper compact testID={`quick-list-qty-${item.sku}`} value={item.qty} min={1} max={999} onChange={onQty} />
          </View>
        </View>
        <Pressable testID={`quick-list-remove-${item.sku}`} accessibilityLabel={`Remove ${p.name}`} hitSlop={6} onPress={onRemove}>
          <Ionicons name="close" size={18} color={c.textFaint} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
