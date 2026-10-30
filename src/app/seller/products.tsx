import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import type { ListingStatus } from '@/data/marketplace';
import { inr, timeAgo } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, EmptyState, Segmented } from '@/components/ui';
import { useToast } from '@/components/overlays';

type Tab = 'all' | ListingStatus;
const TONE = { active: 'success', inactive: 'neutral', draft: 'warning' } as const;

export default function MyProducts() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const all = state.sellerProducts;
  const count = (t: Tab) => (t === 'all' ? all.length : all.filter((x) => x.status === t).length);
  const list = useMemo(
    () => all.filter((x) => (tab === 'all' || x.status === tab) && (!q || x.title.toLowerCase().includes(q.toLowerCase()))),
    [all, tab, q],
  );

  return (
    <Screen testID="my-products-screen">
      <AppHeader testID="my-products-header" title="My products" subtitle={`${count('active')} live on marketplace`} showCart={false} />
      <View style={{ backgroundColor: c.card, padding: 16, paddingTop: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Segmented
          testID="my-products-tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'All', count: count('all') },
            { value: 'active', label: 'Active', count: count('active') },
            { value: 'inactive', label: 'Inactive', count: count('inactive') },
            { value: 'draft', label: 'Drafts', count: count('draft') },
          ]}
        />
        <View style={{ height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.cardAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search" size={17} color={c.textFaint} />
          <TextInput testID="my-products-search-input" placeholder="Search your listings" placeholderTextColor={c.textFaint} value={q} onChangeText={setQ} style={[font.body, { flex: 1, color: c.text }]} />
        </View>
      </View>
      <FlatList
        testID="my-products-list"
        data={list}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110, flexGrow: 1 }}
        renderItem={({ item: l }) => (
          <Pressable testID={`listing-card-${l.id}`} accessibilityRole="button" accessibilityLabel={l.title} onPress={() => router.push({ pathname: '/seller/product-form', params: { id: l.id } })}>
            <View style={{ flexDirection: 'row', gap: 12, padding: 12, backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, opacity: l.status === 'inactive' ? 0.75 : 1 }}>
              {l.photos[l.cover] ? (
                <Image testID={`listing-thumb-${l.id}`} source={{ uri: l.photos[l.cover] }} style={{ width: 64, height: 64, borderRadius: 12 }} />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={24} color={c.primary} />
                </View>
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <Text testID={`listing-title-${l.id}`} numberOfLines={2} style={[font.bodyStrong, { color: c.text }]}>
                  {l.title || 'Untitled product'}
                </Text>
                <Text style={[font.small, { color: c.textMuted }]}>{l.price ? `${inr(l.price, { decimals: false })} / ${l.unit} · MOQ ${l.moq}` : 'Price not set'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Badge testID={`listing-status-${l.id}`} label={l.status} tone={TONE[l.status]} />
                  <Text style={[font.tiny, { color: c.textFaint }]}>
                    {l.views} views · {l.enquiries} enquiries · {timeAgo(l.updatedAt)}
                  </Text>
                </View>
              </View>
              <Switch
                testID={`listing-toggle-${l.id}`}
                accessibilityLabel={`Show ${l.title} to buyers`}
                value={l.status === 'active'}
                disabled={l.status === 'draft'}
                onValueChange={(v) => {
                  actions.setListingStatus(l.id, v ? 'active' : 'inactive');
                  toast.show(v ? 'Listing is live — buyers can see it' : 'Listing hidden from buyers', v ? 'success' : 'info');
                }}
                trackColor={{ true: c.primary, false: c.border }}
                thumbColor="#fff"
              />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState testID="my-products-empty" icon="cube-outline" title={q ? 'No matching listings' : 'Nothing here yet'} subtitle="Tap + to list your first product." />}
      />
      <Pressable
        testID="my-products-add-button"
        accessibilityRole="button"
        accessibilityLabel="Add product"
        onPress={() => router.push('/seller/product-form')}
        style={{ position: 'absolute', right: 20, bottom: insets.bottom + 24, width: 60, height: 60, borderRadius: 30, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8 }}
      >
        <Ionicons name="add" size={30} color={c.onPrimary} />
      </Pressable>
    </Screen>
  );
}
