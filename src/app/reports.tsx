import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { CATEGORIES } from '@/data/catalog';
import { addDays, compactInr, fmtDate, inr, mulberry32 } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Card, Segmented } from '@/components/ui';
import { useToast } from '@/components/overlays';

type Range = '7d' | '30d' | '90d' | '12m';
const RANGE_META: Record<Range, { buckets: number; label: (i: number, n: number) => string; days: number }> = {
  '7d': { buckets: 7, days: 1, label: (i, n) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][addDays(new Date(), i - n + 1).getDay()] },
  '30d': { buckets: 10, days: 3, label: (i, n) => `${addDays(new Date(), (i - n + 1) * 3).getDate()}` },
  '90d': { buckets: 12, days: 7, label: (i) => `W${i + 1}` },
  '12m': { buckets: 12, days: 30, label: (i, n) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(new Date().getMonth() - (n - 1 - i) + 12) % 12] },
};

export default function Reports() {
  const { c } = useTheme();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [range, setRange] = useState<Range>('30d');
  const [sel, setSel] = useState<number | null>(null);

  const data = useMemo(() => {
    const m = RANGE_META[range];
    const rand = mulberry32(range.length * 97 + m.buckets);
    const bars = Array.from({ length: m.buckets }, (_, i) => ({
      label: m.label(i, m.buckets),
      value: Math.round((18000 + rand() * 62000) * (m.days / 3 + 0.6)),
      orders: 1 + Math.floor(rand() * (m.days + 2)),
    }));
    const total = bars.reduce((s, b) => s + b.value, 0);
    const orders = bars.reduce((s, b) => s + b.orders, 0);
    const cats = CATEGORIES.map((cat) => ({ ...cat, share: 0.04 + rand() * 0.3 }));
    const shareSum = cats.reduce((s, x) => s + x.share, 0);
    const rows = bars
      .map((b, i) => {
        const gross = b.value;
        const disc = Math.round(gross * (0.02 + rand() * 0.06));
        const gst = Math.round((gross - disc) * 0.11);
        return {
          date: fmtDate(addDays(new Date(), -(m.buckets - 1 - i) * m.days)),
          orders: b.orders,
          units: b.orders * (8 + Math.floor(rand() * 40)),
          gross,
          disc,
          gst,
          net: gross - disc + gst,
          top: cats[Math.floor(rand() * cats.length)].name,
        };
      })
      .reverse();
    return { bars, total, orders, cats: cats.map((x) => ({ ...x, share: x.share / shareSum })).sort((a, b) => b.share - a.share), rows };
  }, [range]);

  const max = Math.max(...data.bars.map((b) => b.value));
  const chartH = 170;

  const exportCsv = async () => {
    const header = 'Date,Orders,Units,Gross,Discount,GST,Net,Top category';
    const csv = [header, ...data.rows.map((r) => [r.date, r.orders, r.units, r.gross, r.disc, r.gst, r.net, r.top].join(','))].join('\n');
    try {
      const f = new File(Paths.cache, `StockPilot_Purchases_${range}.csv`);
      if (f.exists) f.delete();
      f.create();
      f.write(csv);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: 'Export purchase report' });
      else toast.show('Report saved', 'success');
    } catch {
      toast.show('Couldn’t export the report', 'error');
    }
  };

  const cols: [string, number, (r: (typeof data.rows)[number]) => string][] = [
    ['Date', 110, (r) => r.date],
    ['Orders', 70, (r) => String(r.orders)],
    ['Units', 70, (r) => String(r.units)],
    ['Gross', 100, (r) => inr(r.gross, { decimals: false })],
    ['Discount', 90, (r) => inr(r.disc, { decimals: false })],
    ['GST', 90, (r) => inr(r.gst, { decimals: false })],
    ['Net', 110, (r) => inr(r.net, { decimals: false })],
    ['Top category', 130, (r) => r.top],
  ];

  return (
    <Screen testID="reports-screen">
      <AppHeader
        testID="reports-header"
        title="Purchase reports"
        showCart={false}
        right={
          <Pressable testID="reports-export-button" accessibilityRole="button" accessibilityLabel="Export CSV" onPress={exportCsv} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10 }}>
            <Ionicons name="download-outline" size={18} color={c.primary} />
            <Text style={[font.small, { color: c.primary, fontWeight: '800' }]}>CSV</Text>
          </Pressable>
        }
      />
      <ScrollView testID="reports-scroll" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <Segmented
          testID="reports-range"
          value={range}
          onChange={(r) => {
            setRange(r);
            setSel(null);
          }}
          options={[
            { value: '7d', label: '7D' },
            { value: '30d', label: '30D' },
            { value: '90d', label: '90D' },
            { value: '12m', label: '12M' },
          ]}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { id: 'spend', label: 'Total spend', value: compactInr(data.total) },
            { id: 'orders', label: 'Orders', value: String(data.orders) },
            { id: 'aov', label: 'Avg. order value', value: compactInr(data.total / Math.max(1, data.orders)) },
            { id: 'gst', label: 'GST input credit', value: compactInr(data.total * 0.11) },
          ].map((k) => (
            <View key={k.id} testID={`reports-kpi-${k.id}`} style={{ width: landscape ? (width - 32 - 30) / 4 : (width - 32 - 10) / 2, backgroundColor: c.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: c.border }}>
              <Text style={[font.small, { color: c.textMuted }]}>{k.label}</Text>
              <Text testID={`reports-kpi-${k.id}-value`} style={[font.h2, { color: c.text, marginTop: 4 }]}>
                {k.value}
              </Text>
            </View>
          ))}
        </View>

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[font.h3, { color: c.text, flex: 1 }]}>Spend over time</Text>
            {sel !== null ? (
              <View testID="reports-tooltip" style={{ backgroundColor: c.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text testID="reports-tooltip-text" style={[font.small, { color: c.card, fontWeight: '700' }]}>
                  {data.bars[sel].label}: {inr(data.bars[sel].value, { decimals: false })} · {data.bars[sel].orders} orders
                </Text>
              </View>
            ) : (
              <Text style={[font.small, { color: c.textFaint }]}>Tap a bar</Text>
            )}
          </View>
          <View testID="reports-chart" style={{ height: chartH + 24, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            {data.bars.map((b, i) => (
              <Pressable
                key={i}
                testID={`reports-bar-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`${b.label}: ${inr(b.value, { decimals: false })}`}
                onPress={() => setSel(sel === i ? null : i)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
              >
                <View style={{ width: '100%', height: Math.max(6, (b.value / max) * chartH), borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: sel === i ? c.accent : c.primary, opacity: sel === null || sel === i ? 1 : 0.4 }} />
                <Text style={[font.tiny, { color: c.textMuted, marginTop: 6 }]} numberOfLines={1}>
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={[font.h3, { color: c.text }]}>Spend by category</Text>
          {data.cats.map((cat) => (
            <View key={cat.id} testID={`reports-category-${cat.id}`} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[font.small, { color: c.text, flex: 1, fontWeight: '600' }]}>{cat.name}</Text>
                <Text style={[font.small, { color: c.textMuted }]}>{Math.round(cat.share * 100)}%</Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' }}>
                <View style={{ width: `${cat.share * 100}%`, height: '100%', backgroundColor: cat.colors[1] }} />
              </View>
            </View>
          ))}
        </Card>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[font.h3, { color: c.text, flex: 1 }]}>Detailed breakdown</Text>
            {!landscape ? (
              <View testID="reports-rotate-hint" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="phone-landscape-outline" size={14} color={c.textFaint} />
                <Text style={[font.tiny, { color: c.textFaint }]}>ROTATE OR SCROLL →</Text>
              </View>
            ) : null}
          </View>
          <ScrollView testID="reports-table-scroll" horizontal showsHorizontalScrollIndicator nestedScrollEnabled style={{ borderRadius: radius.md, borderWidth: 1, borderColor: c.border }}>
            <View testID="reports-table" style={{ backgroundColor: c.card }}>
              <View style={{ flexDirection: 'row', backgroundColor: c.primarySoft }}>
                {cols.map(([h, w]) => (
                  <Text key={h} style={[font.small, { width: w, padding: 10, color: c.primary, fontWeight: '800' }]}>
                    {h}
                  </Text>
                ))}
              </View>
              {data.rows.map((r, i) => (
                <View key={i} testID={`reports-row-${i}`} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border, backgroundColor: i % 2 ? c.cardAlt : c.card }}>
                  {cols.map(([h, w, get]) => (
                    <Text key={h} testID={`reports-cell-${i}-${h.toLowerCase().replace(/\s+/g, '-')}`} style={[font.small, { width: w, padding: 10, color: c.text }]}>
                      {get(r)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </Screen>
  );
}
