import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { Order, STATUS_FLOW, STATUS_META } from '@/data/seed';
import { addDays, fmtDate } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Chip, EmptyState, Segmented } from '@/components/ui';
import { Sheet, useToast } from '@/components/overlays';
import { OrderCard } from '@/components/OrderCard';
import { DateField } from '@/components/DateField';

type Tab = 'active' | 'delivered' | 'cancelled';

function bucket(o: Order): Tab {
  if (o.status === 'delivered') return 'delivered';
  if (o.status === 'cancelled' || o.status === 'rejected') return 'cancelled';
  return 'active';
}

export default function Orders() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { state, actions } = useApp();
  const [tab, setTab] = useState<Tab>(params.tab ?? 'active');
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dateSheet, setDateSheet] = useState(false);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const [draftTo, setDraftTo] = useState<Date | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  const counts = useMemo(() => {
    const r = { active: 0, delivered: 0, cancelled: 0 };
    state.orders.forEach((o) => r[bucket(o)]++);
    return r;
  }, [state.orders]);

  const list = useMemo(() => {
    return state.orders.filter((o) => {
      if (bucket(o) !== tab) return false;
      if (q && !o.id.toLowerCase().includes(q.trim().toLowerCase())) return false;
      const d = new Date(o.createdAt);
      if (from && d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
      if (to && d > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
      return true;
    });
  }, [state.orders, tab, q, from, to]);

  // Pull-to-refresh advances one in-flight order — dynamic data your tests must tolerate.
  const refresh = async () => {
    setRefreshing(true);
    try {
      await api.generic(true);
      const moving = state.orders.find((o) => ['confirmed', 'packed', 'shipped'].includes(o.status));
      if (moving) {
        const next = STATUS_FLOW[STATUS_FLOW.indexOf(moving.status) + 1];
        actions.setOrderStatus(moving.id, next);
        toast.show(`${moving.id} is now ${STATUS_META[next].label.toLowerCase()}`, 'info');
      } else toast.show('All orders are up to date', 'info');
    } catch (e) {
      onError(e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen testID="orders-screen">
      <AppHeader testID="orders-header" mode="menu" title="My orders" showBell />
      <View style={{ backgroundColor: c.card, padding: 16, paddingTop: 6, gap: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Segmented
          testID="orders-tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'delivered', label: 'Delivered', count: counts.delivered },
            { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6, backgroundColor: c.cardAlt }}>
            <Ionicons name="search" size={16} color={c.textFaint} />
            <TextInput
              testID="orders-search-input"
              accessibilityLabel="Search by order ID"
              placeholder="Search order ID e.g. SP-26…"
              placeholderTextColor={c.textFaint}
              value={q}
              onChangeText={setQ}
              autoCapitalize="characters"
              style={[font.body, { flex: 1, color: c.text }]}
            />
          </View>
          <Pressable
            testID="orders-date-filter-button"
            accessibilityRole="button"
            accessibilityLabel="Filter by date"
            onPress={() => {
              setDraftFrom(from);
              setDraftTo(to);
              setRangeError(null);
              setDateSheet(true);
            }}
            style={{ width: 42, height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: from || to ? c.primary : c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: from || to ? c.primarySoft : c.card }}
          >
            <Ionicons name="calendar-outline" size={19} color={from || to ? c.primary : c.text} />
          </Pressable>
        </View>
        {from || to ? (
          <View style={{ flexDirection: 'row' }}>
            <Chip
              testID="orders-date-chip"
              selected
              label={`${from ? fmtDate(from) : 'Any'} → ${to ? fmtDate(to) : 'Today'}`}
              onRemove={() => {
                setFrom(null);
                setTo(null);
              }}
            />
          </View>
        ) : null}
      </View>

      <FlatList
        testID="orders-list"
        data={list}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl testID="orders-refresh" refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} colors={[c.primary]} />}
        renderItem={({ item: o }) => <OrderCard order={o} onPress={() => router.push(`/order/${o.id}`)} />}
        ListEmptyComponent={
          <EmptyState
            testID="orders-empty"
            icon="receipt-outline"
            title={q || from || to ? 'No matching orders' : tab === 'active' ? 'No active orders' : tab === 'delivered' ? 'No deliveries yet' : 'Nothing cancelled'}
            subtitle={q || from || to ? 'Try a different order ID or date range.' : 'Orders you place will show up here.'}
            action={tab === 'active' && !q ? 'Start shopping' : undefined}
            onAction={() => router.navigate('/catalog')}
          />
        }
      />

      <Sheet
        visible={dateSheet}
        onClose={() => setDateSheet(false)}
        title="Filter by order date"
        testID="orders-date-sheet"
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button testID="orders-date-clear" title="Clear" variant="secondary" style={{ flex: 1 }} onPress={() => { setDraftFrom(null); setDraftTo(null); }} />
            <Button
              testID="orders-date-apply"
              title="Apply"
              style={{ flex: 2 }}
              onPress={() => {
                if (draftFrom && draftTo && draftFrom > draftTo) return setRangeError('“From” date must be before “To” date');
                setFrom(draftFrom);
                setTo(draftTo);
                setDateSheet(false);
              }}
            />
          </View>
        }
      >
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: '7', label: 'Last 7 days', days: 7 },
              { id: '30', label: 'Last 30 days', days: 30 },
              { id: '90', label: 'Last 90 days', days: 90 },
            ].map((p) => (
              <Chip key={p.id} testID={`orders-date-preset-${p.id}`} label={p.label} onPress={() => { setDraftFrom(addDays(new Date(), -p.days)); setDraftTo(new Date()); setRangeError(null); }} />
            ))}
          </View>
          <DateField testID="orders-date-from" label="From" value={draftFrom} onChange={(d) => { setDraftFrom(d); setRangeError(null); }} maximumDate={new Date()} />
          <DateField testID="orders-date-to" label="To" value={draftTo} onChange={(d) => { setDraftTo(d); setRangeError(null); }} maximumDate={new Date()} error={rangeError} />
        </View>
      </Sheet>
    </Screen>
  );
}
