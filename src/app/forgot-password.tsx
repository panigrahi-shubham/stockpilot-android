import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, errorMessage } from '@/data/api';
import { validators } from '@/utils/format';
import { font, useTheme } from '@/theme';
import { Button, TextField } from '@/components/ui';
import { AppHeader } from '@/components/chrome';

export default function ForgotPassword() {
  const { c } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!validators.email(email)) return setError('Enter a valid email address');
    setError(null);
    setBusy(true);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView testID="forgot-password-screen" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader testID="forgot-password-header" title="Reset password" showCart={false} />
      {sent ? (
        <View testID="forgot-password-success" style={{ padding: 28, alignItems: 'center', gap: 12, marginTop: 40 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: c.successSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="mail-unread-outline" size={42} color={c.success} />
          </View>
          <Text style={[font.h2, { color: c.text, textAlign: 'center' }]}>Check your inbox</Text>
          <Text testID="forgot-password-success-message" style={[font.body, { color: c.textMuted, textAlign: 'center', lineHeight: 21 }]}>
            We’ve sent a password reset link to {email.trim().toLowerCase()}. The link is valid for 30 minutes.
          </Text>
          <Button testID="forgot-password-back-button" title="Back to sign in" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <View style={{ padding: 24, gap: 18 }}>
          <Text style={[font.body, { color: c.textMuted, fontSize: 15, lineHeight: 22 }]}>
            Enter the email linked to your StockPilot business account and we’ll send you a link to reset your password.
          </Text>
          <TextField
            testID="forgot-password-email-input"
            label="Business email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={error}
            placeholder="you@business.com"
          />
          <Button testID="forgot-password-submit-button" title="Send reset link" loading={busy} onPress={submit} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
