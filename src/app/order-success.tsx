import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Modal, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { fmtDay, inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { Button, Stars } from '@/components/ui';
import { useToast } from '@/components/overlays';

export default function OrderSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const order = state.orders.find((o) => o.id === id);
  const pop = useRef(new Animated.Value(0)).current;
  const [rate, setRate] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/home');
      return true;
    });
    let t: ReturnType<typeof setTimeout> | undefined;
    if (state.placedOrders >= 2 && !state.appRated) t = setTimeout(() => setRate(true), 1800);
    return () => {
      sub.remove();
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) return null;
  const pending = order.status === 'pending_approval';

  return (
    <View testID="order-success-screen" style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 50, paddingHorizontal: 24, alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ scale: pop }], width: 120, height: 120, borderRadius: 60, backgroundColor: pending ? c.warningSoft : c.successSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={pending ? 'hourglass-outline' : 'checkmark-circle'} size={86} color={pending ? c.warning : c.success} />
      </Animated.View>
      <Text testID="order-success-title" style={[font.h1, { color: c.text, marginTop: 24, textAlign: 'center' }]}>
        {pending ? 'Sent for approval' : 'Order placed!'}
      </Text>
      <Text testID="order-success-message" style={[font.body, { color: c.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 21 }]}>
        {pending
          ? 'Your manager has been notified. We’ll confirm the order as soon as it’s approved.'
          : `Thank you! Expected delivery on ${fmtDay(order.deliveryDate)}, ${order.slot.split(' (')[0].toLowerCase()}.`}
      </Text>

      <View style={{ marginTop: 26, width: '100%', backgroundColor: c.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: c.border, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[font.small, { color: c.textMuted, flex: 1 }]}>Order ID</Text>
          <Text testID="order-success-id" selectable style={[font.bodyStrong, { color: c.text }]}>
            {order.id}
          </Text>
          <Pressable
            testID="order-success-copy"
            accessibilityLabel="Copy order ID"
            hitSlop={8}
            onPress={async () => {
              await Clipboard.setStringAsync(order.id);
              toast.show('Order ID copied', 'success');
            }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="copy-outline" size={17} color={c.primary} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[font.small, { color: c.textMuted, flex: 1 }]}>Amount</Text>
          <Text testID="order-success-amount" style={[font.bodyStrong, { color: c.text }]}>
            {inr(order.total)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[font.small, { color: c.textMuted, flex: 1 }]}>Items</Text>
          <Text testID="order-success-items" style={[font.bodyStrong, { color: c.text }]}>
            {order.lines.length} products
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ width: '100%', gap: 10, paddingBottom: insets.bottom + 20 }}>
        <Button testID="order-success-track-button" title="Track order" icon="navigate-outline" onPress={() => router.replace(`/order/${order.id}`)} />
        <Button testID="order-success-continue-button" title="Continue shopping" variant="secondary" onPress={() => router.replace('/home')} />
      </View>

      <Modal visible={rate} transparent animationType="fade" onRequestClose={() => setRate(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View testID="rate-app-dialog" style={{ backgroundColor: c.card, borderRadius: radius.xl, padding: 24, width: '100%', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 40 }}>🙌</Text>
            <Text style={[font.h2, { color: c.text, textAlign: 'center' }]}>Enjoying StockPilot?</Text>
            <Text style={[font.body, { color: c.textMuted, textAlign: 'center' }]}>Your rating helps other retailers find us.</Text>
            <Stars testID="rate-app-stars" value={stars} size={34} onChange={setStars} />
            <Button
              testID="rate-app-submit"
              title="Submit"
              disabled={!stars}
              onPress={() => {
                actions.setAppRated();
                setRate(false);
                toast.show(stars >= 4 ? 'Thank you for the love! 💚' : 'Thanks! We’ll keep improving.', 'success');
              }}
            />
            <Pressable testID="rate-app-later" onPress={() => setRate(false)}>
              <Text style={[font.bodyStrong, { color: c.textMuted }]}>Maybe later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
