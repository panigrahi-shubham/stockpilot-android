import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { font, radius, space, useTheme } from '@/theme';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

/* ------------------------------------------------------------------ Typography */
export function T({
  children,
  variant = 'body',
  color,
  style,
  testID,
  numberOfLines,
  selectable,
}: {
  children: React.ReactNode;
  variant?: keyof typeof font;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
  numberOfLines?: number;
  selectable?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Text
      testID={testID}
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[font[variant], { color: color ?? c.text }, style]}
    >
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ Button */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  testID,
  style,
  full = true,
  accessibilityLabel,
  iconRight,
}: {
  iconRight?: boolean;
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: IonName;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const map = {
    primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
    accent: { bg: c.accent, fg: '#2B1B00', border: c.accent },
    secondary: { bg: c.primarySoft, fg: c.primary, border: c.primarySoft },
    outline: { bg: 'transparent', fg: c.primary, border: c.primary },
    ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
    danger: { bg: c.danger, fg: '#fff', border: c.danger },
  }[variant];
  const h = size === 'sm' ? 36 : size === 'lg' ? 54 : 48;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h,
          borderRadius: radius.md,
          backgroundColor: map.bg,
          borderWidth: 1.5,
          borderColor: map.border,
          paddingHorizontal: size === 'sm' ? 14 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator testID={testID ? `${testID}-spinner` : undefined} color={map.fg} />
      ) : (
        <>
          {icon && !iconRight ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={map.fg} /> : null}
          <Text style={[size === 'sm' ? font.small : font.bodyStrong, { color: map.fg, fontWeight: '700' }]}>{title}</Text>
          {icon && iconRight ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={map.fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  testID,
  label,
  color,
  size = 22,
  badge,
  style,
  mci,
}: {
  icon: string;
  onPress?: () => void;
  testID?: string;
  label: string;
  color?: string;
  size?: number;
  badge?: number;
  style?: StyleProp<ViewStyle>;
  mci?: boolean;
}) {
  const { c } = useTheme();
  const Icon: any = mci ? MaterialCommunityIcons : Ionicons;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={color ?? c.text} />
      {badge ? (
        <View
          testID={testID ? `${testID}-badge` : undefined}
          style={{
            position: 'absolute',
            top: 3,
            right: 2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: c.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: c.card,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ TextField */
export function TextField({
  label,
  error,
  hint,
  secure,
  icon,
  testID,
  right,
  containerStyle,
  maxLength,
  showCounter,
  ...rest
}: TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  icon?: IonName;
  testID: string;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  showCounter?: boolean;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? c.danger : focused ? c.primary : c.border;
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text testID={`${testID}-label`} style={[font.small, { color: c.textMuted, fontWeight: '600' }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: rest.multiline ? 'flex-start' : 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: radius.md,
          backgroundColor: rest.editable === false ? c.cardAlt : c.card,
          paddingHorizontal: 12,
          minHeight: rest.multiline ? 96 : 50,
          gap: 8,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? c.primary : c.textFaint} style={rest.multiline ? { marginTop: 14 } : undefined} /> : null}
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          placeholderTextColor={c.textFaint}
          secureTextEntry={secure ? hidden : false}
          maxLength={maxLength}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            font.body,
            {
              flex: 1,
              color: c.text,
              fontSize: 15,
              paddingVertical: rest.multiline ? 12 : 0,
              textAlignVertical: rest.multiline ? 'top' : 'center',
              minHeight: rest.multiline ? 90 : 46,
            },
            rest.style,
          ]}
        />
        {secure ? (
          <Pressable
            testID={`${testID}-toggle-visibility`}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={10}
            onPress={() => setHidden((h) => !h)}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
        {right}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={14} color={c.danger} />
          <Text testID={`${testID}-error`} style={[font.small, { color: c.danger, flex: 1 }]}>
            {error}
          </Text>
        </View>
      ) : hint || (showCounter && maxLength) ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[font.small, { color: c.textFaint, flex: 1 }]}>{hint ?? ''}</Text>
          {showCounter && maxLength ? (
            <Text testID={`${testID}-counter`} style={[font.small, { color: c.textFaint }]}>
              {(rest.value ?? '').length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Checkbox / Radio / Switch */
export function Checkbox({
  checked,
  onChange,
  label,
  testID,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  testID: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? c.primary : c.textFaint,
          backgroundColor: checked ? c.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={c.onPrimary} /> : null}
      </View>
      {children ?? <Text style={[font.body, { color: c.text, flex: 1 }]}>{label}</Text>}
    </Pressable>
  );
}

export function RadioGroup<V extends string>({
  options,
  value,
  onChange,
  testID,
  horizontal,
}: {
  options: { value: V; label: string; description?: string; disabled?: boolean; right?: React.ReactNode }[];
  value: V | null;
  onChange: (v: V) => void;
  testID: string;
  horizontal?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View testID={testID} accessibilityRole="radiogroup" style={horizontal ? { gap: 10, flexDirection: 'row', flexWrap: 'wrap' } : { gap: 10 }}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <Pressable
            key={o.value}
            testID={`${testID}-${o.value}`}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, checked: selected, disabled: !!o.disabled }}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: selected ? c.primary : c.border,
              backgroundColor: selected ? c.primarySoft : c.card,
              opacity: o.disabled ? 0.5 : 1,
              flexGrow: horizontal ? 1 : undefined,
              flexBasis: horizontal ? 0 : undefined,
              minWidth: horizontal ? 96 : undefined,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: selected ? c.primary : c.textFaint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: c.primary }} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[font.bodyStrong, { color: c.text }]}>{o.label}</Text>
              {o.description ? <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{o.description}</Text> : null}
            </View>
            {o.right}
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  testID,
  icon,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID: string;
  icon?: IonName;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, opacity: disabled ? 0.5 : 1 }}>
      {icon ? <Ionicons name={icon} size={20} color={c.textMuted} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[font.bodyStrong, { color: c.text }]}>{label}</Text>
        {description ? <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{description}</Text> : null}
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ true: c.primary, false: c.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

/* ------------------------------------------------------------------ Chips, badges, segmented */
export function Chip({
  label,
  selected,
  onPress,
  testID,
  icon,
  onRemove,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  testID: string;
  icon?: IonName;
  onRemove?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: selected ? c.primary : c.border,
        backgroundColor: selected ? c.primary : c.card,
      }}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? c.onPrimary : c.textMuted} /> : null}
      <Text style={[font.small, { color: selected ? c.onPrimary : c.text, fontWeight: '700' }]}>{label}</Text>
      {onRemove ? (
        <Pressable testID={`${testID}-remove`} accessibilityLabel={`Remove ${label}`} hitSlop={8} onPress={onRemove}>
          <Ionicons name="close" size={14} color={selected ? c.onPrimary : c.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function Badge({
  label,
  tone = 'neutral',
  testID,
  icon,
}: {
  label: string;
  tone?: 'info' | 'warning' | 'success' | 'danger' | 'neutral' | 'accent';
  testID?: string;
  icon?: IonName;
}) {
  const { c } = useTheme();
  const map = {
    info: [c.infoSoft, c.info],
    warning: [c.warningSoft, c.warning],
    success: [c.successSoft, c.success],
    danger: [c.dangerSoft, c.danger],
    neutral: [c.cardAlt, c.textMuted],
    accent: [c.accentSoft, c.warning],
  }[tone];
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: map[0],
        borderRadius: radius.pill,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      {icon ? <Ionicons name={icon} size={11} color={map[1]} /> : null}
      <Text style={[font.tiny, { color: map[1], textTransform: 'uppercase' }]}>{label}</Text>
    </View>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: { value: V; label: string; count?: number }[];
  value: V;
  onChange: (v: V) => void;
  testID: string;
}) {
  const { c } = useTheme();
  return (
    <View testID={testID} accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c.cardAlt, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: c.border }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`${testID}-${o.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: radius.sm,
              backgroundColor: active ? c.card : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              shadowColor: '#000',
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 2 : 0,
            }}
          >
            <Text style={[font.small, { color: active ? c.primary : c.textMuted, fontWeight: '700' }]}>{o.label}</Text>
            {o.count !== undefined ? (
              <View style={{ backgroundColor: active ? c.primarySoft : c.border, borderRadius: 9, paddingHorizontal: 6, minWidth: 18, alignItems: 'center' }}>
                <Text testID={`${testID}-${o.value}-count`} style={[font.tiny, { color: active ? c.primary : c.textMuted }]}>
                  {o.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ Quantity stepper */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  testID,
  compact,
  editable = true,
  fill,
}: {
  fill?: boolean;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  testID: string;
  compact?: boolean;
  editable?: boolean;
}) {
  const { c } = useTheme();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const h = compact ? 34 : 42;
  const commit = () => {
    const n = parseInt(text, 10);
    if (isNaN(n)) return setText(String(value));
    onChange(Math.max(min, Math.min(max, n)));
  };
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: c.primary,
        borderRadius: radius.md,
        height: h,
        overflow: 'hidden',
        backgroundColor: c.card,
      }}
    >
      <Pressable
        testID={`${testID}-decrement`}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min && min > 0}
        style={{ width: h, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft }}
      >
        <Ionicons name={value <= step && min === 0 ? 'trash-outline' : 'remove'} size={18} color={c.primary} />
      </Pressable>
      <TextInput
        testID={`${testID}-value`}
        accessibilityLabel="Quantity"
        value={text}
        editable={editable}
        onChangeText={(t) => setText(t.replace(/[^0-9]/g, ''))}
        onEndEditing={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={[font.bodyStrong, fill ? { flex: 1, minWidth: 0 } : { width: compact ? 40 : 52 }, { textAlign: 'center', color: c.text, padding: 0 }]}
      />
      <Pressable
        testID={`${testID}-increment`}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        style={{ width: h, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft, opacity: value >= max ? 0.4 : 1 }}
      >
        <Ionicons name="add" size={18} color={c.primary} />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ Layout bits */
export function Card({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const { c, mode } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: c.card,
          borderRadius: radius.lg,
          padding: space.lg,
          borderWidth: mode === 'dark' ? 1 : 0,
          borderColor: c.border,
          shadowColor: '#0B2B24',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeader({ title, action, onAction, testID }: { title: string; action?: string; onAction?: () => void; testID?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text testID={testID} style={[font.h3, { color: c.text }]}>
        {title}
      </Text>
      {action ? (
        <Pressable testID={testID ? `${testID}-action` : undefined} accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[font.small, { color: c.primary, fontWeight: '700' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.border, marginVertical: 10 }, style]} />;
}

export function Row({
  label,
  value,
  testID,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  testID?: string;
  bold?: boolean;
  valueColor?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 }}>
      <Text style={[bold ? font.h3 : font.body, { color: bold ? c.text : c.textMuted, flexShrink: 1 }]}>{label}</Text>
      <Text testID={testID} style={[bold ? font.h3 : font.bodyStrong, { color: valueColor ?? c.text, textAlign: 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  testID,
  right,
  danger,
  mci,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  testID: string;
  right?: React.ReactNode;
  danger?: boolean;
  mci?: boolean;
}) {
  const { c } = useTheme();
  const Icon: any = mci ? MaterialCommunityIcons : Ionicons;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? c.dangerSoft : c.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={danger ? c.danger : c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[font.bodyStrong, { color: danger ? c.danger : c.text }]}>{title}</Text>
        {subtitle ? <Text style={[font.small, { color: c.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={c.textFaint} />}
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  onAction,
  testID,
}: {
  icon: IonName;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  testID: string;
}) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 10 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Ionicons name={icon} size={38} color={c.primary} />
      </View>
      <Text testID={`${testID}-title`} style={[font.h2, { color: c.text, textAlign: 'center' }]}>
        {title}
      </Text>
      {subtitle ? <Text style={[font.body, { color: c.textMuted, textAlign: 'center', lineHeight: 20 }]}>{subtitle}</Text> : null}
      {action ? <Button testID={`${testID}-action`} title={action} onPress={onAction} full={false} style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, testID = 'error-state' }: { message: string; onRetry: () => void; testID?: string }) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ alignItems: 'center', padding: 32, gap: 12 }}>
      <Ionicons name="cloud-offline-outline" size={44} color={c.danger} />
      <Text testID={`${testID}-message`} style={[font.body, { color: c.text, textAlign: 'center' }]}>
        {message}
      </Text>
      <Button testID={`${testID}-retry`} title="Retry" icon="refresh" variant="outline" full={false} onPress={onRetry} />
    </View>
  );
}

export function Skeleton({ width, height, style, radius: r = 8 }: { width: number | `${number}%`; height: number; style?: StyleProp<ViewStyle>; radius?: number }) {
  const { c } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: c.skeleton, opacity }, style]} />;
}

export function Stars({ value, size = 14, testID, onChange }: { value: number; size?: number; testID?: string; onChange?: (v: number) => void }) {
  const { c } = useTheme();
  return (
    <View testID={testID} accessibilityLabel={`Rating ${value} out of 5`} style={{ flexDirection: 'row', gap: onChange ? 10 : 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i ? 'star' : value >= i - 0.5 ? 'star-half-full' : 'star-outline';
        const icon = <MaterialCommunityIcons key={i} name={name as any} size={size} color={c.accent} />;
        return onChange ? (
          <Pressable key={i} testID={testID ? `${testID}-${i}` : undefined} accessibilityRole="button" accessibilityLabel={`${i} star`} onPress={() => onChange(i)}>
            {icon}
          </Pressable>
        ) : (
          icon
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color, testID, height = 8 }: { value: number; color?: string; testID?: string; height?: number }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height, backgroundColor: c.border, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? c.primary, borderRadius: height }} />
    </View>
  );
}
