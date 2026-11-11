import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { dateTimeLabel } from '@/utils/dates';

type DateTimeFieldProps = {
  value: Date;
  onChange: (date: Date) => void;
};

export function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const androidSteps = useAndroidSteps(value, onChange);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          locale="es_ES"
          onChange={(event, date) => {
            if (date) {
              onChange(date);
            }
          }}
          style={styles.iosPicker}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={androidSteps.open}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Ionicons name="calendar" size={20} color={Colors.primary} />
        <Text style={styles.value}>{dateTimeLabel(value.toISOString())}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
      </Pressable>
      {androidSteps.visible ? (
        <DateTimePicker
          value={value}
          mode={androidSteps.mode}
          is24Hour
          onChange={androidSteps.handleChange}
        />
      ) : null}
    </View>
  );
}

function useAndroidSteps(value: Date, onChange: (date: Date) => void) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const open = () => {
    setPendingDate(null);
    setMode('date');
    setVisible(true);
  };

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type !== 'set' || !date) {
      setVisible(false);
      setPendingDate(null);
      return;
    }
    if (mode === 'date') {
      setPendingDate(date);
      setMode('time');
      return;
    }
    const base = pendingDate ?? value;
    const merged = new Date(base);
    merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
    onChange(merged);
    setVisible(false);
    setPendingDate(null);
  };

  return { visible, mode, open, handleChange };
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.7,
  },
  value: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.text,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
});
