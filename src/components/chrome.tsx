import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from 'expo-router/react-navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { font, radius, useTheme } from '@/theme';
import { useApp } from '@/state/AppContext';
import { IconButton } from './ui';
import { useOnline } from '@/state/network';
import type { Product } from '@/data/catalog';

/* ================================================================== Header */
export function AppHeader({
  title,
  subtitle,
  testID,
  mode = 'back',
  showCart = true,
  showBell = false,
  showMessages = false,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  testID: string;
  mode?: 'back' | 'menu' | 'close' | 'none';
  showCart?: boolean;
  showBell?: boolean;
  showMessages?: boolean;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const { c, mode: scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { state } = useApp();
  const cartCount = state.cart.reduce((s, x) => s + x.qty, 0);
  const unread = state.notifications.filter((n) => !n.read).length;
  const unreadChats = state.conversations.filter((x) => !x.archived).reduce((n, x) => n + x.unread, 0);

  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <View style={{ backgroundColor: c.card, paddingTop: insets.top, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View testID={testID} style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 }}>
        {mode === 'menu' ? (
          <IconButton testID="header-menu-button" label="Open menu" icon="menu" onPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
        ) : mode === 'back' ? (
          <IconButton testID="header-back-button" label="Go back" icon="arrow-back" onPress={goBack} />
        ) : mode === 'close' ? (
          <IconButton testID="header-close-button" label="Close" icon="close" onPress={goBack} />
        ) : (
          <View style={{ width: 12 }} />
        )}
        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <Text testID="header-title" numberOfLines={1} style={[font.h3, { color: c.text, fontSize: 17 }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text testID="header-subtitle" numberOfLines={1} style={[font.small, { color: c.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
        {showMessages ? (
          <IconButton testID="header-messages-button" label="Messages" icon="chatbubble-ellipses-outline" badge={unreadChats} onPress={() => router.push('/messages')} />
        ) : null}
        {showBell ? (
          <IconButton testID="header-notifications-button" label="Notifications" icon="notifications-outline" badge={unread} onPress={() => router.push('/notifications')} />
        ) : null}
        {showCart ? (
          <IconButton testID="header-cart-button" label="Cart" icon="cart-outline" badge={cartCount} onPress={() => router.push('/cart')} />
        ) : null}
      </View>
      <OfflineBanner />
    </View>
  );
}

export function OfflineBanner() {
  const { actions } = useApp();
  const { realOffline, simulatedOffline } = useOnline();
  if (!realOffline && !simulatedOffline) return null;
  return (
    <View testID="offline-banner" accessibilityLiveRegion="assertive" style={{ backgroundColor: '#3A3F3D', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 8 }}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text testID="offline-banner-text" style={[font.small, { color: '#fff', flex: 1 }]}>
        {realOffline ? 'No internet connection. Check Wi-Fi or mobile data.' : 'Offline mode (QA Lab simulation).'}
      </Text>
      {simulatedOffline && !realOffline ? (
        <Pressable testID="offline-banner-retry" onPress={() => actions.setQa({ offline: false })} hitSlop={6}>
          <Text style={[font.small, { color: '#F5B547', fontWeight: '800' }]}>GO ONLINE</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ================================================================== Screen wrapper */
export function Screen({ children, testID }: { children: React.ReactNode; testID: string }) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: c.bg }}>
      {children}
    </View>
  );
}

/* ================================================================== Product art (packshot) */
export function ProductArt({
  product,
  size,
  angle = 0,
  testID,
  rounded = radius.md,
}: {
  product: Pick<Product, 'icon' | 'colors' | 'brand' | 'unit' | 'stock'>;
  size: number;
  angle?: number;
  testID?: string;
  rounded?: number;
}) {
  const [a, b] = product.colors;
  const icon = angle === 2 ? 'package-variant-closed' : product.icon;
  return (
    <LinearGradient
      testID={testID}
      colors={angle === 1 ? [b, a] : [a, b]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: rounded, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
    >
      <View
        style={{
          position: 'absolute',
          width: size * 0.9,
          height: size * 0.9,
          borderRadius: size,
          backgroundColor: 'rgba(255,255,255,0.28)',
          top: -size * 0.35,
          right: -size * 0.3,
        }}
      />
      <MaterialCommunityIcons name={icon as any} size={size * 0.46} color="rgba(30, 40, 36, 0.78)" />
      {size >= 90 ? (
        <View style={{ position: 'absolute', bottom: size * 0.08, left: 8, right: 8, alignItems: 'center' }}>
          <Text numberOfLines={1} style={{ fontSize: Math.max(9, size * 0.075), fontWeight: '800', color: 'rgba(30,40,36,0.8)', letterSpacing: 0.4 }}>
            {product.brand.toUpperCase()}
          </Text>
          {size >= 160 ? (
            <Text style={{ fontSize: size * 0.055, color: 'rgba(30,40,36,0.65)', fontWeight: '600' }}>
              {angle === 2 ? 'Outer carton' : angle === 1 ? 'Back of pack' : product.unit}
            </Text>
          ) : null}
        </View>
      ) : null}
      {product.stock === 0 ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: Math.max(9, size * 0.08), fontWeight: '900', color: '#7A2020', letterSpacing: 0.6 }}>SOLD OUT</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}
