import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { fmtDateTime, inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Button, Checkbox, EmptyState } from '@/components/ui';
import { ConfirmDialog, LoadingOverlay, useToast } from '@/components/overlays';

export default function Approvals() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const { state, actions } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = state.orders.filter((o) => o.status === 'pending_approval');

  if (state.user?.role !== 'approver')
    return (
      <Screen testID="approvals-screen">
        <AppHeader testID="approvals-header" title="Approvals" showCart={false} />
        <EmptyState testID="approvals-no-access" icon="lock-closed-outline" title="Manager access needed" subtitle="Only users with the Manager role can approve orders. Sign in as approver@stockpilot.in to try this flow." />
      </Screen>
    );

  const approveSelected = async () => {
    setConfirm(false);
    setBusy(true);
    try {
      await api.generic(true);
      selected.forEach((id) => actions.setOrderStatus(id, 'confirmed', `Approved by ${state.user!.name}`));
      toast.show(`${selected.length} order${selected.length > 1 ? 's' : ''} approved`, 'success');
      setSelected([]);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen testID="approvals-screen">
      <AppHeader testID="approvals-header" title="Approvals" subtitle={`${pending.length} waiting`} showCart={false} />
      <FlatList
        testID="approvals-list"
        data={pending}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120, flexGrow: 1 }}
        ListHeaderComponent={
          pending.length > 1 ? (
            <Checkbox
              testID="approvals-select-all"
              label={`Select all (${pending.length})`}
              checked={selected.length === pending.length}
              onChange={(v) => setSelected(v ? pending.map((o) => o.id) : [])}
            />
          ) : undefined
        }
        renderItem={({ item: o }) => (
          <View testID={`approval-card-${o.id}`} style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: selected.includes(o.id) ? c.primary : c.border, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Checkbox testID={`approval-select-${o.id}`} checked={selected.includes(o.id)} onChange={(v) => setSelected((s) => (v ? [...s, o.id] : s.filter((x) => x !== o.id)))} label="" />
              <View style={{ flex: 1 }}>
                <Text style={[font.bodyStrong, { color: c.text }]}>{o.id}</Text>
                <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
                  By {o.placedBy} · {fmtDateTime(o.createdAt)}
                </Text>
                <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
                  {o.lines.length} products · {o.lines.reduce((s, l) => s + l.qty, 0)} packs
                </Text>
              </View>
              <Text testID={`approval-amount-${o.id}`} style={[font.h3, { color: c.text }]}>
                {inr(o.total, { decimals: false })}
              </Text>
            </View>
            <Button testID={`approval-review-${o.id}`} title="Review & decide" variant="secondary" size="sm" onPress={() => router.push(`/order/${o.id}`)} />
          </View>
        )}
        ListEmptyComponent={<EmptyState testID="approvals-empty" icon="checkmark-done-outline" title="All caught up" subtitle="No orders are waiting for your approval." />}
      />
      {selected.length ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
          <Button testID="approvals-approve-selected" title={`Approve selected (${selected.length})`} icon="checkmark-done-outline" onPress={() => setConfirm(true)} />
        </View>
      ) : null}
      <ConfirmDialog
        testID="approvals-confirm-dialog"
        visible={confirm}
        title={`Approve ${selected.length} order${selected.length > 1 ? 's' : ''}?`}
        message={`Total value ${inr(pending.filter((o) => selected.includes(o.id)).reduce((s, o) => s + o.total, 0), { decimals: false })} will be charged to the company credit line.`}
        confirmLabel="Approve"
        onCancel={() => setConfirm(false)}
        onConfirm={approveSelected}
      />
      <LoadingOverlay visible={busy} message="Approving orders…" />
    </Screen>
  );
}
