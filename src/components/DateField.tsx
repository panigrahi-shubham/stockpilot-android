import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, useTheme } from '@/theme';
import { fmtDay } from '@/utils/format';

/**
 * Native date picker field.
 * Android → system dialog (DatePickerDialog, buttons "OK"/"Cancel", id android:id/button1).
 * iOS → inline calendar that expands under the field.
 */
export function DateField({
  label,
  value,
  onChange,
  testID,
  minimumDate,
  maximumDate,
  error,
  placeholder = 'Select date',
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  testID: string;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string | null;
  placeholder?: string;
}) {
  const { c, mode } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? minimumDate ?? new Date(),
        mode: 'date',
        minimumDate,
        maximumDate,
        onValueChange: (_e, d) => d && onChange(d),
      });
    } else setIosOpen((o) => !o);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={[font.small, { color: c.textMuted, fontWeight: '600' }]}>{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? fmtDay(value) : placeholder}`}
        onPress={open}
        style={{
          height: 50,
          borderWidth: 1.5,
          borderColor: error ? c.danger : iosOpen ? c.primary : c.border,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: c.card,
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={c.primary} />
        <Text testID={`${testID}-value`} style={[font.body, { flex: 1, fontSize: 15, color: value ? c.text : c.textFaint }]}>
          {value ? fmtDay(value) : placeholder}
        </Text>
        <Ionicons name={iosOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
      </Pressable>
      {error ? (
        <Text testID={`${testID}-error`} style={[font.small, { color: c.danger }]}>
          {error}
        </Text>
      ) : null}
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          testID={`${testID}-picker`}
          value={value ?? minimumDate ?? new Date()}
          mode="date"
          display="inline"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          themeVariant={mode}
          accentColor={c.primary}
          onValueChange={(_e, d) => {
            onChange(d);
            setIosOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}
