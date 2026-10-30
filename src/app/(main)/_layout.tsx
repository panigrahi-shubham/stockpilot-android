import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Drawer, type DrawerContentComponentProps } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { useT } from '@/i18n';
import { font, useTheme } from '@/theme';
import { Badge } from '@/components/ui';
import { initials } from '@/utils/format';

export default function MainLayout() {
  const { c } = useTheme();
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: true,
        swipeEdgeWidth: 40,
        drawerStyle: { backgroundColor: c.card, width: 300 },
        overlayColor: c.overlay,
      }}
    >
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}

function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const { c } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useApp();
  const user = state.user!;
  const pendingApprovals = state.orders.filter((o) => o.status === 'pending_approval').length;

  const go = (href: string) => {
    navigation.closeDrawer();
    setTimeout(() => router.push(href as any), 150);
  };

  type Item = { id: string; label: string; icon: string; href: string; badge?: number; mci?: boolean };
  const unreadChats = state.conversations.filter((x) => !x.archived).reduce((n, x) => n + x.unread, 0);
  const newLeads = state.leads.filter((l) => l.status === 'new').length;
  const items: Item[] = [
    { id: 'home', label: 'Dashboard', icon: 'home-outline', href: '/home' },
    { id: 'catalog', label: 'Browse catalog', icon: 'grid-outline', href: '/catalog' },
    { id: 'orders', label: 'My orders', icon: 'receipt-outline', href: '/orders' },
    { id: 'messages', label: 'Messages', icon: 'chatbubble-ellipses-outline', href: '/messages', badge: unreadChats },
    { id: 'quick-list', label: 'Quick order list', icon: 'flash-outline', href: '/quick-list' },
    { id: 'compare', label: `Compare products${state.compare.length ? ` (${state.compare.length})` : ''}`, icon: 'git-compare-outline', href: '/compare' },
    ...(state.mode === 'seller'
      ? [
          { id: 'seller-hub', label: 'Seller Hub', icon: 'storefront-outline', href: '/seller' },
          { id: 'seller-products', label: 'My products', icon: 'cube-outline', href: '/seller/products' },
          { id: 'seller-leads', label: 'Leads', icon: 'people-outline', href: '/seller/leads', badge: newLeads },
        ]
      : []),
    { id: 'market', label: 'Live market rates', icon: 'trending-up', href: '/market' },
    { id: 'browser', label: 'Web portal', icon: 'globe-outline', href: '/browser' },
    { id: 'reports', label: 'Purchase reports', icon: 'bar-chart-outline', href: '/reports' },
    ...(user.role === 'approver'
      ? [{ id: 'approvals', label: 'Approvals', icon: 'checkmark-done-outline', href: '/approvals', badge: pendingApprovals }]
      : []),
    { id: 'kyc', label: 'KYC documents', icon: 'document-text-outline', href: '/kyc' },
    { id: 'help', label: 'Help & FAQs', icon: 'help-circle-outline', href: '/help' },
    { id: 'settings', label: t('settings.title'), icon: 'settings-outline', href: '/settings' },
    ...(state.qa.devUnlocked ? [{ id: 'qa-lab', label: 'QA Lab', icon: 'flask-outline', href: '/qa-lab' }] : []),
  ];

  return (
    <View testID="drawer" style={{ flex: 1, backgroundColor: c.card }}>
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: c.primary }}>
        <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#F5A524', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0E5E4F' }}>{initials(user.name)}</Text>
        </View>
        <Text testID="drawer-user-name" style={[font.h3, { color: '#fff', marginTop: 12 }]}>
          {user.name}
        </Text>
        <Text testID="drawer-business-name" style={[font.small, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>
          {user.business}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text testID="drawer-user-role" style={[font.tiny, { color: '#fff', textTransform: 'uppercase' }]}>
              {user.role === 'approver' ? 'Manager' : 'Buyer'}
            </Text>
          </View>
          <View style={{ backgroundColor: state.mode === 'seller' ? '#F5A524' : 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text testID="drawer-mode" style={[font.tiny, { color: state.mode === 'seller' ? '#2B1B00' : '#fff' }]}>
              {state.mode === 'seller' ? 'SELLER MODE' : 'BUYER MODE'}
            </Text>
          </View>
          {user.kyc === 'verified' ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
              <Text style={[font.tiny, { color: '#fff' }]}>KYC VERIFIED</Text>
            </View>
          ) : null}
        </View>
      </View>
      <ScrollView testID="drawer-scroll" contentContainerStyle={{ paddingVertical: 8 }}>
        {items.map((it) => (
          <Pressable
            key={it.id}
            testID={`drawer-item-${it.id}`}
            accessibilityRole="menuitem"
            accessibilityLabel={it.label}
            onPress={() => go(it.href)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingHorizontal: 22,
              paddingVertical: 14,
              backgroundColor: pressed ? c.primarySoft : 'transparent',
            })}
          >
            {it.mci ? (
              <MaterialCommunityIcons name={it.icon as any} size={21} color={c.textMuted} />
            ) : (
              <Ionicons name={it.icon as any} size={21} color={c.textMuted} />
            )}
            <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>{it.label}</Text>
            {it.badge ? <Badge testID={`drawer-item-${it.id}-badge`} label={String(it.badge)} tone="danger" /> : null}
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderTopColor: c.border, padding: 18, paddingBottom: insets.bottom + 14, gap: 10 }}>
        <Pressable
          testID="drawer-logout-button"
          accessibilityRole="button"
          onPress={() => {
            navigation.closeDrawer();
            Alert.alert('Log out?', 'You will need your password and OTP to sign in again.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log out', style: 'destructive', onPress: () => actions.signOut() },
            ]);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}
        >
          <Ionicons name="log-out-outline" size={21} color={c.danger} />
          <Text style={[font.bodyStrong, { color: c.danger }]}>{t('account.logout')}</Text>
        </Pressable>
        <Text style={[font.tiny, { color: c.textFaint }]}>StockPilot B2B · v2.5.0 (250)</Text>
      </View>
    </View>
  );
}

