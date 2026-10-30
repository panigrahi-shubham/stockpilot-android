import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useApp } from '@/state/AppContext';
import { useApiError } from '@/state/useApiError';
import { api } from '@/data/api';
import { AppNotification, NotificationKind } from '@/data/seed';
import { isSameDay, timeAgo } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Chip, EmptyState } from '@/components/ui';
import { useToast } from '@/components/overlays';

const ICONS: Record<NotificationKind, { icon: any; tone: 'primary' | 'accent' | 'info' | 'danger' }> = {
  order: { icon: 'cube-outline', tone: 'primary' },
  offer: { icon: 'pricetag-outline', tone: 'accent' },
  account: { icon: 'shield-checkmark-outline', tone: 'info' },
  payment: { icon: 'wallet-outline', tone: 'danger' },
};

export default function Notifications() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const onError = useApiError();
  const { state, actions } = useApp();
  const [filter, setFilter] = useState<'all' | NotificationKind>('all');
  const [refreshing, setRefreshing] = useState(false);
  const unread = state.notifications.filter((n) => !n.read).length;

  const sections = useMemo(() => {
    const list = state.notifications.filter((n) => filter === 'all' || n.kind === filter);
    const today = list.filter((n) => isSameDay(new Date(n.at), new Date()));
    const earlier = list.filter((n) => !isSameDay(new Date(n.at), new Date()));
    return [
      ...(today.length ? [{ title: 'Today', data: today }] : []),
      ...(earlier.length ? [{ title: 'Earlier', data: earlier }] : []),
    ];
  }, [state.notifications, filter]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await api.generic(true);
      actions.addNotification({
        id: `N-${Date.now()}`,
        kind: 'offer',
        title: 'Flash sale: Home Care',
        body: 'Detergents and cleaners at up to 22% off for the next 3 hours.',
        at: new Date().toISOString(),
        read: false,
        link: '/catalog?category=home',
      });
    } catch (e) {
      onError(e);
    } finally {
      setRefreshing(false);
    }
  };

  const open = (n: AppNotification) => {
    actions.markNotificationRead(n.id);
    if (n.link) router.push(n.link as any);
  };

  return (
    <Screen testID="notifications-screen">
      <AppHeader
        testID="notifications-header"
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        showCart={false}
        right={
          unread ? (
            <Pressable testID="notifications-mark-all-read" accessibilityRole="button" onPress={() => { actions.markAllRead(); toast.show('All notifications marked as read', 'success'); }} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={[font.small, { color: c.primary, fontWeight: '800' }]}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <View style={{ backgroundColor: c.card, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {(['all', 'order', 'offer', 'payment', 'account'] as const).map((f) => (
            <Chip key={f} testID={`notifications-filter-${f}`} label={f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1) + 's'} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
      <SectionList
        testID="notifications-list"
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl testID="notifications-refresh" refreshing={refreshing} onRefresh={refresh} tintColor={c.primary} colors={[c.primary]} />}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        renderSectionHeader={({ section }) => (
          <Text testID={`notifications-section-${section.title.toLowerCase()}`} style={[font.small, { color: c.textMuted, fontWeight: '800', marginTop: 6, marginBottom: 2 }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item: n }) => {
          const meta = ICONS[n.kind];
          const tone = { primary: [c.primarySoft, c.primary], accent: [c.accentSoft, c.warning], info: [c.infoSoft, c.info], danger: [c.dangerSoft, c.danger] }[meta.tone];
          return (
            <Swipeable
              friction={2}
              rightThreshold={50}
              renderRightActions={() => (
                <Pressable testID={`notification-delete-${n.id}`} accessibilityLabel="Delete notification" onPress={() => actions.deleteNotification(n.id)} style={{ width: 84, marginLeft: 8, borderRadius: radius.lg, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trash-outline" size={22} color="#fff" />
                </Pressable>
              )}
            >
              <Pressable testID={`notification-${n.id}`} accessibilityRole="button" accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.body}`} onPress={() => open(n)} style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: n.read ? c.card : c.primarySoft, borderWidth: 1, borderColor: c.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tone[0], alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={meta.icon} size={20} color={tone[1]} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text testID={`notification-title-${n.id}`} style={[font.bodyStrong, { color: c.text, flex: 1 }]}>
                      {n.title}
                    </Text>
                    {!n.read ? <View testID={`notification-unread-${n.id}`} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger }} /> : null}
                  </View>
                  <Text style={[font.small, { color: c.textMuted, marginTop: 3, lineHeight: 17 }]}>{n.body}</Text>
                  <Text style={[font.tiny, { color: c.textFaint, marginTop: 6 }]}>{timeAgo(n.at)}</Text>
                </View>
              </Pressable>
            </Swipeable>
          );
        }}
        ListEmptyComponent={<EmptyState testID="notifications-empty" icon="notifications-off-outline" title="No notifications" subtitle="We’ll let you know about orders, offers and payments here." />}
      />
    </Screen>
  );
}
