import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { font, useTheme } from '@/theme';

export const APP_LOCK_PIN = '1234';
const LOCK_AFTER_MS = 5000;

/**
 * When "App lock" is ON (Settings → Security), sending the app to background for 5s+
 * shows this lock screen on return. Practise: driver.background(), biometrics, keypad taps.
 */
export function AppLock() {
  const { state, actions } = useApp();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const leftAt = useRef<number | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const enabled = state.settings.appLock && !!state.user;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (!enabled) return;
      if (next === 'background') leftAt.current = Date.now();
      if (next === 'active' && leftAt.current && Date.now() - leftAt.current >= LOCK_AFTER_MS) {
        setLocked(true);
        setPin('');
        setError('');
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const unlockBio = async () => {
    try {
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock StockPilot', fallbackLabel: 'Use PIN' });
      if (res.success) {
        setLocked(false);
        setAttempts(0);
      } else setError('Biometric authentication failed. Use your PIN.');
    } catch {
      setError('Biometrics not available on this device. Use your PIN.');
    }
  };

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      if (next === APP_LOCK_PIN) {
        setTimeout(() => {
          setLocked(false);
          setPin('');
          setAttempts(0);
        }, 150);
      } else {
        const a = attempts + 1;
        setAttempts(a);
        Animated.sequence(
          [10, -10, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true })),
        ).start();
        setTimeout(() => setPin(''), 300);
        if (a >= 3) {
          setLocked(false);
          setAttempts(0);
          actions.signOut();
        } else setError(`Incorrect PIN. ${3 - a} attempt${3 - a === 1 ? '' : 's'} left.`);
      }
    }
  };

  if (!locked || !enabled) return null;

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
  return (
    <View
      testID="app-lock-screen"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.primary, paddingTop: insets.top + 40, alignItems: 'center' }}
    >
      <Ionicons name="lock-closed-outline" size={42} color="#fff" />
      <Text style={[font.h2, { color: '#fff', marginTop: 14 }]}>StockPilot is locked</Text>
      <Text style={[font.body, { color: 'rgba(255,255,255,0.8)', marginTop: 6 }]}>Enter your 4-digit app PIN</Text>
      <Animated.View testID="app-lock-dots" style={{ flexDirection: 'row', gap: 18, marginTop: 28, transform: [{ translateX: shake }] }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff', backgroundColor: pin.length > i ? '#fff' : 'transparent' }} />
        ))}
      </Animated.View>
      <Text testID="app-lock-error" style={[font.small, { color: '#FFD6A0', marginTop: 16, minHeight: 18 }]}>
        {error}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 270, marginTop: 16, justifyContent: 'center' }}>
        {keys.map((k) => (
          <Pressable
            key={k}
            testID={k === 'bio' ? 'app-lock-biometric' : k === 'del' ? 'app-lock-delete' : `app-lock-key-${k}`}
            accessibilityRole="button"
            accessibilityLabel={k === 'bio' ? 'Unlock with biometrics' : k === 'del' ? 'Delete' : k}
            onPress={() => (k === 'bio' ? unlockBio() : k === 'del' ? setPin((p) => p.slice(0, -1)) : press(k))}
            style={({ pressed }) => ({
              width: 74,
              height: 74,
              margin: 7,
              borderRadius: 37,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255,255,255,0.25)' : k === 'bio' || k === 'del' ? 'transparent' : 'rgba(255,255,255,0.12)',
            })}
          >
            {k === 'bio' ? (
              <Ionicons name="finger-print" size={30} color="#fff" />
            ) : k === 'del' ? (
              <Ionicons name="backspace-outline" size={28} color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '500' }}>{k}</Text>
            )}
          </Pressable>
        ))}
      </View>
      <Pressable testID="app-lock-signout" onPress={() => { setLocked(false); actions.signOut(); }} style={{ marginTop: 18 }}>
        <Text style={[font.bodyStrong, { color: 'rgba(255,255,255,0.85)' }]}>Sign out instead</Text>
      </Pressable>
    </View>
  );
}
