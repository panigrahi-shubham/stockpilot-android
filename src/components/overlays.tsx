import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, useTheme } from '@/theme';
import { Button } from './ui';

/* ================================================================== Toast */
type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  action?: { label: string; onPress: () => void };
}
const ToastCtx = createContext<{ show: (message: string, type?: ToastType, action?: ToastItem['action']) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { c } = useTheme();

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback(
    (message: string, type: ToastType = 'info', action?: ToastItem['action']) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), message, type, action });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      // Toasts disappear after 3.5s — a classic "catch me before I vanish" automation challenge.
      timer.current = setTimeout(hide, action ? 5000 : 3500);
    },
    [anim, hide],
  );

  const value = useMemo(() => ({ show }), [show]);
  const iconMap = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' } as const;
  const colorMap = { success: c.success, error: c.danger, info: c.info };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 84,
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }}
        >
          <View
            testID="toast"
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#14211D',
              borderRadius: radius.md,
              paddingVertical: 13,
              paddingHorizontal: 14,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
              borderLeftWidth: 4,
              borderLeftColor: colorMap[toast.type],
            }}
          >
            <Ionicons name={iconMap[toast.type]} size={20} color={colorMap[toast.type]} />
            <Text testID="toast-message" style={[font.bodyStrong, { color: '#fff', flex: 1 }]}>
              {toast.message}
            </Text>
            {toast.action ? (
              <Pressable
                testID="toast-action"
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
              >
                <Text style={[font.bodyStrong, { color: '#F5B547' }]}>{toast.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast outside provider');
  return ctx;
}

/* ================================================================== Bottom sheet */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  testID,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  testID: string;
  footer?: React.ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, friction: 10 }).start();
    }
  }, [visible, slide]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable testID={`${testID}-backdrop`} accessibilityLabel="Close sheet" onPress={onClose} style={{ flex: 1, backgroundColor: c.overlay }} />
        <Animated.View
          testID={testID}
          style={{
            backgroundColor: c.card,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            maxHeight: '88%',
            paddingBottom: insets.bottom + 12,
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <Text testID={`${testID}-title`} style={[font.h2, { color: c.text, flex: 1 }]}>
              {title}
            </Text>
            <Pressable testID={`${testID}-close`} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20, flexShrink: 1 }}>{children}</View>
          {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ================================================================== Confirm dialog (custom, not native) */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
  testID = 'dialog',
  children,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
  children?: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View testID={testID} accessibilityViewIsModal style={{ backgroundColor: c.card, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 420, gap: 10 }}>
          <Text testID={`${testID}-title`} style={[font.h2, { color: c.text }]}>
            {title}
          </Text>
          {message ? (
            <Text testID={`${testID}-message`} style={[font.body, { color: c.textMuted, lineHeight: 20 }]}>
              {message}
            </Text>
          ) : null}
          {children}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Button testID={`${testID}-cancel`} title={cancelLabel} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button testID={`${testID}-confirm`} title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================================== Select (dropdown) */
export function SelectField({
  label,
  value,
  options,
  onChange,
  testID,
  placeholder = 'Select',
  error,
  searchable,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  testID: string;
  placeholder?: string;
  error?: string | null;
  searchable?: boolean;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.value === value);
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <View style={{ gap: 6 }}>
      <Text style={[font.small, { color: c.textMuted, fontWeight: '600' }]}>{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        style={{
          height: 50,
          borderWidth: 1.5,
          borderColor: error ? c.danger : c.border,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.card,
        }}
      >
        <Text testID={`${testID}-value`} style={[font.body, { flex: 1, fontSize: 15, color: selected ? c.text : c.textFaint }]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.textMuted} />
      </Pressable>
      {error ? (
        <Text testID={`${testID}-error`} style={[font.small, { color: c.danger }]}>
          {error}
        </Text>
      ) : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={label} testID={`${testID}-sheet`}>
        {searchable ? (
          <TextInput
            testID={`${testID}-search`}
            placeholder="Search…"
            placeholderTextColor={c.textFaint}
            value={q}
            onChangeText={setQ}
            style={[font.body, { height: 44, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: 12, color: c.text, marginBottom: 8 }]}
          />
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.value}
          style={{ maxHeight: 420 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              testID={`${testID}-option-${item.value.replace(/\s+/g, '-').toLowerCase()}`}
              accessibilityRole="button"
              accessibilityState={{ selected: item.value === value }}
              onPress={() => {
                onChange(item.value);
                setOpen(false);
                setQ('');
              }}
              style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.border }}
            >
              <Text style={[font.body, { flex: 1, color: c.text, fontSize: 15 }]}>{item.label}</Text>
              {item.value === value ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
            </Pressable>
          )}
        />
      </Sheet>
    </View>
  );
}

/* ================================================================== Full-screen loading overlay */
export function LoadingOverlay({ visible, message }: { visible: boolean; message: string }) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View testID="loading-overlay" style={{ flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: c.card, borderRadius: radius.lg, padding: 26, alignItems: 'center', gap: 14, minWidth: 220 }}>
          <Spinner />
          <Text testID="loading-overlay-message" style={[font.bodyStrong, { color: c.text, textAlign: 'center' }]}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function Spinner() {
  const { c } = useTheme();
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rot]);
  return (
    <Animated.View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 4,
        borderColor: c.primarySoft,
        borderTopColor: c.primary,
        transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      }}
    />
  );
}
