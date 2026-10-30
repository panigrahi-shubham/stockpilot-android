import React, { useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/state/AppContext';
import { LEAD_STATUS_META, LeadStatus } from '@/data/marketplace';
import { fmtDateTime, inr } from '@/utils/format';
import { font, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, Button, Card, EmptyState, RadioGroup, Row, TextField } from '@/components/ui';
import { ConfirmDialog, Sheet, useToast } from '@/components/overlays';

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const lead = state.leads.find((l) => l.id === id);
  const [callDialog, setCallDialog] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [quoteErr, setQuoteErr] = useState<string | null>(null);

  if (!lead)
    return (
      <Screen testID="lead-detail-screen">
        <AppHeader testID="lead-detail-header" title="Lead" showCart={false} />
        <EmptyState testID="lead-not-found" icon="search" title="Lead not found" action="All leads" onAction={() => router.replace('/seller/leads')} />
      </Screen>
    );

  const changeStatus = (s: LeadStatus) => {
    if (s === 'quoted') {
      setQuote(lead.quotePrice ? String(lead.quotePrice) : '');
      setQuoteOpen(true);
      return;
    }
    actions.setLeadStatus(lead.id, s);
    toast.show(`Lead marked as ${LEAD_STATUS_META[s].label}`, 'success');
  };

  const sendQuote = () => {
    const p = Number(quote);
    if (!p || p <= 0) return setQuoteErr('Enter a price per unit');
    actions.setLead(lead.id, { status: 'quoted', quotePrice: p });
    setQuoteOpen(false);
    toast.show(`Quotation of ${inr(p, { decimals: false })}/${lead.unit} sent to ${lead.buyerName}`, 'success');
  };

  const replyInChat = () => {
    const cid = lead.conversationId ?? `C-lead-${lead.id}`;
    actions.ensureConversation({
      id: cid,
      name: lead.buyerName,
      company: lead.company,
      role: 'Buyer',
      color: '#2E6BD8',
      starred: false,
      archived: false,
      unread: 0,
      messages: [{ id: `q-${lead.id}`, from: 'them', text: lead.requirement, at: lead.createdAt }],
      quickReplies: ['Please share your GSTIN', 'What is your delivery address?', 'Sending price list'],
    });
    if (!lead.conversationId) actions.setLead(lead.id, { conversationId: cid });
    if (lead.status === 'new') actions.setLeadStatus(lead.id, 'contacted');
    router.push({ pathname: '/chat', params: { cid } });
  };

  return (
    <Screen testID="lead-detail-screen">
      <AppHeader testID="lead-detail-header" title={lead.company} subtitle={`${lead.id} · ${fmtDateTime(lead.createdAt)}`} showCart={false} />
      <ScrollView testID="lead-detail-scroll" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <Card style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={[font.h3, { color: c.text, flex: 1 }]}>Buyer</Text>
            <Badge testID="lead-detail-status" label={LEAD_STATUS_META[lead.status].label} tone={LEAD_STATUS_META[lead.status].tone} />
          </View>
          <Row label="Name" value={lead.buyerName} testID="lead-detail-buyer" />
          <Row label="Company" value={lead.company} />
          <Row label="City" value={lead.city} testID="lead-detail-city" />
          <Row label="Phone" value={`+91 ${lead.phone.slice(0, 5)} ${lead.phone.slice(5)}`} testID="lead-detail-phone" />
          <Row label="Source" value={lead.source === 'enquiry-form' ? '“Get best price” form' : 'Marketplace listing'} />
        </Card>
        <Card style={{ gap: 6 }}>
          <Text style={[font.h3, { color: c.text }]}>Requirement</Text>
          <Text testID="lead-detail-product" style={[font.bodyStrong, { color: c.text }]}>
            {lead.quantity} {lead.unit} · {lead.productTitle}
          </Text>
          <Text testID="lead-detail-requirement" style={[font.body, { color: c.textMuted, lineHeight: 20 }]}>
            “{lead.requirement}”
          </Text>
          {lead.quotePrice ? (
            <Text testID="lead-detail-quote" style={[font.bodyStrong, { color: c.success }]}>
              Your quote: {inr(lead.quotePrice, { decimals: false })} per {lead.unit}
            </Text>
          ) : null}
        </Card>

        <Text style={[font.h3, { color: c.text }]}>Lead status</Text>
        <RadioGroup
          testID="lead-status-select"
          value={lead.status}
          onChange={changeStatus}
          options={(['new', 'contacted', 'quoted', 'closed'] as LeadStatus[]).map((s) => ({
            value: s,
            label: LEAD_STATUS_META[s].label,
            description: { new: 'Not contacted yet', contacted: 'You have called or messaged', quoted: 'Price shared with buyer', closed: 'Won or lost — no further action' }[s],
          }))}
        />

        <View style={{ gap: 10 }}>
          <Button testID="lead-reply-chat-button" title="Reply in chat" icon="chatbubbles-outline" onPress={replyInChat} />
          <Button testID="lead-call-button" title="Call buyer" icon="call-outline" variant="secondary" onPress={() => setCallDialog(true)} />
          {lead.whatsapp ? (
            <Button
              testID="lead-whatsapp-button"
              title="Message on WhatsApp"
              icon="logo-whatsapp"
              variant="outline"
              onPress={() => Linking.openURL(`https://wa.me/91${lead.phone}?text=${encodeURIComponent(`Hi ${lead.buyerName}, regarding your enquiry for ${lead.productTitle}`)}`)}
            />
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        testID="call-buyer-dialog"
        visible={callDialog}
        title={`Call ${lead.buyerName}?`}
        message={`+91 ${lead.phone} · Calls are recorded for quality as per StockPilot seller policy.`}
        confirmLabel="Call now"
        onCancel={() => setCallDialog(false)}
        onConfirm={() => {
          setCallDialog(false);
          if (lead.status === 'new') actions.setLeadStatus(lead.id, 'contacted');
          Linking.openURL(`tel:${lead.phone}`).catch(() => toast.show('Calling is not available on this device', 'error'));
        }}
      />
      <Sheet visible={quoteOpen} onClose={() => setQuoteOpen(false)} title="Send quotation" testID="lead-quote-sheet" footer={<Button testID="lead-quote-send-button" title="Send quotation" onPress={sendQuote} />}>
        <TextField testID="lead-quote-input" label={`Price per ${lead.unit} (₹)`} keyboardType="number-pad" value={quote} onChangeText={(v) => { setQuote(v.replace(/[^0-9]/g, '')); setQuoteErr(null); }} error={quoteErr} />
        {Number(quote) > 0 ? (
          <Text testID="lead-quote-total" style={[font.small, { color: c.textMuted, marginTop: 8 }]}>
            Order value for {lead.quantity} {lead.unit}: {inr(Number(quote) * lead.quantity, { decimals: false })}
          </Text>
        ) : null}
      </Sheet>
    </Screen>
  );
}
