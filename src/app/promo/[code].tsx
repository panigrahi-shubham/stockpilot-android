import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';
import { COUPONS } from '@/data/seed';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, EmptyState } from '@/components/ui';

/** Deep-link landing: stockpilot://promo/DIWALI25 saves the coupon to the cart automatically. */
export default function Promo() {
  const { code = '' } = useLocalSearchParams<{ code: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const { state, actions } = useApp();
  const key = String(code).toUpperCase();
  const promo = COUPONS[key];

  useEffect(() => {
    if (promo) actions.setCoupon(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!promo)
    return (
      <Screen testID="promo-screen">
        <AppHeader testID="promo-header" title="Offer" />
        <EmptyState testID="promo-invalid" icon="pricetag-outline" title="This offer has expired" subtitle={`The code “${key}” is no longer valid. Check Home for current offers.`} action="Go to home" onAction={() => router.replace('/home')} />
      </Screen>
    );

  return (
    <Screen testID="promo-screen">
      <AppHeader testID="promo-header" title="Offer applied" />
      <View style={{ padding: 20, gap: 18 }}>
        <LinearGradient colors={['#B5446E', '#E8A13A']} style={{ borderRadius: radius.xl, padding: 24, alignItems: 'center', gap: 6 }}>
          <Ionicons name="gift-outline" size={42} color="#fff" />
          <Text testID="promo-code" style={[font.h1, { color: '#fff', letterSpacing: 3 }]}>
            {key}
          </Text>
          <Text testID="promo-description" style={[font.body, { color: '#fff', textAlign: 'center' }]}>
            {promo.label}
          </Text>
        </LinearGradient>
        <View testID="promo-applied-banner" style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.successSoft, alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={22} color={c.success} />
          <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>Saved to your cart. It will apply automatically once your cart qualifies.</Text>
        </View>
        <Button testID="promo-shop-button" title="Shop now" icon="arrow-forward" iconRight onPress={() => router.replace('/catalog')} />
        <Button testID="promo-cart-button" title={`Go to cart (${state.cart.length})`} variant="secondary" onPress={() => router.replace('/cart')} />
      </View>
    </Screen>
  );
}
