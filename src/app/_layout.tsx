import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Stack, useRouter, ThemeProvider, DarkTheme, DefaultTheme, type ErrorBoundaryProps } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AppProvider, useApp } from '@/state/AppContext';
import { ToastProvider } from '@/components/overlays';
import { AppLock } from '@/components/AppLock';
import { NetworkWatcher } from '@/state/network';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Root() {
  const { state } = useApp();
  const { c, mode } = useTheme();
  const router = useRouter();
  const loggedIn = !!state.user;

  useEffect(() => {
    if (state.hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [state.hydrated]);

  // Tapping a push notification deep-links into the app (e.g. order details).
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('orders', {
        name: 'Order updates',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#0E5E4F',
      }).catch(() => {});
    }
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const url = resp.notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as any);
    });
    return () => sub.remove();
  }, [router]);

  if (!state.hydrated) return null;

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: { ...(mode === 'dark' ? DarkTheme : DefaultTheme).colors, background: c.bg, card: c.card, primary: c.primary, text: c.text, border: c.border },
  };

  return (
    <ThemeProvider value={navTheme}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: state.qa.animations ? 'default' : 'none' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="otp" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="webview" options={{ presentation: 'modal' }} />
          <Stack.Protected guard={loggedIn} redirectTo="/login">
            <Stack.Screen name="(main)" />
            <Stack.Screen name="product/[sku]" />
            <Stack.Screen name="image-viewer" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="cart" />
            <Stack.Screen name="checkout" options={{ gestureEnabled: false }} />
            <Stack.Screen name="order-success" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="approvals" />
            <Stack.Screen name="quick-list" />
            <Stack.Screen name="kyc" />
            <Stack.Screen name="business-profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="help" />
            <Stack.Screen name="qa-lab" />
            <Stack.Screen name="promo/[code]" />
            <Stack.Screen name="messages" />
            <Stack.Screen name="compare" />
            <Stack.Screen name="market" />
            <Stack.Screen name="browser" options={{ presentation: 'modal' }} />
            <Stack.Screen name="seller/index" />
            <Stack.Screen name="seller/products" />
            <Stack.Screen name="seller/product-form" options={{ gestureEnabled: false }} />
            <Stack.Screen name="seller/leads" />
            <Stack.Screen name="seller/lead/[id]" />
          </Stack.Protected>
        </Stack>
        <AppLock />
        <NetworkWatcher />
      </ToastProvider>
    </ThemeProvider>
  );
}

/** Rendered when any screen throws (QA Lab → "Trigger JS crash"). Self-contained: no context hooks. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View testID="crash-screen" style={{ flex: 1, backgroundColor: '#FFF7F5', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
      <Text style={{ fontSize: 46 }}>⚠️</Text>
      <Text testID="crash-title" style={{ fontSize: 22, fontWeight: '800', color: '#3A1010', textAlign: 'center' }}>
        StockPilot stopped working
      </Text>
      <Text testID="crash-message" style={{ fontSize: 14, color: '#6B3B3B', textAlign: 'center' }}>
        {error.message}
      </Text>
      <Text style={{ fontSize: 12, color: '#8E6B6B', textAlign: 'center' }}>Error ID: SP-CRASH-{Date.now().toString(36).toUpperCase()}</Text>
      <Pressable
        testID="crash-restart-button"
        accessibilityRole="button"
        onPress={retry}
        style={{ marginTop: 10, backgroundColor: '#0E5E4F', paddingHorizontal: 26, paddingVertical: 14, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>Restart app</Text>
      </Pressable>
    </View>
  );
}
