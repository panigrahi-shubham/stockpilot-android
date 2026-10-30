import React, { useState } from 'react';
import { LayoutAnimation, Linking, Platform, Pressable, ScrollView, Text, TextInput, UIManager, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FAQS } from '@/data/seed';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Card, EmptyState, ListRow } from '@/components/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

export default function Help() {
  const { c } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const list = FAQS.map((f, i) => ({ ...f, i })).filter((f) => !q || (f.q + f.a).toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen testID="help-screen">
      <AppHeader testID="help-header" title="Help & FAQs" showCart={false} />
      <ScrollView testID="help-scroll" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View style={{ height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search" size={18} color={c.textFaint} />
          <TextInput testID="help-search-input" placeholder="Search help articles" placeholderTextColor={c.textFaint} value={q} onChangeText={setQ} style={[font.body, { flex: 1, color: c.text }]} />
        </View>

        <View testID="faq-list" style={{ gap: 10 }}>
          {list.map((f) => {
            const isOpen = open === f.i;
            return (
              <View key={f.i} testID={`faq-item-${f.i}`} style={{ backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: isOpen ? c.primary : c.border, overflow: 'hidden' }}>
                <Pressable
                  testID={`faq-question-${f.i}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOpen(isOpen ? null : f.i);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}
                >
                  <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>{f.q}</Text>
                  <Ionicons name={isOpen ? 'remove' : 'add'} size={20} color={c.primary} />
                </Pressable>
                {isOpen ? (
                  <Text testID={`faq-answer-${f.i}`} style={[font.body, { color: c.textMuted, paddingHorizontal: 14, paddingBottom: 14, lineHeight: 21 }]}>
                    {f.a}
                  </Text>
                ) : null}
              </View>
            );
          })}
          {!list.length ? <EmptyState testID="faq-empty" icon="help-circle-outline" title="No matching articles" subtitle="Try another keyword or contact us below." /> : null}
        </View>

        <Text style={[font.h3, { color: c.text }]}>Still need help?</Text>
        <Card style={{ paddingVertical: 4 }}>
          <ListRow testID="help-chat" icon="chatbubbles-outline" title="Chat with your RM" subtitle="Mon–Sat, 8 AM – 9 PM" onPress={() => router.push('/chat')} />
          <ListRow testID="help-call" icon="call-outline" title="Call 1800-120-7788" subtitle="Toll free" onPress={() => Linking.openURL('tel:18001207788')} />
          <ListRow testID="help-email" icon="mail-outline" title="Email support@stockpilot.in" onPress={() => Linking.openURL('mailto:support@stockpilot.in?subject=StockPilot%20support')} />
          <ListRow testID="help-whatsapp" icon="logo-whatsapp" title="WhatsApp us" subtitle="Opens WhatsApp or your browser" onPress={() => Linking.openURL('https://wa.me/919000012345?text=Hi%20StockPilot')} />
          <ListRow testID="help-center" icon="globe-outline" title="Help centre (web)" subtitle="Opens inside the app" onPress={() => router.push({ pathname: '/webview', params: { doc: 'help' } })} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
