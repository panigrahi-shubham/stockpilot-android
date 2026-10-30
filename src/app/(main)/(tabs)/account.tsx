import React, { useRef } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '@/state/AppContext';
import { useT } from '@/i18n';
import { initials, inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, Button, Card, Divider, ListRow, Segmented } from '@/components/ui';
import { useToast } from '@/components/overlays';

export default function Account() {
  const { c } = useTheme();
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const user = state.user!;
  const taps = useRef(0);
  const kycDone = Object.values(state.kyc).filter((d) => d.status === 'verified').length;

  const tapVersion = () => {
    if (state.qa.devUnlocked) return toast.show('QA Lab is already enabled. Find it in the menu.', 'info');
    taps.current += 1;
    const left = 7 - taps.current;
    if (left <= 0) {
      actions.setQa({ devUnlocked: true });
      toast.show('🧪 QA Lab unlocked! Open it from the side menu.', 'success');
      taps.current = 0;
    } else if (left <= 4) toast.show(`You are ${left} tap${left === 1 ? '' : 's'} away from QA Lab`, 'info');
  };

  const logout = () =>
    Alert.alert('Log out?', 'You will need your password and OTP to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => actions.signOut() },
    ]);

  return (
    <Screen testID="account-screen">
      <AppHeader testID="account-header" mode="menu" title={t('tab.account')} showCart={false} showBell />
      <ScrollView testID="account-scroll" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
        <Card testID="account-profile-card" style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c.onPrimary, fontSize: 22, fontWeight: '800' }}>{initials(user.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text testID="account-user-name" style={[font.h2, { color: c.text }]}>
                {user.name}
              </Text>
              <Text testID="account-user-email" style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
                {user.email}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <Badge testID="account-role-badge" label={user.role === 'approver' ? 'Manager' : 'Buyer'} tone="info" />
                <Badge testID="account-kyc-badge" label={user.kyc === 'verified' ? 'KYC verified' : 'KYC pending'} tone={user.kyc === 'verified' ? 'success' : 'warning'} icon={user.kyc === 'verified' ? 'shield-checkmark' : 'time-outline'} />
              </View>
            </View>
            <Pressable testID="account-edit-profile-button" accessibilityLabel="Edit business profile" onPress={() => router.push('/business-profile')} hitSlop={8}>
              <Ionicons name="create-outline" size={22} color={c.primary} />
            </Pressable>
          </View>
          <Divider style={{ marginVertical: 0 }} />
          <View style={{ gap: 6 }}>
            <InfoLine label="Business" value={user.business} testID="account-business" />
            <InfoLine
              label="GSTIN"
              value={user.gstin || 'Not added'}
              testID="account-gstin"
              onCopy={user.gstin ? async () => { await Clipboard.setStringAsync(user.gstin); toast.show('GSTIN copied', 'success'); } : undefined}
            />
            <InfoLine label="Credit limit" value={inr(user.creditLimit, { decimals: false })} testID="account-credit-limit" />
          </View>
        </Card>

        <Card testID="account-mode-card" style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="swap-horizontal-outline" size={18} color={c.primary} />
            <Text style={[font.h3, { color: c.text, flex: 1 }]}>Business mode</Text>
            <Badge testID="account-mode-badge" label={state.mode === 'seller' ? 'Seller' : 'Buyer'} tone={state.mode === 'seller' ? 'accent' : 'info'} />
          </View>
          <Segmented
            testID="account-mode-switch"
            value={state.mode}
            onChange={(m) => {
              actions.setMode(m);
              toast.show(m === 'seller' ? 'Seller mode on — Seller Hub unlocked' : 'Buyer mode on', 'success');
            }}
            options={[
              { value: 'buyer', label: 'Buyer' },
              { value: 'seller', label: 'Seller' },
            ]}
          />
          {state.mode === 'seller' ? (
            <Button testID="account-open-seller-hub" title="Open Seller Hub" icon="storefront-outline" variant="secondary" onPress={() => router.push('/seller')} />
          ) : (
            <Text style={[font.small, { color: c.textMuted }]}>Switch to Seller to list your own products and answer buyer enquiries.</Text>
          )}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow testID="account-row-business-profile" icon="business-outline" title="Business profile" subtitle="GSTIN, PAN, store location" onPress={() => router.push('/business-profile')} />
          <ListRow testID="account-row-kyc" icon="document-text-outline" title="KYC documents" subtitle={`${kycDone} of 4 verified`} onPress={() => router.push('/kyc')} />
          <ListRow testID="account-row-quick-list" icon="flash-outline" title="Quick order list" subtitle={`${state.quickList.length} saved items`} onPress={() => router.push('/quick-list')} />
          <ListRow testID="account-row-favourites" icon="heart-outline" title="Favourites" subtitle={`${state.favorites.length} products`} onPress={() => router.navigate({ pathname: '/catalog', params: { favorites: String(Date.now()) } })} />
          <ListRow testID="account-row-reports" icon="bar-chart-outline" title="Purchase reports" onPress={() => router.push('/reports')} />
          {user.role === 'approver' ? (
            <ListRow testID="account-row-approvals" icon="checkmark-done-outline" title="Approvals" subtitle="Orders waiting for you" onPress={() => router.push('/approvals')} />
          ) : null}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow testID="account-row-messages" icon="chatbubble-ellipses-outline" title="Messages" subtitle={`${state.conversations.filter((x) => !x.archived && x.unread).length} unread conversations`} onPress={() => router.push('/messages')} />
          <ListRow testID="account-row-notifications" icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
          <ListRow testID="account-row-market" icon="trending-up" title="Live market rates" subtitle="Online · INR exchange rates" onPress={() => router.push('/market')} />
          <ListRow testID="account-row-browser" icon="globe-outline" title="Web portal" subtitle="Online pages inside the app" onPress={() => router.push('/browser')} />
          <ListRow testID="account-row-settings" icon="settings-outline" title={t('settings.title')} subtitle="Theme, language, security" onPress={() => router.push('/settings')} />
          <ListRow testID="account-row-chat" icon="chatbubbles-outline" title="Chat with your RM" subtitle="Priya · usually replies in 2 min" onPress={() => router.push('/chat')} />
          <ListRow testID="account-row-help" icon="help-circle-outline" title="Help & FAQs" onPress={() => router.push('/help')} />
          <ListRow testID="account-row-call" icon="call-outline" title="Call support" subtitle="1800-120-7788 (toll free)" onPress={() => Linking.openURL('tel:18001207788')} />
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <ListRow testID="account-row-terms" icon="document-outline" title="Terms of Trade" onPress={() => router.push({ pathname: '/webview', params: { doc: 'terms' } })} />
          <ListRow testID="account-row-feedback" icon="thumbs-up-outline" title="Send feedback" onPress={() => router.push({ pathname: '/webview', params: { doc: 'feedback' } })} />
          {state.qa.devUnlocked ? <ListRow testID="account-row-qa-lab" icon="flask-outline" title="QA Lab" subtitle="Developer & testing options" onPress={() => router.push('/qa-lab')} /> : null}
          <ListRow testID="account-row-logout" icon="log-out-outline" title={t('account.logout')} danger onPress={logout} right={<View />} />
        </Card>

        <Pressable testID="account-app-version" accessibilityRole="button" accessibilityLabel="App version 2.5.0" onPress={tapVersion} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={[font.small, { color: c.textFaint }]}>StockPilot B2B v2.5.0 (build 250)</Text>
          <Text style={[font.tiny, { color: c.textFaint, marginTop: 2 }]}>Made in Hyderabad 🇮🇳</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function InfoLine({ label, value, testID, onCopy }: { label: string; value: string; testID: string; onCopy?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={[font.small, { color: c.textMuted, width: 90 }]}>{label}</Text>
      <Text testID={testID} style={[font.bodyStrong, { color: c.text, flex: 1 }]} selectable>
        {value}
      </Text>
      {onCopy ? (
        <Pressable testID={`${testID}-copy`} accessibilityLabel={`Copy ${label}`} onPress={onCopy} hitSlop={8} style={{ padding: 4, borderRadius: radius.sm }}>
          <Ionicons name="copy-outline" size={16} color={c.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
