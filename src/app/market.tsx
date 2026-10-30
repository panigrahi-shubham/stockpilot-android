import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { errorMessage } from '@/data/api';
import { FX_CODES, FxCode, FxRate, fetchFxRates, fetchFxSeries } from '@/data/online';
import { useOnline } from '@/state/network';
import { fmtDate, fmtTime } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Card, Chip, ErrorState, Skeleton } from '@/components/ui';

const FLAGS: Record<FxCode, string> = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', AED: '🇦🇪', SGD: '🇸🇬', JPY: '🇯🇵', CNY: '🇨🇳', SAR: '🇸🇦' };

/**
 * LIVE data from the internet (Frankfurter / European Central Bank reference rates).
 * Needs a real connection: turn on airplane mode to see the error + retry flow.
 */
export default function Market() {
  const { c } = useTheme();
  const router = useRouter();
  const { online } = useOnline();
  const [rates, setRates] = useState<FxRate[] | null>(null);
  const [date, setDate] = useState('');
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartCode, setChartCode] = useState<FxCode>('USD');
  const [series, setSeries] = useState<{ date: string; inr: number }[] | null>(null);
  const [seriesErr, setSeriesErr] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [amount, setAmount] = useState('100000');
  const [target, setTarget] = useState<FxCode>('USD');
  const [inrToFx, setInrToFx] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchFxRates();
      setRates(r.rates);
      setDate(r.date);
      setFetchedAt(new Date());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const loadSeries = useCallback(async (code: FxCode) => {
    setSeries(null);
    setSeriesErr(null);
    setSel(null);
    try {
      setSeries(await fetchFxSeries(code, 30));
    } catch (e) {
      setSeriesErr(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadSeries(chartCode);
  }, [chartCode, loadSeries]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), loadSeries(chartCode)]);
    setRefreshing(false);
  };

  const rate = rates?.find((r) => r.code === target);
  const amt = Number(amount) || 0;
  const converted = rate ? (inrToFx ? amt * rate.rate : amt * rate.perUnit) : 0;
  const min = series ? Math.min(...series.map((s) => s.inr)) : 0;
  const max = series ? Math.max(...series.map((s) => s.inr)) : 0;
  const change = series && series.length > 1 ? ((series[series.length - 1].inr - series[0].inr) / series[0].inr) * 100 : 0;

  return (
    <Screen testID="market-screen">
      <AppHeader testID="market-header" title="Live market" subtitle="Export rates · updated daily by ECB" showCart={false} />
      <ScrollView
        testID="market-scroll"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl testID="market-refresh" refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} colors={[c.primary]} />}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      >
        <View testID="market-connection" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? c.success : c.danger }} />
          <Text testID="market-connection-text" style={[font.small, { color: c.textMuted, flex: 1 }]}>
            {online ? 'Online · live data' : 'Offline · showing last loaded data'}
          </Text>
          {fetchedAt ? (
            <Text testID="market-fetched-at" style={[font.tiny, { color: c.textFaint }]}>
              Fetched {fmtTime(fetchedAt)}
            </Text>
          ) : null}
        </View>

        {error && !rates ? (
          <ErrorState testID="market-error" message={error} onRetry={load} />
        ) : (
          <Card style={{ gap: 4, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
              <Text style={[font.h3, { color: c.text, flex: 1 }]}>INR exchange rates</Text>
              <Text testID="market-rates-date" style={[font.small, { color: c.textMuted }]}>
                {date ? `as of ${fmtDate(date)}` : ''}
              </Text>
            </View>
            {!rates
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={36} style={{ marginVertical: 4 }} />)
              : rates.map((r) => (
                  <Pressable key={r.code} testID={`market-rate-${r.code}`} onPress={() => setChartCode(r.code)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border }}>
                    <Text style={{ fontSize: 20, width: 34 }}>{FLAGS[r.code]}</Text>
                    <Text style={[font.bodyStrong, { color: c.text, width: 50 }]}>{r.code}</Text>
                    <Text testID={`market-rate-${r.code}-inr`} style={[font.bodyStrong, { color: c.text, flex: 1, textAlign: 'right' }]}>
                      ₹{r.perUnit.toFixed(r.code === 'JPY' ? 4 : 2)}
                    </Text>
                    <Text style={[font.tiny, { color: c.textFaint, width: 92, textAlign: 'right' }]}>₹1 = {r.rate.toFixed(r.code === 'JPY' ? 3 : 5)}</Text>
                  </Pressable>
                ))}
            {error && rates ? (
              <Text testID="market-stale-warning" style={[font.small, { color: c.warning, paddingVertical: 6 }]}>
                Couldn’t refresh: {error}
              </Text>
            ) : null}
          </Card>
        )}

        <Card style={{ gap: 10 }}>
          <Text style={[font.h3, { color: c.text }]}>30-day trend</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {FX_CODES.map((code) => (
              <Chip key={code} testID={`market-chart-currency-${code}`} label={code} selected={chartCode === code} onPress={() => setChartCode(code)} />
            ))}
          </ScrollView>
          {seriesErr ? (
            <ErrorState testID="market-chart-error" message={seriesErr} onRetry={() => loadSeries(chartCode)} />
          ) : !series ? (
            <Skeleton width="100%" height={140} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text testID="market-chart-summary" style={[font.small, { color: c.textMuted }]}>
                  1 {chartCode} · low ₹{min.toFixed(2)} · high ₹{max.toFixed(2)}
                </Text>
                <Text testID="market-chart-change" style={[font.small, { color: change >= 0 ? c.danger : c.success, fontWeight: '800' }]}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </Text>
              </View>
              <View testID="market-chart" style={{ height: 140, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                {series.map((s, i) => {
                  const h = max === min ? 70 : 12 + ((s.inr - min) / (max - min)) * 120;
                  return (
                    <Pressable key={s.date} testID={`market-chart-bar-${i}`} accessibilityLabel={`${s.date}: ₹${s.inr.toFixed(2)}`} onPress={() => setSel(i)} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <View style={{ height: h, borderRadius: 3, backgroundColor: sel === i ? c.accent : c.primary, opacity: sel === null || sel === i ? 1 : 0.45 }} />
                    </Pressable>
                  );
                })}
              </View>
              {sel !== null && series[sel] ? (
                <Text testID="market-chart-tooltip" style={[font.small, { color: c.text, fontWeight: '700' }]}>
                  {fmtDate(series[sel].date)}: 1 {chartCode} = ₹{series[sel].inr.toFixed(2)}
                </Text>
              ) : (
                <Text style={[font.tiny, { color: c.textFaint }]}>Tap a bar to see that day’s rate</Text>
              )}
            </>
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={[font.h3, { color: c.text }]}>Export price calculator</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 50, borderWidth: 1.5, borderColor: c.border, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}>
              <Text style={[font.bodyStrong, { color: c.textMuted }]}>{inrToFx ? '₹' : target}</Text>
              <TextInput
                testID="market-amount-input"
                accessibilityLabel="Amount"
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                style={[font.h3, { flex: 1, color: c.text }]}
              />
            </View>
            <Pressable testID="market-swap-button" accessibilityRole="button" accessibilityLabel="Swap currencies" onPress={() => setInrToFx((x) => !x)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="swap-horizontal" size={20} color={c.primary} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {FX_CODES.map((code) => (
              <Chip key={code} testID={`market-target-${code}`} label={code} selected={target === code} onPress={() => setTarget(code)} />
            ))}
          </ScrollView>
          <Text testID="market-converted-value" style={[font.h1, { color: c.primary }]}>
            {rate ? `${inrToFx ? target + ' ' : '₹'}${converted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}
          </Text>
          <Text style={[font.tiny, { color: c.textFaint }]}>Indicative ECB reference rate. Your bank’s rate will differ.</Text>
        </Card>

        <Pressable testID="market-source-link" onPress={() => router.push({ pathname: '/browser', params: { url: 'https://frankfurter.dev' } })}>
          <Text style={[font.small, { color: c.primary, textAlign: 'center' }]}>Data: Frankfurter API · European Central Bank ↗</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
