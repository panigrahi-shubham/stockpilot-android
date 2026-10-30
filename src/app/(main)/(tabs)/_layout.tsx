import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { c } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const activeOrders = state.orders.filter((o) => ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'pending_approval'].includes(o.status)).length;

  const icon =
    (name: keyof typeof Ionicons.glyphMap, outline: keyof typeof Ionicons.glyphMap) =>
    ({ focused, color }: { focused: boolean; color: any }) => <Ionicons name={focused ? name : outline} size={23} color={color} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border, height: 60 + insets.bottom, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tab.home'), tabBarButtonTestID: 'tab-home', tabBarAccessibilityLabel: 'Home tab', tabBarIcon: icon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="catalog"
        options={{ title: t('tab.catalog'), tabBarButtonTestID: 'tab-catalog', tabBarAccessibilityLabel: 'Catalog tab', tabBarIcon: icon('grid', 'grid-outline') }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tab.scan'),
          tabBarButtonTestID: 'tab-scan',
          tabBarAccessibilityLabel: 'Scan tab',
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: focused ? c.primaryDark : c.primary, alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: c.card }}>
              <Ionicons name="scan" size={24} color={c.onPrimary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tab.orders'),
          tabBarButtonTestID: 'tab-orders',
          tabBarAccessibilityLabel: `Orders tab, ${activeOrders} active`,
          tabBarBadge: activeOrders || undefined,
          tabBarBadgeStyle: { backgroundColor: c.accent, color: '#2B1B00', fontSize: 10, fontWeight: '800' },
          tabBarIcon: icon('receipt', 'receipt-outline'),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('tab.account'), tabBarButtonTestID: 'tab-account', tabBarAccessibilityLabel: 'Account tab', tabBarIcon: icon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
