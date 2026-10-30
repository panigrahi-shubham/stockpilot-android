import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { useT } from '@/i18n';
import { api, errorMessage } from '@/data/api';
import { font, radius, useTheme } from '@/theme';
import { Button } from '@/components/ui';
import { AppHeader } from '@/components/chrome';
import { sleep } from '@/utils/format';

const RESEND_SECONDS = 30;

export default function Otp() {
  const { c } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { remember } = useLocalSearchParams<{ remember?: string }>();
  const { state, actions } = useApp();
  const user = state.pendingUser;
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [code, setCode] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resends, setResends] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sms, setSms] = useState<string | null>(null);
  const refs = useRef<(TextInputInstance | null)[]>([]);
  const smsAnim = useRef(new Animated.Value(-140)).current;

  const send = async () => {
    try {
      const otp = await api.sendOtp();
      setCode(otp);
      await sleep(1500); // SMS arrives a bit later than the screen — wait for it!
      setSms(otp);
      Animated.spring(smsAnim, { toValue: 0, useNativeDriver: true }).start();
      setTimeout(() => Animated.timing(smsAnim, { toValue: -140, duration: 250, useNativeDriver: true }).start(() => setSms(null)), 8000);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  useEffect(() => {
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  if (!user) {
    return (
      <View testID="otp-screen" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, padding: 24 }}>
        <Text style={[font.body, { color: c.text }]}>Your verification session has ended.</Text>
        <Button testID="otp-back-to-login" title="Back to sign in" onPress={() => router.replace('/login')} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const setDigit = (i: number, v: string) => {
    setError(null);
    const clean = v.replace(/[^0-9]/g, '');
    if (clean.length > 1) {
      // Pasted / autofilled the whole code.
      const arr = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''].map((_, k) => arr[k] ?? '');
      setDigits(next);
      refs.current[Math.min(arr.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const entered = digits.join('');
    if (entered.length < 6) return;
    setVerifying(true);
    await sleep(700);
    setVerifying(false);
    if (entered !== code) {
      setError('Incorrect OTP. Please check the SMS and try again.');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
      return;
    }
    actions.signIn(user, remember === '1');
    router.dismissAll?.();
    router.replace('/home');
  };

  const masked = `+91 ${user.phone.slice(0, 5)} •••${user.phone.slice(-2)}`;
  const mm = Math.floor(seconds / 60);
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <KeyboardAvoidingView testID="otp-screen" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader testID="otp-header" title="Verification" showCart={false} onBack={() => { actions.setPendingUser(null); router.back(); }} />
      <View style={{ padding: 24, gap: 10 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chatbox-ellipses-outline" size={30} color={c.primary} />
        </View>
        <Text testID="otp-title" style={[font.h1, { color: c.text, marginTop: 10 }]}>
          {t('otp.title')}
        </Text>
        <Text testID="otp-subtitle" style={[font.body, { color: c.textMuted, fontSize: 15, lineHeight: 22 }]}>
          Enter the 6-digit code sent to <Text style={{ color: c.text, fontWeight: '700' }}>{masked}</Text>
        </Text>

        <View testID="otp-inputs" style={{ flexDirection: 'row', gap: 10, marginTop: 22, justifyContent: 'space-between' }}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                refs.current[i] = r;
              }}
              testID={`otp-input-${i}`}
              accessibilityLabel={`OTP digit ${i + 1}`}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete={i === 0 ? 'sms-otp' : 'off'}
              maxLength={i === 0 ? 6 : 1}
              autoFocus={i === 0}
              selectTextOnFocus
              style={{
                flex: 1,
                height: 56,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: error ? c.danger : d ? c.primary : c.border,
                backgroundColor: c.card,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: '800',
                color: c.text,
              }}
            />
          ))}
        </View>
        {error ? (
          <Text testID="otp-error" style={[font.small, { color: c.danger, marginTop: 4 }]}>
            {error}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 }}>
          <Text style={[font.body, { color: c.textMuted }]}>Didn’t get the code?</Text>
          {seconds > 0 ? (
            <Text testID="otp-resend-timer" style={[font.bodyStrong, { color: c.textMuted }]}>
              Resend in {mm}:{ss}
            </Text>
          ) : resends >= 3 ? (
            <Text testID="otp-resend-limit" style={[font.bodyStrong, { color: c.danger }]}>
              Resend limit reached
            </Text>
          ) : (
            <Pressable
              testID="otp-resend-button"
              accessibilityRole="button"
              onPress={() => {
                setResends((r) => r + 1);
                setSeconds(RESEND_SECONDS);
                setDigits(['', '', '', '', '', '']);
                send();
              }}
            >
              <Text style={[font.bodyStrong, { color: c.primary }]}>Resend OTP</Text>
            </Pressable>
          )}
        </View>

        <Button
          testID="otp-verify-button"
          title={t('otp.verify')}
          size="lg"
          loading={verifying}
          disabled={digits.join('').length < 6}
          onPress={verify}
          style={{ marginTop: 26 }}
        />
        <Text style={[font.small, { color: c.textFaint, textAlign: 'center', marginTop: 8 }]}>Never share your OTP with anyone, including StockPilot staff.</Text>
      </View>

      {sms ? (
        <Animated.View style={{ position: 'absolute', top: insets.top + 6, left: 10, right: 10, transform: [{ translateY: smsAnim }] }}>
          <Pressable
            testID="otp-sms-banner"
            accessibilityLabel="Incoming SMS. Tap to autofill"
            onPress={() => setDigit(0, sms)}
            style={{ backgroundColor: c.card, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, elevation: 10, borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#2DB84B', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chatbubble" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[font.small, { color: c.textMuted, fontWeight: '700' }]}>MESSAGES · VM-SPILOT</Text>
                <Text style={[font.small, { color: c.textFaint }]}>now</Text>
              </View>
              <Text testID="otp-sms-text" style={[font.body, { color: c.text, marginTop: 3 }]}>
                {sms} is your StockPilot verification code. It expires in 10 minutes. Do not share it with anyone. -SPILOT
              </Text>
              <Text style={[font.small, { color: c.primary, fontWeight: '700', marginTop: 4 }]}>Tap to autofill</Text>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
