import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { PRODUCTS, PRODUCT_BY_EAN, Product } from '@/data/catalog';
import { inr, validators } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, ProductArt, Screen } from '@/components/chrome';
import { Button, Card, TextField } from '@/components/ui';
import { useToast } from '@/components/overlays';

const SAMPLE_EANS = [PRODUCTS[0].ean, PRODUCTS[7].ean, PRODUCTS[25].ean];

export default function Scan() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const focused = useIsFocused();
  const { state, actions } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [result, setResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const line = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(line, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(line, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [line]);

  const lookup = async (code: string) => {
    setBusy(true);
    setNotFound(null);
    setResult(null);
    try {
      const p = await api.lookupBarcode(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      actions.pushRecentScan(code);
      setResult(p);
    } catch (e: any) {
      if (e?.code === 'NOT_FOUND') setNotFound(e.message);
      else onError(e);
    } finally {
      setBusy(false);
    }
  };

  const onScanned = ({ data }: { data: string }) => {
    const now = Date.now();
    if (busy || (lastScan.current && lastScan.current.code === data && now - lastScan.current.at < 3000)) return;
    lastScan.current = { code: data, at: now };
    lookup(data);
  };

  const submitManual = () => {
    const code = manual.trim();
    if (!validators.ean13(code)) {
      setManualError('Invalid barcode. Enter 13 digits with a valid check digit.');
      return;
    }
    setManualError(null);
    lookup(code);
  };

  const granted = permission?.granted;

  return (
    <Screen testID="scan-screen">
      <AppHeader testID="scan-header" mode="menu" title="Scan & order" subtitle="Point at any product barcode" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView testID="scan-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          {!permission ? null : !granted ? (
            <Card testID="scan-permission-card" style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="camera-outline" size={36} color={c.primary} />
              </View>
              <Text style={[font.h2, { color: c.text, textAlign: 'center' }]}>Allow camera access</Text>
              <Text testID="scan-permission-message" style={[font.body, { color: c.textMuted, textAlign: 'center', lineHeight: 20 }]}>
                {permission.canAskAgain
                  ? 'StockPilot uses your camera only to read product barcodes. Nothing is recorded or uploaded.'
                  : 'Camera access was denied. Enable it from Settings → Apps → StockPilot → Permissions.'}
              </Text>
              {permission.canAskAgain ? (
                <Button testID="scan-allow-camera-button" title="Allow camera" icon="camera-outline" onPress={requestPermission} full={false} style={{ marginTop: 8 }} />
              ) : (
                <Button testID="scan-open-settings-button" title="Open settings" icon="settings-outline" onPress={() => Linking.openSettings()} full={false} style={{ marginTop: 8 }} />
              )}
            </Card>
          ) : (
            <View testID="scan-camera-container" style={{ height: 300, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#000' }}>
              {focused ? (
                <CameraView
                  testID="scan-camera"
                  style={{ flex: 1 }}
                  facing="back"
                  enableTorch={torch}
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr'] }}
                  onBarcodeScanned={onScanned}
                />
              ) : null}
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 250, height: 150, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' }}>
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 10,
                      right: 10,
                      height: 2,
                      backgroundColor: '#F5A524',
                      transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [8, 138] }) }],
                    }}
                  />
                </View>
                <Text style={[font.small, { color: '#fff', marginTop: 14, fontWeight: '700' }]}>Align the barcode inside the frame</Text>
              </View>
              <Pressable
                testID="scan-torch-toggle"
                accessibilityRole="switch"
                accessibilityState={{ checked: torch }}
                accessibilityLabel="Torch"
                onPress={() => setTorch((t) => !t)}
                style={{ position: 'absolute', right: 14, top: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={torch ? 'flash' : 'flash-off'} size={20} color="#fff" />
              </Pressable>
            </View>
          )}

          {result ? (
            <Card testID="scan-result-card" style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <ProductArt product={result} size={70} />
                <View style={{ flex: 1 }}>
                  <Text testID="scan-result-name" style={[font.bodyStrong, { color: c.text }]}>
                    {result.name}
                  </Text>
                  <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>EAN {result.ean}</Text>
                  <Text testID="scan-result-price" style={[font.h3, { color: c.text, marginTop: 4 }]}>
                    {inr(result.price)}
                  </Text>
                </View>
                <Pressable testID="scan-result-dismiss" accessibilityLabel="Dismiss result" onPress={() => setResult(null)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={c.textMuted} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button testID="scan-result-view-button" title="View" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/product/${result.sku}`)} />
                <Button
                  testID="scan-result-add-button"
                  title={result.stock === 0 ? 'Out of stock' : `Add ${result.moq} to cart`}
                  disabled={result.stock === 0}
                  style={{ flex: 2 }}
                  onPress={() => {
                    actions.addToCart(result.sku, 'single', result.moq);
                    toast.show('Added to cart', 'success');
                    setResult(null);
                  }}
                />
              </View>
            </Card>
          ) : null}
          {notFound ? (
            <View testID="scan-not-found" style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.dangerSoft }}>
              <Ionicons name="alert-circle" size={20} color={c.danger} />
              <Text testID="scan-not-found-message" style={[font.body, { color: c.text, flex: 1 }]}>
                {notFound}
              </Text>
            </View>
          ) : null}

          <Card style={{ gap: 12 }}>
            <Text style={[font.h3, { color: c.text }]}>Enter barcode manually</Text>
            <TextField
              testID="scan-manual-input"
              placeholder="13-digit EAN e.g. 8904210001..."
              keyboardType="number-pad"
              maxLength={13}
              value={manual}
              onChangeText={(v) => {
                setManual(v.replace(/[^0-9]/g, ''));
                setManualError(null);
              }}
              error={manualError}
              icon="barcode-outline"
              onSubmitEditing={submitManual}
              returnKeyType="search"
            />
            <Button testID="scan-manual-submit-button" title="Look up" icon="search" loading={busy} onPress={submitManual} />
            <View>
              <Text style={[font.small, { color: c.textMuted, fontWeight: '700', marginBottom: 6 }]}>NO BARCODE HANDY? TRY ONE OF THESE</Text>
              {SAMPLE_EANS.map((e, i) => (
                <Pressable key={e} testID={`scan-sample-${i}`} onPress={() => setManual(e)} style={{ paddingVertical: 6, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Ionicons name="barcode-outline" size={16} color={c.primary} />
                  <Text style={[font.body, { color: c.primary, fontVariant: ['tabular-nums'] }]}>{e}</Text>
                  <Text style={[font.small, { color: c.textFaint, flex: 1 }]} numberOfLines={1}>
                    {PRODUCT_BY_EAN[e]?.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {state.recentScans.length ? (
            <View testID="scan-recent">
              <Text style={[font.h3, { color: c.text, marginBottom: 8 }]}>Recent scans</Text>
              {state.recentScans.map((e, i) => (
                <Pressable key={e} testID={`scan-recent-${i}`} onPress={() => lookup(e)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <Text style={[font.bodyStrong, { color: c.text }]}>{PRODUCT_BY_EAN[e]?.name ?? e}</Text>
                  <Text style={[font.small, { color: c.textMuted }]}>{e}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
