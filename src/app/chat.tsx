import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { runtime, useApp } from '@/state/AppContext';
import type { ChatMsg, Conversation } from '@/data/marketplace';
import { fmtTime, inr } from '@/utils/format';
import { font, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Chip, EmptyState, IconButton } from '@/components/ui';
import { useToast } from '@/components/overlays';

function botReply(c: Conversation, text: string): string {
  const t = text.toLowerCase();
  const s = runtime.state;
  if (c.role === 'Buyer') {
    if (/gstin/.test(t)) return 'Our GSTIN is 37AAKFN4321R1ZP. Please send the proforma invoice.';
    if (/address/.test(t)) return 'Plot 22, Brodipet 4th line, Guntur 522002.';
    if (/₹|price|rate|best/.test(t)) return 'Okay, ₹1,800 works if you give 15 days credit. Confirm?';
    return 'Noted 👍 Will get back to you by evening.';
  }
  if (c.role === 'Supplier') {
    if (/price|list|catalogue/.test(t)) return 'Sharing the latest price list. Rates valid till Friday.';
    if (/moq/.test(t)) return 'MOQ is 50 bags for direct dispatch, 10 bags via StockPilot.';
    return 'Sure, I will check and revert.';
  }
  if (c.role === 'Logistics') return 'Driver will call 15 minutes before arrival. ETA 3–5 PM.';
  if (/order|track|where/.test(t)) {
    const o = s.orders.find((x) => ['shipped', 'out_for_delivery', 'packed', 'confirmed'].includes(x.status));
    return o ? `Your latest active order ${o.id} is “${o.status.replace(/_/g, ' ')}”. You can track it from Orders → ${o.id}.` : 'You have no active orders right now.';
  }
  if (/credit|limit/.test(t) && s.user) {
    const u = s.user;
    return `Your limit is ${inr(u.creditLimit, { decimals: false })} with ${inr(u.creditLimit - u.creditUsed, { decimals: false })} available. I’ve raised a limit-review request — the credit team will call within 2 working days.`;
  }
  if (/slot|date|deliver/.test(t)) return 'Slots can be changed until the order is packed. Share the order ID and the new slot.';
  if (/human|agent|call/.test(t)) return 'Sure! Ramesh from support will call your registered number in about 10 minutes.';
  if (/hi|hello|hey|namaste/.test(t)) return 'Hello! 👋 How can I help your store today?';
  return 'Got it. Let me check that for you — I’ll get back within a few minutes.';
}

