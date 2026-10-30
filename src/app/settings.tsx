import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { useApp } from '@/state/AppContext';
import { LANGUAGES, useT } from '@/i18n';
import { passwordStrength } from '@/utils/format';
import { font, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Card, ListRow, ProgressBar, RadioGroup, SwitchRow, TextField } from '@/components/ui';
import { ConfirmDialog, SelectField, Sheet, useToast } from '@/components/overlays';
import { APP_LOCK_PIN } from '@/components/AppLock';
import { api } from '@/data/api';

export default function Settings() {
  const { c } = useTheme();
  const t = useT();
  const toast = useToast();
  const { state, actions } = useApp();
  const s = state.settings;
  const [pwOpen, setPwOpen] = useState(false);
  const [cacheDialog, setCacheDialog] = useState(false);

  const toggleBiometric = async (on: boolean) => {
    if (!on) {
      actions.setSettings({ biometricLogin: false });
      actions.setBiometricEmail('');
      return;
    }
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!has || !enrolled) return toast.show('Set up a fingerprint or Face ID on this device first', 'error');
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to enable biometric sign-in' });
    if (res.success) {
      actions.setSettings({ biometricLogin: true });
      actions.setBiometricEmail(state.user!.email);
      toast.show('Biometric sign-in enabled', 'success');
    } else toast.show('Biometric confirmation failed', 'error');
  };

  const testNotification = async () => {
    const perm = await Notifications.getPermissionsAsync();
    let ok = perm.granted;
    if (!ok) ok = (await Notifications.requestPermissionsAsync()).granted;
    if (!ok) return toast.show('Notifications are blocked. Enable them in system settings.', 'error');
    await Notifications.scheduleNotificationAsync({
      content: { title: 'StockPilot test notification', body: 'Tap to open your notifications inbox.', data: { url: '/notifications' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'orders' },
    });
    toast.show('Notification will arrive in 3 seconds — background the app to see it', 'info');
  };

  return (
    <Screen testID="settings-screen">
      <AppHeader testID="settings-header" title={t('settings.title')} showCart={false} />
      <ScrollView testID="settings-scroll" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
        <Section title={t('settings.appearance')}>
          <RadioGroup
            testID="settings-theme"
            value={s.theme}
            onChange={(v) => actions.setSettings({ theme: v })}
            options={[
              { value: 'system', label: 'Use device setting', description: 'Follows your phone’s light/dark mode' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Section>

        <Section title={t('settings.language')}>
          <SelectField testID="settings-language-select" label="App language" value={s.language} options={LANGUAGES.map((l) => ({ value: l.id, label: `${l.native} (${l.label})` }))} onChange={(v) => actions.setLanguage(v as any)} />
          <Text style={[font.small, { color: c.textMuted, marginTop: 8 }]}>Tip for testers: labels change with language, test IDs don’t.</Text>
        </Section>

        <Section title={t('settings.notifications')}>
          <SwitchRow testID="settings-notif-orders" icon="cube-outline" label="Order updates" description="Packed, shipped and delivered alerts" value={s.notifOrders} onValueChange={(v) => actions.setSettings({ notifOrders: v })} />
          <SwitchRow testID="settings-notif-offers" icon="pricetag-outline" label="Offers & price drops" value={s.notifOffers} onValueChange={(v) => actions.setSettings({ notifOffers: v })} />
          <SwitchRow testID="settings-notif-payments" icon="wallet-outline" label="Payment reminders" description="Required for credit-line users" value={s.notifPayments} disabled={state.user!.creditLimit > 0} onValueChange={(v) => actions.setSettings({ notifPayments: v })} />
          <Button testID="settings-test-notification" title="Send a test notification" icon="notifications-outline" variant="secondary" size="sm" onPress={testNotification} style={{ marginTop: 6 }} />
        </Section>

        <Section title={t('settings.security')}>
          <SwitchRow testID="settings-biometric-switch" icon="finger-print" label="Biometric sign-in" description="Use fingerprint / Face ID instead of password + OTP" value={s.biometricLogin} onValueChange={toggleBiometric} />
          <SwitchRow testID="settings-app-lock-switch" icon="lock-closed-outline" label="App lock" description={`Ask for PIN after 5 s in background (demo PIN ${APP_LOCK_PIN})`} value={s.appLock} onValueChange={(v) => actions.setSettings({ appLock: v })} />
          <ListRow testID="settings-change-password" icon="key-outline" title="Change password" onPress={() => setPwOpen(true)} />
        </Section>

        <Section title="Data & storage">
          <ListRow testID="settings-clear-cache" icon="trash-outline" title="Clear cache" subtitle="Images and catalogue data · 23.4 MB" onPress={() => setCacheDialog(true)} />
          <ListRow testID="settings-download-data" icon="download-outline" title="Download my data" subtitle="Orders, invoices and profile as a ZIP" onPress={() => toast.show('We’ll email your data export within 24 hours', 'success')} />
          <SwitchRow testID="settings-compact-catalog" icon="list-outline" label="Compact catalogue (list view)" value={s.compactCatalog} onValueChange={(v) => actions.setSettings({ compactCatalog: v })} />
        </Section>

        <Section title="About">
          <ListRow testID="settings-about-version" icon="information-circle-outline" title="Version" subtitle="2.5.0 (250) · Expo SDK 58" right={<View />} />
          <ListRow testID="settings-about-licences" icon="document-outline" title="Open-source licences" onPress={() => toast.show('Licences: React Native (MIT), Expo (MIT), and 214 others', 'info')} />
        </Section>
      </ScrollView>

      <ChangePasswordSheet visible={pwOpen} onClose={() => setPwOpen(false)} />
      <ConfirmDialog
        testID="clear-cache-dialog"
        visible={cacheDialog}
        title="Clear cache?"
        message="Product images and catalogue data will be downloaded again the next time you browse."
        confirmLabel="Clear"
        onCancel={() => setCacheDialog(false)}
        onConfirm={() => {
          setCacheDialog(false);
          toast.show('Cache cleared · 23.4 MB freed', 'success');
        }}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text testID={`settings-section-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`} style={[font.small, { color: c.textMuted, fontWeight: '800', marginLeft: 4 }]}>
        {title.toUpperCase()}
      </Text>
      <Card style={{ paddingVertical: 10 }}>{children}</Card>
    </View>
  );
}

function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [e, setE] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);
  const st = passwordStrength(pw);
  const colors = [c.danger, c.danger, c.warning, c.info, c.success];

  const save = async () => {
    const er: Record<string, string> = {};
    if (cur !== 'Pilot@123') er.cur = 'Current password is incorrect';
    if (st.score < 3) er.pw = 'Use 8+ characters with upper & lower case, a number and a symbol';
    else if (pw === cur) er.pw = 'New password must be different from the current one';
    if (pw2 !== pw) er.pw2 = 'Passwords don’t match';
    setE(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    await api.generic(true).catch(() => {});
    setBusy(false);
    onClose();
    setCur('');
    setPw('');
    setPw2('');
    toast.show('Password changed. (Demo: login password stays Pilot@123)', 'success');
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Change password" testID="change-password-sheet" footer={<Button testID="change-password-submit" title="Update password" loading={busy} onPress={save} />}>
      <View style={{ gap: 12 }}>
        <TextField testID="change-password-current" label="Current password" secure value={cur} onChangeText={setCur} error={e.cur} />
        <TextField testID="change-password-new" label="New password" secure value={pw} onChangeText={setPw} error={e.pw} />
        {pw ? (
          <View style={{ gap: 4 }}>
            <ProgressBar testID="password-strength-bar" value={st.score / 4} color={colors[st.score]} height={6} />
            <Text testID="password-strength-label" style={[font.small, { color: colors[st.score], fontWeight: '700' }]}>
              {st.label}
            </Text>
          </View>
        ) : null}
        <TextField testID="change-password-confirm" label="Confirm new password" secure value={pw2} onChangeText={setPw2} error={e.pw2} />
      </View>
    </Sheet>
  );
}
