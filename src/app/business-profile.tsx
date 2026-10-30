import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import { usePreventRemove, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { validators } from '@/utils/format';
import { gstinChecksumValid } from '@/data/online';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Card, Chip, RadioGroup, Stepper, TextField } from '@/components/ui';
import { ConfirmDialog, LoadingOverlay, SelectField, useToast } from '@/components/overlays';

const TYPES = ['Kirana / General store', 'Supermarket', 'Pharmacy', 'Hotel / Restaurant / Café', 'Wholesaler / Sub-distributor'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BusinessProfile() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const { state, actions } = useApp();
  const u = state.user!;
  const initial = {
    business: u.business,
    owner: u.name,
    phone: u.phone,
    gstin: u.gstin,
    pan: u.pan,
    type: TYPES[0] as string | null,
    size: 'medium' as 'small' | 'medium' | 'large',
    years: 6,
    offDays: ['Sun'] as string[],
    location: '',
  };
  const [f, setF] = useState(initial);
  const [e, setE] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [leave, setLeave] = useState<null | (() => void)>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  const disablePrevention = usePreventRemove(dirty && !saving, ({ repeat }) => setLeave(() => repeat));

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setE((x) => ({ ...x, [k]: undefined }));
  };

  const locate = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setE((x) => ({ ...x, location: 'Location permission denied. You can enable it in Settings.' }));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      set('location', `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy ?? 0)} m)`);
    } catch {
      setE((x) => ({ ...x, location: 'Could not fetch location. Is GPS turned on?' }));
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const er: Record<string, string> = {};
    if (f.business.trim().length < 3) er.business = 'Business name must be at least 3 characters';
    if (f.owner.trim().length < 3) er.owner = 'Enter the owner’s full name';
    if (!validators.phone(f.phone)) er.phone = 'Enter a valid 10-digit Indian mobile number';
    if (f.gstin && !validators.gstin(f.gstin)) er.gstin = 'Invalid GSTIN format (e.g. 36AAPFS1234K1ZX)';
    else if (f.gstin && !gstinChecksumValid(f.gstin)) er.gstin = 'GSTIN check digit (15th character) is wrong — please re-check';
    if (!validators.pan(f.pan)) er.pan = 'Invalid PAN format (e.g. AAPFS1234K)';
    else if (f.gstin && validators.gstin(f.gstin) && f.gstin.toUpperCase().slice(2, 12) !== f.pan.toUpperCase()) er.pan = 'PAN doesn’t match the PAN inside your GSTIN (characters 3–12)';
    if (!f.type) er.type = 'Select your business type';
    if (f.offDays.length > 2) er.offDays = 'Select at most 2 weekly off days';
    setE(er);
    if (Object.keys(er).length) {
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSaving(true);
    try {
      await api.generic(true);
      actions.updateUser({ business: f.business.trim(), name: f.owner.trim(), phone: f.phone, gstin: f.gstin.toUpperCase(), pan: f.pan.toUpperCase() });
      disablePrevention();
      toast.show('Business profile updated', 'success');
      router.back();
    } catch (x) {
      onError(x);
    } finally {
      setSaving(false);
    }
  };

  const errCount = Object.values(e).filter(Boolean).length;

  return (
    <Screen testID="business-profile-screen">
      <AppHeader testID="business-profile-header" title="Business profile" subtitle={dirty ? 'Unsaved changes' : undefined} showCart={false} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroll} testID="business-profile-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
          {errCount ? (
            <View testID="business-profile-error-summary" style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: c.dangerSoft }}>
              <Ionicons name="alert-circle" size={18} color={c.danger} />
              <Text style={[font.small, { color: c.danger, fontWeight: '700', flex: 1 }]}>
                Please fix {errCount} field{errCount > 1 ? 's' : ''} below.
              </Text>
            </View>
          ) : null}
          <Card style={{ gap: 14 }}>
            <TextField testID="bp-business-input" label="Registered business name" value={f.business} onChangeText={(v) => set('business', v)} error={e.business} />
            <TextField testID="bp-owner-input" label="Owner / authorised signatory" value={f.owner} onChangeText={(v) => set('owner', v)} error={e.owner} />
            <TextField testID="bp-phone-input" label="Mobile" keyboardType="phone-pad" maxLength={10} value={f.phone} onChangeText={(v) => set('phone', v.replace(/[^0-9]/g, ''))} error={e.phone} icon="call-outline" />
            <TextField testID="bp-email-input" label="Login email (cannot be changed)" value={u.email} editable={false} icon="mail-outline" />
          </Card>
          <Card style={{ gap: 14 }}>
            <TextField testID="bp-gstin-input" label="GSTIN" autoCapitalize="characters" maxLength={15} value={f.gstin} onChangeText={(v) => set('gstin', v.toUpperCase())} error={e.gstin} hint="15 characters. Leave blank if unregistered." />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -6 }}>
              <Ionicons name={gstinChecksumValid(f.gstin) ? 'shield-checkmark' : 'shield-outline'} size={15} color={gstinChecksumValid(f.gstin) ? c.success : c.textFaint} />
              <Text testID="bp-gstin-check" style={[font.small, { flex: 1, color: gstinChecksumValid(f.gstin) ? c.success : c.textMuted }]}>
                {!f.gstin ? 'No GSTIN entered' : gstinChecksumValid(f.gstin) ? 'Checksum valid' : 'Checksum not valid yet'}
              </Text>
              <Pressable
                testID="bp-gst-portal-button"
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/browser', params: { url: 'https://services.gst.gov.in/services/searchtp' } })}
              >
                <Text style={[font.small, { color: c.primary, fontWeight: '800' }]}>Verify on GST portal ↗</Text>
              </Pressable>
            </View>
            <TextField testID="bp-pan-input" label="Business PAN" autoCapitalize="characters" maxLength={10} value={f.pan} onChangeText={(v) => set('pan', v.toUpperCase())} error={e.pan} />
            <SelectField testID="bp-type-select" label="Business type" value={f.type} options={TYPES.map((t) => ({ value: t, label: t }))} onChange={(v) => set('type', v)} error={e.type} />
          </Card>
          <Card style={{ gap: 14 }}>
            <Text style={[font.h3, { color: c.text }]}>Store size</Text>
            <RadioGroup
              testID="bp-size"
              horizontal
              value={f.size}
              onChange={(v) => set('size', v)}
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>Years in business</Text>
              <Stepper testID="bp-years" value={f.years} min={0} max={80} onChange={(v) => set('years', v)} />
            </View>
            <Text style={[font.bodyStrong, { color: c.text }]}>Weekly off (max 2)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DAYS.map((d) => (
                <Chip key={d} testID={`bp-offday-${d.toLowerCase()}`} label={d} selected={f.offDays.includes(d)} onPress={() => set('offDays', f.offDays.includes(d) ? f.offDays.filter((x) => x !== d) : [...f.offDays, d])} />
              ))}
            </View>
            {e.offDays ? <Text testID="bp-offday-error" style={[font.small, { color: c.danger }]}>{e.offDays}</Text> : null}
          </Card>
          <Card style={{ gap: 10 }}>
            <Text style={[font.h3, { color: c.text }]}>Store location</Text>
            <Text testID="bp-location-value" style={[font.body, { color: f.location ? c.text : c.textFaint }]}>
              {f.location || 'Not set'}
            </Text>
            {e.location ? <Text testID="bp-location-error" style={[font.small, { color: c.danger }]}>{e.location}</Text> : null}
            <Button testID="bp-location-button" title="Use current location" icon="locate-outline" variant="secondary" loading={locating} onPress={locate} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
        <Button testID="bp-save-button" title={dirty ? 'Save changes' : 'No changes to save'} disabled={!dirty} onPress={save} />
      </View>
      <ConfirmDialog
        testID="discard-changes-dialog"
        visible={!!leave}
        title="Discard changes?"
        message="You have unsaved changes to your business profile."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onCancel={() => setLeave(null)}
        onConfirm={() => {
          const go = leave;
          setLeave(null);
          go?.();
        }}
      />
      <LoadingOverlay visible={saving} message="Saving profile…" />
    </Screen>
  );
}
