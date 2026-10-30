import React, { useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { LANGUAGES } from '@/i18n';
import { font, radius } from '@/theme';
import { Button } from '@/components/ui';

const SLIDES = [
  {
    key: 'catalog',
    icon: 'storefront-outline',
    title: 'Wholesale prices, delivered',
    body: '2,000+ fast-moving SKUs from authorised distributors. Tiered pricing that drops as your order grows.',
    colors: ['#0E5E4F', '#1F8A70'] as [string, string],
  },
  {
    key: 'credit',
    icon: 'hand-coin-outline',
    title: 'Buy now, pay in 30 days',
    body: 'Get an instant credit line once your GSTIN is verified. No paperwork, no collateral.',
    colors: ['#2B3A8C', '#4D61D6'] as [string, string],
  },
  {
    key: 'track',
    icon: 'truck-delivery',
    title: 'Track every carton',
    body: 'Live order status, GST invoices and one-tap re-ordering from your phone.',
    colors: ['#8C4A12', '#D07A2A'] as [string, string],
  },
];

export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useApp();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const last = index === SLIDES.length - 1;

  const finish = () => {
    actions.completeOnboarding();
    router.replace('/login');
  };

  const next = () => {
    if (last) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View testID="onboarding-screen" style={{ flex: 1, backgroundColor: SLIDES[index].colors[0] }}>
      <FlatList
        testID="onboarding-pager"
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <LinearGradient testID={`onboarding-slide-${i}`} colors={item.colors} style={{ width, height, paddingTop: insets.top + 70, paddingHorizontal: 28 }}>
            <View style={{ width: 150, height: 150, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 40 }}>
              <MaterialCommunityIcons name={item.icon as any} size={78} color="#fff" />
            </View>
            <Text testID={`onboarding-title-${i}`} style={[font.h1, { color: '#fff', fontSize: 30, lineHeight: 36 }]}>
              {item.title}
            </Text>
            <Text style={[font.body, { color: 'rgba(255,255,255,0.86)', fontSize: 16, lineHeight: 24, marginTop: 14 }]}>{item.body}</Text>
            {i === 0 ? (
              <View style={{ marginTop: 30 }}>
                <Text style={[font.small, { color: 'rgba(255,255,255,0.75)', marginBottom: 10, fontWeight: '700' }]}>CHOOSE YOUR LANGUAGE</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {LANGUAGES.map((l) => {
                    const sel = state.settings.language === l.id;
                    return (
                      <Pressable
                        key={l.id}
                        testID={`onboarding-language-${l.id}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: sel }}
                        onPress={() => actions.setLanguage(l.id)}
                        style={{
                          paddingHorizontal: 16,
                          height: 40,
                          borderRadius: radius.pill,
                          justifyContent: 'center',
                          backgroundColor: sel ? '#fff' : 'rgba(255,255,255,0.14)',
                        }}
                      >
                        <Text style={[font.bodyStrong, { color: sel ? item.colors[0] : '#fff' }]}>{l.native}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </LinearGradient>
        )}
      />
      <View style={{ position: 'absolute', top: insets.top + 12, right: 16 }}>
        {!last ? (
          <Pressable testID="onboarding-skip-button" accessibilityRole="button" onPress={finish} hitSlop={12} style={{ padding: 8 }}>
            <Text style={[font.bodyStrong, { color: '#fff' }]}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 24, paddingHorizontal: 24, gap: 22 }}>
        <View testID="onboarding-dots" style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              testID={`onboarding-dot-${i}${i === index ? '-active' : ''}`}
              style={{ width: i === index ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.4)' }}
            />
          ))}
        </View>
        <Button
          testID={last ? 'onboarding-get-started-button' : 'onboarding-next-button'}
          title={last ? 'Get started' : 'Next'}
          icon={last ? 'arrow-forward' : undefined}
          iconRight
          variant="accent"
          size="lg"
          onPress={next}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={[font.small, { color: 'rgba(255,255,255,0.8)' }]}>Trusted by 18,000+ retailers across South India</Text>
        </View>
      </View>
    </View>
  );
}
