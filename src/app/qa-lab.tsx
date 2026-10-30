import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { initialState, resetPersistedState, useApp } from '@/state/AppContext';
import { TEST_USERS } from '@/data/seed';
import { PRODUCTS } from '@/data/catalog';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Card, Segmented, SwitchRow } from '@/components/ui';
import { ConfirmDialog, useToast } from '@/components/overlays';

export default function QaLab() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const { state, actions, update } = useApp();
  const qa = state.qa;
  const [crash, setCrash] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);

  if (crash) throw new Error('Simulated crash from QA Lab (NullPointerException in CartReducer.applyCoupon)');

  const firstOrder = state.orders[0]?.id ?? '';
  const links = [
    ['Product page', `stockpilot://product/${PRODUCTS[0].sku}`],
    ['Order details', `stockpilot://order/${firstOrder}`],
    ['Cart', 'stockpilot://cart'],
    ['Apply promo DIWALI25', 'stockpilot://promo/DIWALI25'],
    ['Catalog · Dairy', 'stockpilot://catalog?category=dairy'],
    ['Notifications', 'stockpilot://notifications'],
    ['QA Lab', 'stockpilot://qa-lab'],
    ['Messages inbox', 'stockpilot://messages'],
    ['Seller Hub', 'stockpilot://seller'],
    ['Add product (seller)', 'stockpilot://seller/product-form'],
    ['Seller leads', 'stockpilot://seller/leads'],
    ['Compare products', 'stockpilot://compare'],
    ['Live market (online)', 'stockpilot://market'],
    ['Web portal (online WebView)', 'stockpilot://browser'],
    ['GST portal in WebView', 'stockpilot://browser?url=https%3A%2F%2Fservices.gst.gov.in%2Fservices%2Fsearchtp'],
    ['Unknown route (404)', 'stockpilot://does-not-exist'],
  ];

  const notify = async () => {
    const perm = await Notifications.getPermissionsAsync();
    const ok = perm.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!ok) return toast.show('Notification permission denied', 'error');
    await Notifications.scheduleNotificationAsync({
      content: { title: `Order ${firstOrder} is out for delivery 🚚`, body: 'Arriving today between 2 PM and 6 PM. Tap to track.', data: { url: `/order/${firstOrder}` } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: 'orders' },
    });
    toast.show('Push notification scheduled in 5 s', 'info');
  };

  return (
    <Screen testID="qa-lab-screen">
      <AppHeader testID="qa-lab-header" title="QA Lab 🧪" subtitle="Testing & developer options" showCart={false} />
      <ScrollView testID="qa-lab-scroll" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: c.infoSoft }}>
          <Ionicons name="information-circle-outline" size={18} color={c.info} />
          <Text style={[font.small, { color: c.text, flex: 1, lineHeight: 18 }]}>These switches change how the mock backend behaves so you can practise waits, retries, error handling and interruptions.</Text>
        </View>

        <Section title="Network">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[font.bodyStrong, { color: c.text }]}>API latency</Text>
            <Text testID="qa-latency-value" style={[font.bodyStrong, { color: c.primary }]}>
              {qa.latencyMs} ms
            </Text>
          </View>
          <Slider testID="qa-latency-slider" accessibilityLabel="API latency" minimumValue={0} maximumValue={5000} step={250} value={qa.latencyMs} onSlidingComplete={(v) => actions.setQa({ latencyMs: v })} minimumTrackTintColor={c.primary} thumbTintColor={c.primary} style={{ height: 40 }} />
          <Text style={[font.bodyStrong, { color: c.text, marginTop: 8, marginBottom: 8 }]}>Random server failures</Text>
          <Segmented
            testID="qa-fail-rate"
            value={String(qa.failRate) as '0' | '10' | '30' | '50'}
            onChange={(v) => actions.setQa({ failRate: Number(v) })}
            options={[
              { value: '0', label: 'Off' },
              { value: '10', label: '10%' },
              { value: '30', label: '30%' },
              { value: '50', label: '50%' },
            ]}
          />
          <SwitchRow testID="qa-offline-switch" icon="cloud-offline-outline" label="Simulate offline" description="All API calls fail with a network error" value={qa.offline} onValueChange={(v) => actions.setQa({ offline: v })} />
        </Section>

        <Section title="Interruptions">
          <Text style={[font.bodyStrong, { color: c.text, marginBottom: 8 }]}>Promo pop-up on Home</Text>
          <Segmented
            testID="qa-promo-mode"
            value={qa.promoMode}
            onChange={(v) => {
              actions.setQa({ promoMode: v });
              update((s) => ({ ...s, promoShownThisSession: false }));
            }}
            options={[
              { value: 'random', label: 'Random 50%' },
              { value: 'always', label: 'Always' },
              { value: 'never', label: 'Never' },
            ]}
          />
          <Button testID="qa-notify-button" title="Send push notification in 5 s" icon="notifications-outline" variant="secondary" size="sm" onPress={notify} style={{ marginTop: 12 }} />
          <SwitchRow testID="qa-animations-switch" icon="sparkles-outline" label="Screen transition animations" description="Turn off for faster, more stable tests" value={qa.animations} onValueChange={(v) => actions.setQa({ animations: v })} />
        </Section>

        <Section title="Authentication">
          <SwitchRow testID="qa-skip-otp-switch" icon="key-outline" label="Skip OTP on login" description="Like a test build with 2FA disabled" value={qa.skipOtp} onValueChange={(v) => actions.setQa({ skipOtp: v })} />
          <Button testID="qa-expire-session-button" title="Expire session now" icon="time-outline" variant="outline" size="sm" onPress={() => { actions.expireSession(); toast.show('Session expired — the next API call will log you out', 'info'); }} />
        </Section>

        <Section title="Deep links">
          {links.map(([label, url], i) => (
            <View key={url} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8, borderBottomWidth: i < links.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
              <Pressable testID={`qa-deeplink-${i}`} onPress={() => Linking.openURL(url)} style={{ flex: 1 }}>
                <Text style={[font.bodyStrong, { color: c.text }]}>{label}</Text>
                <Text style={[font.small, { color: c.primary }]} selectable>
                  {url}
                </Text>
              </Pressable>
              <Pressable testID={`qa-deeplink-copy-${i}`} accessibilityLabel={`Copy ${label} link`} hitSlop={8} onPress={async () => { await Clipboard.setStringAsync(url); toast.show('Link copied', 'success'); }}>
                <Ionicons name="copy-outline" size={18} color={c.textMuted} />
              </Pressable>
            </View>
          ))}
        </Section>

        <Section title="Test accounts (password Pilot@123)">
          {TEST_USERS.map((u) => (
            <View key={u.email} testID={`qa-account-${u.kind}`} style={{ paddingVertical: 8 }}>
              <Text style={[font.bodyStrong, { color: c.text }]}>{u.email}</Text>
              <Text style={[font.small, { color: c.textMuted }]}>{u.note}</Text>
            </View>
          ))}
        </Section>

        <Section title="Device">
          <Text testID="qa-device-info" style={[font.small, { color: c.text, lineHeight: 20 }]}>
            Platform: {Platform.OS} {String(Platform.Version)}
            {'\n'}Window: {Math.round(width)} × {Math.round(height)} dp ({width > height ? 'landscape' : 'portrait'})
            {'\n'}App: com.stockpilot.b2b · v2.5.0 (250)
            {'\n'}Signed in as: {state.user?.email}
          </Text>
        </Section>

        <Section title="Danger zone">
          <Button testID="qa-crash-button" title="Trigger JS crash" icon="bug-outline" variant="outline" size="sm" onPress={() => setCrash(true)} />
          <Button testID="qa-reset-button" title="Reset app data" icon="refresh" variant="danger" size="sm" onPress={() => setResetDialog(true)} style={{ marginTop: 10 }} />
        </Section>
      </ScrollView>

      <ConfirmDialog
        testID="qa-reset-dialog"
        visible={resetDialog}
        title="Reset all app data?"
        message="Cart, orders, settings and login will be wiped and the app will restart from onboarding — like a fresh install."
        confirmLabel="Reset"
        destructive
        onCancel={() => setResetDialog(false)}
        onConfirm={async () => {
          setResetDialog(false);
          await resetPersistedState();
          update(() => ({ ...initialState(), hydrated: true }));
          router.replace('/onboarding');
        }}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[font.small, { color: c.textMuted, fontWeight: '800', marginLeft: 4 }]}>{title.toUpperCase()}</Text>
      <Card style={{ gap: 4 }}>{children}</Card>
    </View>
  );
}
