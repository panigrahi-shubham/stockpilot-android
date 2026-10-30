import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';
import { LEAD_STATUS_META, LeadStatus } from '@/data/marketplace';
import { timeAgo } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, Chip, EmptyState } from '@/components/ui';

type Filter = 'all' | LeadStatus;

export default function Leads() {
  const { c } = useTheme();
  const router = useRouter();
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const leads = [...state.leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const list = leads.filter((l) => filter === 'all' || l.status === filter);
  const count = (f: Filter) => (f === 'all' ? leads.length : leads.filter((l) => l.status === f).length);

  return (
    <Screen testID="leads-screen">
      <AppHeader testID="leads-header" title="Leads & enquiries" subtitle={`${count('new')} new`} showCart={false} />
      <View style={{ backgroundColor: c.card, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {(['all', 'new', 'contacted', 'quoted', 'closed'] as Filter[]).map((f) => (
            <Chip key={f} testID={`leads-filter-${f}`} label={`${f === 'all' ? 'All' : LEAD_STATUS_META[f].label} (${count(f)})`} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        testID="leads-list"
        data={list}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        renderItem={({ item: l }) => (
          <Pressable testID={`lead-card-${l.id}`} accessibilityRole="button" accessibilityLabel={`Lead from ${l.company}, ${LEAD_STATUS_META[l.status].label}`} onPress={() => router.push(`/seller/lead/${l.id}`)}>
            <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: l.status === 'new' ? c.primary : c.border, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {l.status === 'new' ? <View testID={`lead-new-dot-${l.id}`} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger }} /> : null}
                <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]} numberOfLines={1}>
                  {l.company}
                </Text>
                <Badge testID={`lead-status-${l.id}`} label={LEAD_STATUS_META[l.status].label} tone={LEAD_STATUS_META[l.status].tone} />
              </View>
              <Text style={[font.small, { color: c.textMuted }]} numberOfLines={1}>
                {l.buyerName} · {l.city}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="cube-outline" size={14} color={c.primary} />
                <Text testID={`lead-requirement-${l.id}`} numberOfLines={1} style={[font.small, { color: c.text, flex: 1, fontWeight: '600' }]}>
                  {l.quantity} {l.unit} · {l.productTitle}
                </Text>
              </View>
              <Text style={[font.tiny, { color: c.textFaint }]}>
                {l.id} · {timeAgo(l.createdAt)}
                {l.whatsapp ? ' · prefers WhatsApp' : ''}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState testID="leads-empty" icon="people-outline" title="No leads here" subtitle="Buyers’ “Get best price” enquiries will appear in this list." />}
      />
    </Screen>
  );
}
