import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useApp } from '@/state/AppContext';
import type { Conversation } from '@/data/marketplace';
import { initials, timeAgo } from '@/utils/format';
import { font, radius, useTheme } from '@/theme';
import { AppHeader, Screen } from '@/components/chrome';
import { Chip, EmptyState, ListRow } from '@/components/ui';
import { ConfirmDialog, Sheet, useToast } from '@/components/overlays';

type Filter = 'all' | 'unread' | 'starred';

/**
 * Inbox: filters, search, swipe-left = archive (with UNDO), swipe-right = star,
 * long-press = context menu. Unread counts drive the header badge.
 */
export default function Messages() {
  const { c } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { state, actions } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [menu, setMenu] = useState<Conversation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Conversation | null>(null);

  const active = state.conversations.filter((x) => !x.archived);
  const archived = state.conversations.filter((x) => x.archived);
  const unread = active.reduce((s, x) => s + x.unread, 0);
  const counts = { all: active.length, unread: active.filter((x) => x.unread > 0).length, starred: active.filter((x) => x.starred).length };

  const list = useMemo(() => {
    const base = showArchived ? archived : active;
    return base
      .filter((x) => (filter === 'unread' ? x.unread > 0 : filter === 'starred' ? x.starred : true))
      .filter((x) => !q || `${x.name} ${x.company} ${x.messages[x.messages.length - 1]?.text}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => +new Date(b.messages[b.messages.length - 1]?.at ?? 0) - +new Date(a.messages[a.messages.length - 1]?.at ?? 0));
  }, [active, archived, filter, q, showArchived]);

  const archive = (cv: Conversation, value: boolean) => {
    actions.setArchived(cv.id, value);
    toast.show(value ? `Chat with ${cv.name} archived` : `Chat with ${cv.name} restored`, 'info', { label: 'UNDO', onPress: () => actions.setArchived(cv.id, !value) });
  };

  return (
    <Screen testID="messages-screen">
      <AppHeader testID="messages-header" title={showArchived ? 'Archived chats' : 'Messages'} subtitle={showArchived ? `${archived.length} archived` : unread ? `${unread} unread` : 'All caught up'} showCart={false} onBack={showArchived ? () => setShowArchived(false) : undefined} />
      <View style={{ backgroundColor: c.card, padding: 16, paddingTop: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <View style={{ height: 42, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.cardAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search" size={17} color={c.textFaint} />
          <TextInput testID="messages-search-input" placeholder="Search name, company or message" placeholderTextColor={c.textFaint} value={q} onChangeText={setQ} style={[font.body, { flex: 1, color: c.text }]} />
        </View>
        {!showArchived ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['all', 'unread', 'starred'] as Filter[]).map((f) => (
              <Chip key={f} testID={`messages-filter-${f}`} label={`${f[0].toUpperCase() + f.slice(1)} (${counts[f]})`} selected={filter === f} onPress={() => setFilter(f)} />
            ))}
          </View>
        ) : null}
      </View>
      <FlatList
        testID="messages-list"
        data={list}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
        renderItem={({ item: cv }) => {
          const last = cv.messages[cv.messages.length - 1];
          return (
            <Swipeable
              friction={2}
              leftThreshold={50}
              rightThreshold={50}
              renderRightActions={(_p, _t, sw) => (
                <Pressable
                  testID={`conversation-archive-${cv.id}`}
                  accessibilityLabel={showArchived ? 'Unarchive' : 'Archive'}
                  onPress={() => {
                    sw.close();
                    archive(cv, !showArchived);
                  }}
                  style={{ width: 92, marginLeft: 8, borderRadius: radius.lg, backgroundColor: c.info, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name={showArchived ? 'arrow-undo-outline' : 'archive-outline'} size={22} color="#fff" />
                  <Text style={[font.small, { color: '#fff', fontWeight: '800', marginTop: 3 }]}>{showArchived ? 'Restore' : 'Archive'}</Text>
                </Pressable>
              )}
              renderLeftActions={(_p, _t, sw) => (
                <Pressable
                  testID={`conversation-star-${cv.id}`}
                  accessibilityLabel={cv.starred ? 'Unstar' : 'Star'}
                  onPress={() => {
                    sw.close();
                    actions.toggleStar(cv.id);
                  }}
                  style={{ width: 92, marginRight: 8, borderRadius: radius.lg, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name={cv.starred ? 'star-outline' : 'star'} size={22} color="#2B1B00" />
                  <Text style={[font.small, { color: '#2B1B00', fontWeight: '800', marginTop: 3 }]}>{cv.starred ? 'Unstar' : 'Star'}</Text>
                </Pressable>
              )}
            >
              <Pressable
                testID={`conversation-${cv.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${cv.name}, ${cv.unread ? `${cv.unread} unread, ` : ''}${last?.text ?? ''}`}
                onPress={() => router.push({ pathname: '/chat', params: { cid: cv.id } })}
                onLongPress={() => setMenu(cv)}
                delayLongPress={450}
                style={({ pressed }) => ({ flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: pressed ? c.primarySoft : c.card, borderWidth: 1, borderColor: c.border })}
              >
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: cv.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{initials(cv.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text testID={`conversation-name-${cv.id}`} numberOfLines={1} style={[font.bodyStrong, { color: c.text, flexShrink: 1 }]}>
                      {cv.name}
                    </Text>
                    {cv.starred ? <Ionicons testID={`conversation-starred-${cv.id}`} name="star" size={13} color={c.accent} /> : null}
                    <View style={{ flex: 1 }} />
                    <Text style={[font.tiny, { color: cv.unread ? c.primary : c.textFaint }]}>{last ? timeAgo(last.at) : ''}</Text>
                  </View>
                  <Text numberOfLines={1} style={[font.small, { color: c.textMuted, marginTop: 1 }]}>
                    {cv.company} · {cv.role}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {last?.from === 'me' ? <Ionicons name={last.status === 'sent' ? 'checkmark' : 'checkmark-done'} size={14} color={last.status === 'read' ? c.info : c.textFaint} /> : null}
                    <Text testID={`conversation-preview-${cv.id}`} numberOfLines={1} style={[font.small, { flex: 1, color: cv.unread ? c.text : c.textMuted, fontWeight: cv.unread ? '700' : '400' }]}>
                      {last?.text}
                    </Text>
                    {cv.unread ? (
                      <View testID={`conversation-unread-${cv.id}`} style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                        <Text style={{ color: c.onPrimary, fontSize: 11, fontWeight: '800' }}>{cv.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <EmptyState testID="messages-empty" icon="chatbubbles-outline" title={showArchived ? 'No archived chats' : filter === 'unread' ? 'No unread messages' : filter === 'starred' ? 'No starred chats' : 'No conversations'} subtitle="Swipe right on a chat to star it, left to archive it." />
        }
        ListFooterComponent={
          !showArchived && archived.length ? (
            <Pressable testID="messages-archived-row" accessibilityRole="button" onPress={() => setShowArchived(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, justifyContent: 'center' }}>
              <Ionicons name="archive-outline" size={18} color={c.textMuted} />
              <Text style={[font.bodyStrong, { color: c.textMuted }]}>Archived ({archived.length})</Text>
            </Pressable>
          ) : undefined
        }
      />

      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.name ?? ''} testID="conversation-menu">
        {menu ? (
          <View>
            <ListRow
              testID="conversation-menu-read"
              icon={menu.unread ? 'mail-open-outline' : 'mail-unread-outline'}
              title={menu.unread ? 'Mark as read' : 'Mark as unread'}
              onPress={() => {
                actions.markConversationRead(menu.id, menu.unread > 0);
                setMenu(null);
              }}
            />
            <ListRow testID="conversation-menu-star" icon={menu.starred ? 'star-outline' : 'star'} title={menu.starred ? 'Remove star' : 'Star'} onPress={() => { actions.toggleStar(menu.id); setMenu(null); }} />
            <ListRow testID="conversation-menu-archive" icon="archive-outline" title={menu.archived ? 'Unarchive' : 'Archive'} onPress={() => { archive(menu, !menu.archived); setMenu(null); }} />
            <ListRow testID="conversation-menu-delete" icon="trash-outline" title="Delete conversation" danger onPress={() => { setConfirmDelete(menu); setMenu(null); }} />
          </View>
        ) : null}
      </Sheet>
      <ConfirmDialog
        testID="delete-conversation-dialog"
        visible={!!confirmDelete}
        title="Delete conversation?"
        message={`All messages with ${confirmDelete?.name} will be removed from this device.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) actions.deleteConversation(confirmDelete.id);
          setConfirmDelete(null);
          toast.show('Conversation deleted', 'info');
        }}
      />
    </Screen>
  );
}
