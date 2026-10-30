import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRODUCT_BY_SKU } from '@/data/catalog';
import { ProductArt } from '@/components/chrome';
import { font } from '@/theme';

const MIN = 1;
const MAX = 4;

/**
 * Full-screen image viewer.
 *  - Pinch with two fingers to zoom (1× – 4×)
 *  - Drag to pan when zoomed
 *  - Double-tap to toggle 1× / 2.5×
 * The current zoom is printed in "image-viewer-zoom-level" so tests can assert gestures worked.
 */
export default function ImageViewer() {
  const { sku, index } = useLocalSearchParams<{ sku: string; index?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const product = PRODUCT_BY_SKU[String(sku)];
  const [img, setImg] = useState(Number(index ?? 0));
  const [zoom, setZoom] = useState(1);

  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const s = useRef({ base: 1, cur: 1, startDist: 0, bx: 0, by: 0, cx: 0, cy: 0, lastTap: 0, moved: false });

  const apply = (next: number, x: number, y: number, animate = false) => {
    s.current.cur = next;
    s.current.cx = x;
    s.current.cy = y;
    setZoom(Math.round(next * 10) / 10);
    if (animate) {
      Animated.parallel([
        Animated.spring(scale, { toValue: next, useNativeDriver: true }),
        Animated.spring(tx, { toValue: x, useNativeDriver: true }),
        Animated.spring(ty, { toValue: y, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(next);
      tx.setValue(x);
      ty.setValue(y);
    }
  };

  const reset = () => {
    s.current.base = 1;
    apply(1, 0, 0, true);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          s.current.moved = false;
          s.current.bx = s.current.cx;
          s.current.by = s.current.cy;
          const t = e.nativeEvent.touches;
          if (t.length === 2) s.current.startDist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        },
        onPanResponderMove: (e, g) => {
          const t = e.nativeEvent.touches;
          if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) s.current.moved = true;
          if (t.length === 2) {
            const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
            if (!s.current.startDist) {
              s.current.startDist = d;
              return;
            }
            const next = Math.max(MIN * 0.8, Math.min(MAX, s.current.base * (d / s.current.startDist)));
            apply(next, s.current.cx, s.current.cy);
          } else if (t.length === 1 && s.current.cur > 1) {
            const limit = ((s.current.cur - 1) * width) / 2;
            apply(s.current.cur, Math.max(-limit, Math.min(limit, s.current.bx + g.dx)), Math.max(-limit, Math.min(limit, s.current.by + g.dy)));
          }
        },
        onPanResponderRelease: () => {
          s.current.startDist = 0;
          s.current.base = Math.max(MIN, s.current.cur);
          if (s.current.cur < MIN) {
            reset();
            return;
          }
          if (!s.current.moved) {
            const now = Date.now();
            if (now - s.current.lastTap < 280) {
              s.current.lastTap = 0;
              if (s.current.cur > 1.2) reset();
              else {
                s.current.base = 2.5;
                apply(2.5, 0, 0, true);
              }
            } else s.current.lastTap = now;
          }
        },
        onPanResponderTerminationRequest: () => false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width],
  );

  if (!product) return null;

  const go = (d: number) => {
    reset();
    setImg((i) => (i + d + 3) % 3);
  };

  return (
    <View testID="image-viewer-screen" style={{ flex: 1, backgroundColor: '#050807' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', zIndex: 2 }}>
        <Pressable testID="image-viewer-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text numberOfLines={1} style={[font.bodyStrong, { color: '#fff', flex: 1, marginLeft: 6 }]}>
          {product.name}
        </Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <Text testID="image-viewer-zoom-level" style={[font.small, { color: '#fff', fontWeight: '800' }]}>
            {zoom.toFixed(1)}×
          </Text>
        </View>
      </View>

      <View testID="image-viewer-canvas" {...responder.panHandlers} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Animated.View style={{ transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}>
          <ProductArt product={product} size={width - 24} angle={img} rounded={8} />
        </Animated.View>
      </View>

      <View style={{ paddingBottom: insets.bottom + 18, alignItems: 'center', gap: 14 }}>
        <Text style={[font.small, { color: 'rgba(255,255,255,0.6)' }]}>Pinch to zoom · Double-tap to toggle zoom</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <Pressable testID="image-viewer-prev" accessibilityLabel="Previous image" onPress={() => go(-1)} style={{ padding: 10 }}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <Text testID="image-viewer-counter" style={[font.bodyStrong, { color: '#fff' }]}>
            {img + 1} / 3
          </Text>
          <Pressable testID="image-viewer-next" accessibilityLabel="Next image" onPress={() => go(1)} style={{ padding: 10 }}>
            <Ionicons name="chevron-forward" size={26} color="#fff" />
          </Pressable>
          <Pressable testID="image-viewer-reset" accessibilityLabel="Reset zoom" onPress={reset} style={{ padding: 10 }}>
            <Ionicons name="contract-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