/** One conversation. Open with /chat?cid=C-rm (default = your relationship manager). */
export default function Chat() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { cid = 'C-rm', orderId } = useLocalSearchParams<{ cid?: string; orderId?: string }>();
  const { state, actions } = useApp();
  const conv = state.conversations.find((x) => x.id === cid);
  const [text, setText] = useState(orderId ? `Hi, I need help with order ${orderId}` : '');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const count = conv?.messages.length ?? 0;

  useEffect(() => {
    if (conv?.unread) actions.markConversationRead(conv.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, count]);
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [count, typing]);

  if (!conv)
    return (
      <Screen testID="chat-screen">
        <AppHeader testID="chat-header" title="Chat" showCart={false} />
        <EmptyState testID="chat-not-found" icon="chatbubbles-outline" title="Conversation not found" subtitle="It may have been deleted." action="Open inbox" onAction={() => router.replace('/messages')} />
      </Screen>
    );

  const send = (body: string, attachment?: string) => {
    const msg = body.trim();
    if (!msg && !attachment) return;
    const id = `m${Date.now()}`;
    actions.pushMessage(conv.id, { id, from: 'me', text: msg || 'Sent an attachment', attachment, at: new Date().toISOString(), status: 'sent' });
    setText('');
    // Sent → Delivered → Read: watch the status label change under your last message.
    setTimeout(() => actions.setMessageStatus(conv.id, id, 'delivered'), 900);
    setTimeout(() => {
      actions.setMessageStatus(conv.id, id, 'read');
      setTyping(true);
    }, 1800);
    setTimeout(() => {
      setTyping(false);
      actions.pushMessage(conv.id, {
        id: `r${Date.now()}`,
        from: 'them',
        text: attachment ? `Thanks, I’ve received “${attachment}”. I’ll review it and update you.` : botReply(conv, msg),
        at: new Date().toISOString(),
      });
    }, 4500);
  };

  const attach = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
    if (!res.canceled && res.assets[0]) send('', res.assets[0].name);
  };

  const lastMineIdx = conv.messages.map((m) => m.from).lastIndexOf('me');

  return (
    <Screen testID="chat-screen">
      <AppHeader
        testID="chat-header"
        title={`${conv.name} · ${conv.company}`}
        subtitle={typing ? 'typing…' : conv.role}
        showCart={false}
        right={
          <IconButton
            testID="chat-star-button"
            label={conv.starred ? 'Unstar conversation' : 'Star conversation'}
            icon={conv.starred ? 'star' : 'star-outline'}
            color={conv.starred ? c.accent : c.text}
            onPress={() => {
              actions.toggleStar(conv.id);
              toast.show(conv.starred ? 'Removed from starred' : 'Starred', 'success');
            }}
          />
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          testID="chat-messages"
          data={conv.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: m, index }) => {
            const mine = m.from === 'me';
            return (
              <View testID={`chat-message-${index}`} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <View style={{ backgroundColor: mine ? c.primary : c.card, borderRadius: 18, borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4, padding: 12, borderWidth: mine ? 0 : 1, borderColor: c.border }}>
                  {m.attachment ? (
                    <View testID={`chat-attachment-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, backgroundColor: mine ? 'rgba(255,255,255,0.15)' : c.cardAlt, padding: 8, borderRadius: 10 }}>
                      <Ionicons name="document-attach-outline" size={16} color={mine ? c.onPrimary : c.primary} />
                      <Text numberOfLines={1} style={[font.small, { color: mine ? c.onPrimary : c.text, fontWeight: '700', flexShrink: 1 }]}>
                        {m.attachment}
                      </Text>
                    </View>
                  ) : null}
                  <Text testID={`chat-message-text-${index}`} style={[font.body, { color: mine ? c.onPrimary : c.text, lineHeight: 20 }]}>
                    {m.text}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignSelf: mine ? 'flex-end' : 'flex-start', gap: 4, marginTop: 3, alignItems: 'center' }}>
                  <Text style={[font.tiny, { color: c.textFaint }]}>{fmtTime(m.at)}</Text>
                  {mine && index === lastMineIdx ? (
                    <>
                      <Ionicons name={m.status === 'sent' ? 'checkmark' : 'checkmark-done'} size={13} color={m.status === 'read' ? c.info : c.textFaint} />
                      <Text testID="chat-last-status" style={[font.tiny, { color: m.status === 'read' ? c.info : c.textFaint }]}>
                        {m.status === 'read' ? 'Read' : m.status === 'delivered' ? 'Delivered' : 'Sent'}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            typing ? (
              <View testID="chat-typing-indicator" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <View style={{ backgroundColor: c.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: c.border }}>
                  <Text style={[font.bodyStrong, { color: c.textMuted, letterSpacing: 2 }]}>•••</Text>
                </View>
                <Text style={[font.small, { color: c.textMuted }]}>{conv.name.split(' ')[0]} is typing…</Text>
              </View>
            ) : undefined
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }} style={{ flexGrow: 0 }}>
          {conv.quickReplies.map((q, i) => (
            <Chip key={q} testID={`chat-quick-reply-${i}`} label={q} onPress={() => send(q)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
          <Pressable testID="chat-attach-button" accessibilityLabel="Attach file" onPress={attach} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="attach" size={24} color={c.textMuted} />
          </Pressable>
          <TextInput
            testID="chat-input"
            accessibilityLabel="Type a message"
            placeholder="Type a message"
            placeholderTextColor={c.textFaint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            style={[font.body, { flex: 1, maxHeight: 110, minHeight: 42, backgroundColor: c.cardAlt, borderRadius: 21, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, color: c.text, fontSize: 15 }]}
          />
          <Pressable
            testID="chat-send-button"
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !text.trim() }}
            disabled={!text.trim()}
            onPress={() => send(text)}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: text.trim() ? c.primary : c.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="send" size={18} color={text.trim() ? c.onPrimary : c.textFaint} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
