import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/constants/options';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type OptionChipsProps<T extends string> = {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function OptionChips<T extends string>({ options, value, onChange, disabled = false }: OptionChipsProps<T>) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={16}
                color={selected ? Colors.primary : Colors.textMuted}
              />
            ) : null}
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  label: {
    fontSize: Typography.small,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
});
