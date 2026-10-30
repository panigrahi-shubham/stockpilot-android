import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { KycDocId, useApp } from '@/state/AppContext';
import { fmtDate } from '@/utils/format';
import { font, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, Button, Card, ProgressBar } from '@/components/ui';
import { LoadingOverlay, useToast } from '@/components/overlays';

const DOCS: { id: KycDocId; title: string; hint: string }[] = [
  { id: 'gst', title: 'GST registration certificate', hint: 'Form GST REG-06 · PDF or image' },
  { id: 'pan', title: 'Business PAN card', hint: 'Front side, all 4 corners visible' },
  { id: 'licence', title: 'Trade licence / Shop & Establishment', hint: 'Issued by your municipality' },
  { id: 'cheque', title: 'Cancelled cheque', hint: 'Must show account holder name' },
];
const MAX_BYTES = 5 * 1024 * 1024;

export default function Kyc() {
  const { c } = useTheme();
  const toast = useToast();
  const { state, actions } = useApp();
  const [progress, setProgress] = useState<Partial<Record<KycDocId, number>>>({});
  const [errors, setErrors] = useState<Partial<Record<KycDocId, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const user = state.user!;
  const uploaded = DOCS.filter((d) => state.kyc[d.id].status !== 'missing' && state.kyc[d.id].status !== 'rejected').length;

  const upload = async (id: KycDocId) => {
    setErrors((e) => ({ ...e, [id]: undefined }));
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: false });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    if (a.size && a.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, [id]: `File is ${(a.size! / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 5 MB.` }));
      return;
    }
    if (a.mimeType && !/pdf|jpeg|jpg|png/.test(a.mimeType)) {
      setErrors((e) => ({ ...e, [id]: 'Only PDF, JPG or PNG files are accepted.' }));
      return;
    }
    // Simulated chunked upload with a progress bar (practise waiting for 100%).
    for (let p = 0; p <= 100; p += 10) {
      setProgress((x) => ({ ...x, [id]: p }));
      await new Promise((r) => setTimeout(r, 180 + Math.random() * 120));
    }
    setProgress((x) => ({ ...x, [id]: undefined }));
    actions.setKyc(id, { status: 'review', fileName: a.name, uploadedAt: new Date().toISOString() });
    toast.show(`${a.name} uploaded`, 'success');
  };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2500));
    DOCS.forEach((d) => actions.setKyc(d.id, { ...state.kyc[d.id], status: 'verified' }));
    actions.updateUser({ kyc: 'verified', creditLimit: user.creditLimit || 250000, gstin: user.gstin || '37AAKFN4321R1ZP' });
    setSubmitting(false);
    toast.show('KYC verified! Credit line of ₹2,50,000 activated.', 'success');
  };

  return (
    <Screen testID="kyc-screen">
      <AppHeader testID="kyc-header" title="KYC documents" subtitle={`${uploaded} of 4 uploaded`} showCart={false} />
      <ScrollView testID="kyc-scroll" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: user.kyc === 'verified' ? c.successSoft : c.warningSoft }}>
          <Ionicons name={user.kyc === 'verified' ? 'shield-checkmark' : 'shield-outline'} size={28} color={user.kyc === 'verified' ? c.success : c.warning} />
          <View style={{ flex: 1 }}>
            <Text testID="kyc-overall-status" style={[font.h3, { color: c.text }]}>
              {user.kyc === 'verified' ? 'Your business is verified' : 'Verification pending'}
            </Text>
            <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
              {user.kyc === 'verified' ? 'You can update documents any time. Changes are re-verified within 24 hours.' : 'Upload all 4 documents to unlock ordering and your credit line.'}
            </Text>
          </View>
        </Card>
        {DOCS.map((d) => {
          const doc = state.kyc[d.id];
          const prog = progress[d.id];
          const tone = { verified: 'success', review: 'info', rejected: 'danger', missing: 'neutral' }[doc.status] as any;
          const label = { verified: 'Verified', review: 'Under review', rejected: 'Rejected', missing: 'Not uploaded' }[doc.status];
          return (
            <Card key={d.id} testID={`kyc-doc-${d.id}`} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="document-text-outline" size={20} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[font.bodyStrong, { color: c.text }]}>{d.title}</Text>
                  <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{doc.fileName ? `${doc.fileName} · ${fmtDate(doc.uploadedAt!)}` : d.hint}</Text>
                </View>
                <Badge testID={`kyc-doc-${d.id}-status`} label={label} tone={tone} />
              </View>
              {prog !== undefined ? (
                <View style={{ gap: 6 }}>
                  <ProgressBar testID={`kyc-upload-progress-${d.id}`} value={prog / 100} />
                  <Text testID={`kyc-upload-percent-${d.id}`} style={[font.small, { color: c.textMuted }]}>
                    Uploading… {prog}%
                  </Text>
                </View>
              ) : (
                <Button
                  testID={`kyc-upload-${d.id}`}
                  title={doc.status === 'missing' ? 'Upload' : 'Replace file'}
                  icon="cloud-upload-outline"
                  variant={doc.status === 'missing' ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => upload(d.id)}
                />
              )}
              {errors[d.id] ? (
                <Text testID={`kyc-doc-${d.id}-error`} style={[font.small, { color: c.danger }]}>
                  {errors[d.id]}
                </Text>
              ) : null}
            </Card>
          );
        })}
        {user.kyc !== 'verified' ? (
          <Button testID="kyc-submit-button" title="Submit for verification" disabled={uploaded < 4} onPress={submit} />
        ) : null}
        <Text style={[font.small, { color: c.textFaint, textAlign: 'center' }]}>Documents are encrypted and only used for verification as per RBI KYC norms.</Text>
      </ScrollView>
      <LoadingOverlay visible={submitting} message="Verifying documents with GSTN…" />
    </Screen>
  );
}

