import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/state/AppContext';
import { LEAD_STATUS_META } from '@/data/marketplace';
import { timeAgo } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { useToast } from '@/components/overlays';

/** Seller dashboard — role-based screen (switch Buyer ⇄ Seller from Account or here). */
export default function SellerHub() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { state, actions } = useApp();
  const seller = state.mode === 'seller';
  const listings = state.sellerProducts;
  const newLeads = state.leads.filter((l) => l.status === 'new').length;
  const views = listings.reduce((s, l) => s + l.views, 0);
  const enquiries = listings.reduce((s, l) => s + l.enquiries, 0);
  const unread = state.conversations.filter((x) => !x.archived).reduce((s, x) => s + x.unread, 0);

  return (
    <Screen testID="seller-hub-screen">
      <AppHeader testID="seller-hub-header" title="Seller Hub" subtitle={state.user?.business} showCart={false} />
      <ScrollView testID="seller-hub-scroll" contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
        {!seller ? (
          <Card testID="seller-mode-off-card" style={{ backgroundColor: c.warningSoft, gap: 10 }}>
            <Text style={[font.h3, { color: c.text }]}>You are in buyer mode</Text>
            <Text style={[font.small, { color: c.textMuted }]}>Switch to seller mode to list products, receive enquiries and reply to buyers.</Text>
            <Button
              testID="seller-switch-to-seller-button"
              title="Switch to seller mode"
              icon="swap-horizontal-outline"
              onPress={() => {
                actions.setMode('seller');
                toast.show('Seller mode on', 'success');
              }}
            />
          </Card>
        ) : null}

        <LinearGradient colors={['#2B3A8C', '#4D61D6']} style={{ borderRadius: radius.xl, padding: 18, gap: 6 }}>
          <Text style={[font.small, { color: 'rgba(255,255,255,0.8)', fontWeight: '700' }]}>LAST 30 DAYS</Text>
          <Text testID="seller-total-views" style={[font.h1, { color: '#fff' }]}>
            {views.toLocaleString('en-IN')} views
          </Text>
          <Text style={[font.body, { color: 'rgba(255,255,255,0.9)' }]}>{enquiries} enquiries · response rate 92% · avg reply 38 min</Text>
        </LinearGradient>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { id: 'active', label: 'Active listings', value: listings.filter((l) => l.status === 'active').length, icon: 'cube-outline', href: '/seller/products' },
            { id: 'drafts', label: 'Drafts', value: listings.filter((l) => l.status === 'draft').length, icon: 'create-outline', href: '/seller/products' },
            { id: 'leads', label: 'New leads', value: newLeads, icon: 'people-outline', href: '/seller/leads' },
            { id: 'messages', label: 'Unread chats', value: unread, icon: 'chatbubbles-outline', href: '/messages' },
          ].map((k) => (
            <Pressable key={k.id} testID={`seller-kpi-${k.id}`} accessibilityRole="button" onPress={() => router.push(k.href as any)} style={{ width: (width - 32 - 10) / 2, backgroundColor: c.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: c.border }}>
              <Ionicons name={k.icon as any} size={18} color={c.primary} />
              <Text testID={`seller-kpi-${k.id}-value`} style={[font.h2, { color: c.text, marginTop: 6 }]}>
                {k.value}
              </Text>
              <Text style={[font.small, { color: c.textMuted }]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button testID="seller-add-product-button" title="Add product" icon="add" style={{ flex: 1 }} onPress={() => router.push('/seller/product-form')} />
          <Button testID="seller-my-products-button" title="My products" icon="list-outline" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/seller/products')} />
        </View>

        <View>
          <SectionHeader testID="seller-recent-leads-title" title="Recent leads" action="View all" onAction={() => router.push('/seller/leads')} />
          <View style={{ gap: 10 }}>
            {state.leads.slice(0, 3).map((l) => (
              <Pressable key={l.id} testID={`seller-recent-lead-${l.id}`} onPress={() => router.push(`/seller/lead/${l.id}`)}>
                <Card style={{ padding: 14, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[font.bodyStrong, { color: c.text, flex: 1 }]}>{l.company}</Text>
                    <Badge label={LEAD_STATUS_META[l.status].label} tone={LEAD_STATUS_META[l.status].tone} />
                  </View>
                  <Text numberOfLines={1} style={[font.small, { color: c.textMuted }]}>
                    {l.quantity} {l.unit} · {l.productTitle}
                  </Text>
                  <Text style={[font.tiny, { color: c.textFaint }]}>
                    {l.city} · {timeAgo(l.createdAt)}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        {seller ? (
          <Button
            testID="seller-switch-to-buyer-button"
            title="Switch back to buyer mode"
            variant="ghost"
            icon="swap-horizontal-outline"
            onPress={() => {
              actions.setMode('buyer');
              toast.show('Buyer mode on', 'success');
            }}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
