import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Order, STATUS_FLOW, STATUS_META } from '@/data/seed';
import { fmtDate, fmtTime, inr } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { Badge } from './ui';

export function OrderCard({ order: o, onPress }: { order: Order; onPress: () => void }) {
  const { c } = useTheme();
  const meta = STATUS_META[o.status];
  const step = STATUS_FLOW.indexOf(o.status);
  return (
    <Pressable testID={`order-card-${o.id}`} accessibilityRole="button" accessibilityLabel={`Order ${o.id}, ${meta.label}`} onPress={onPress}>
      <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: c.border, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="package-variant-closed" size={22} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text testID={`order-id-${o.id}`} style={[font.bodyStrong, { color: c.text }]}>
              {o.id}
            </Text>
            <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>
              {fmtDate(o.createdAt)}, {fmtTime(o.createdAt)}
            </Text>
          </View>
          <Badge testID={`order-status-${o.id}`} label={meta.label} tone={meta.tone} />
        </View>
        {step >= 0 && o.status !== 'delivered' ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {STATUS_FLOW.map((s, i) => (
              <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.primary : c.border }} />
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[font.small, { color: c.textMuted }]}>
            {o.lines.length} item{o.lines.length > 1 ? 's' : ''} · {o.lines.reduce((s, l) => s + l.qty, 0)} units
          </Text>
          <Text testID={`order-total-${o.id}`} style={[font.bodyStrong, { color: c.text }]}>
            {inr(o.total)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
