import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/state/AppContext';
import { useT, LANGUAGES } from '@/i18n';
import { api, errorMessage } from '@/data/api';
import { TEST_USERS } from '@/data/seed';
import { validators } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { Button, Checkbox, TextField } from '@/components/ui';
import { Sheet, useToast } from '@/components/overlays';

export default function Login() {
  const { c } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const [email, setEmail] = useState(state.rememberedEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!state.rememberedEmail);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testSheet, setTestSheet] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const [accessSheet, setAccessSheet] = useState(false);
  const bioAvailable = state.settings.biometricLogin && !!state.biometricEmail;

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!validators.email(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setBanner(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await api.login(email, password);
      actions.clearSessionFlag();
      if (state.qa.skipOtp) {
        actions.signIn(user, remember);
        router.replace('/home');
      } else {
        actions.setPendingUser(user);
        router.push({ pathname: '/otp', params: { remember: remember ? '1' : '0' } });
      }
    } catch (e) {
      setBanner(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const biometric = async () => {
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) return toast.show('No fingerprint / Face ID enrolled on this device', 'error');
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Sign in to StockPilot', cancelLabel: 'Use password' });
      if (!res.success) return toast.show('Biometric sign-in cancelled', 'info');
      const u = TEST_USERS.find((x) => x.email === state.biometricEmail);
      if (!u) return;
      const { password: _p, note: _n, ...user } = u;
      actions.signIn(user, true);
      router.replace('/home');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    }
  };

  return (
    <KeyboardAvoidingView testID="login-screen" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView testID="login-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={['#0E5E4F', '#17806A']} style={{ paddingTop: insets.top + 18, paddingHorizontal: 24, paddingBottom: 56, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              testID="login-logo"
              accessibilityLabel="StockPilot logo"
              onLongPress={() => setTestSheet(true)}
              delayLongPress={1200}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5A524', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cube-outline" size={22} color="#0E5E4F" />
              </View>
              <Text style={[font.h2, { color: '#fff' }]}>StockPilot</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={[font.tiny, { color: '#fff' }]}>B2B</Text>
              </View>
            </Pressable>
            <Pressable testID="login-language-button" accessibilityRole="button" accessibilityLabel="Change language" onPress={() => setLangSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
              <Ionicons name="language-outline" size={18} color="#fff" />
              <Text style={[font.small, { color: '#fff', fontWeight: '700' }]}>{LANGUAGES.find((l) => l.id === state.settings.language)?.native}</Text>
            </Pressable>
          </View>
          <Text testID="login-title" style={[font.h1, { color: '#fff', marginTop: 34 }]}>
            {t('login.title')}
          </Text>
          <Text style={[font.body, { color: 'rgba(255,255,255,0.82)', marginTop: 6, fontSize: 15 }]}>{t('login.subtitle')}</Text>
        </LinearGradient>

        <View style={{ marginTop: -32, marginHorizontal: 16, backgroundColor: c.card, borderRadius: radius.xl, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
          {state.sessionExpired ? (
            <View testID="login-session-expired" style={{ flexDirection: 'row', gap: 8, backgroundColor: c.warningSoft, padding: 12, borderRadius: radius.md }}>
              <Ionicons name="time-outline" size={18} color={c.warning} />
              <Text style={[font.small, { color: c.text, flex: 1 }]}>Your session expired. Please sign in again.</Text>
            </View>
          ) : null}
          {banner ? (
            <View testID="login-error-banner" accessibilityLiveRegion="assertive" style={{ flexDirection: 'row', gap: 8, backgroundColor: c.dangerSoft, padding: 12, borderRadius: radius.md }}>
              <Ionicons name="alert-circle" size={18} color={c.danger} />
              <Text testID="login-error-message" style={[font.small, { color: c.danger, flex: 1, fontWeight: '600' }]}>
                {banner}
              </Text>
            </View>
          ) : null}
          <TextField
            testID="login-email-input"
            label={t('login.email')}
            icon="mail-outline"
            placeholder="you@business.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            error={errors.email}
          />
          <TextField
            testID="login-password-input"
            label={t('login.password')}
            icon="lock-closed-outline"
            placeholder="Enter password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            secure
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={submit}
            error={errors.password}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox testID="login-remember-checkbox" label={t('login.remember')} checked={remember} onChange={setRemember} />
            <Pressable testID="login-forgot-password-link" accessibilityRole="link" onPress={() => router.push('/forgot-password')} hitSlop={8}>
              <Text style={[font.small, { color: c.primary, fontWeight: '700' }]}>{t('login.forgot')}</Text>
            </Pressable>
          </View>
          <Button testID="login-submit-button" title={t('login.submit')} size="lg" loading={loading} onPress={submit} />
          {bioAvailable ? (
            <Button testID="login-biometric-button" title={t('login.biometric')} icon="finger-print" variant="outline" onPress={biometric} />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          <Text style={[font.body, { color: c.textMuted }]}>{t('login.noAccount')}</Text>
          <Pressable testID="login-request-access-link" accessibilityRole="link" onPress={() => setAccessSheet(true)}>
            <Text style={[font.bodyStrong, { color: c.primary }]}>{t('login.register')}</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'center', paddingVertical: 20, paddingBottom: insets.bottom + 16, gap: 4 }}>
          <Pressable testID="login-terms-link" onPress={() => router.push({ pathname: '/webview', params: { doc: 'terms' } })}>
            <Text style={[font.small, { color: c.textMuted, textAlign: 'center' }]}>
              By signing in you agree to our <Text style={{ color: c.primary, fontWeight: '700' }}>Terms of Trade</Text>
            </Text>
          </Pressable>
          <Text testID="login-app-version" style={[font.tiny, { color: c.textFaint }]}>
            v2.5.0 (250) · {Platform.OS === 'ios' ? 'iOS' : 'Android'}
          </Text>
        </View>
      </ScrollView>

      <Sheet visible={testSheet} onClose={() => setTestSheet(false)} title="Test accounts" testID="test-accounts-sheet">
        <Text style={[font.small, { color: c.textMuted, marginBottom: 10 }]}>Password for all accounts: Pilot@123</Text>
        <ScrollView style={{ maxHeight: 420 }}>
          {TEST_USERS.map((u) => (
            <Pressable
              key={u.email}
              testID={`test-account-${u.kind}`}
              onPress={() => {
                setEmail(u.email);
                setPassword(u.password);
                setTestSheet(false);
              }}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}
            >
              <Text style={[font.bodyStrong, { color: c.text }]}>{u.email}</Text>
              <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{u.note}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>

      <Sheet visible={langSheet} onClose={() => setLangSheet(false)} title="Language" testID="login-language-sheet">
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.id}
            testID={`login-language-option-${l.id}`}
            onPress={() => {
              actions.setLanguage(l.id);
              setLangSheet(false);
            }}
            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.border }}
          >
            <Text style={[font.body, { color: c.text, flex: 1, fontSize: 16 }]}>
              {l.native} <Text style={{ color: c.textMuted }}>· {l.label}</Text>
            </Text>
            {state.settings.language === l.id ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
          </Pressable>
        ))}
      </Sheet>

      <RequestAccessSheet visible={accessSheet} onClose={() => setAccessSheet(false)} />
    </KeyboardAvoidingView>
  );
}

function RequestAccessSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const [biz, setBiz] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<{ biz?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const e: typeof err = {};
    if (biz.trim().length < 3) e.biz = 'Enter your registered business name';
    if (!validators.phone(phone)) e.phone = 'Enter a valid 10-digit mobile number';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await api.generic(true).catch(() => {});
    setBusy(false);
    onClose();
    setBiz('');
    setPhone('');
    toast.show('Request received. Our team will call you within 24 hours.', 'success');
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Request access"
      testID="request-access-sheet"
      footer={<Button testID="request-access-submit" title="Submit request" loading={busy} onPress={send} />}
    >
      <View style={{ gap: 14 }}>
        <TextField testID="request-access-business-input" label="Business name" value={biz} onChangeText={setBiz} error={err.biz} placeholder="e.g. Sri Balaji Traders" />
        <TextField
          testID="request-access-phone-input"
          label="Mobile number"
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          maxLength={10}
          error={err.phone}
          placeholder="10-digit mobile"
          icon="call-outline"
        />
      </View>
    </Sheet>
  );
}
