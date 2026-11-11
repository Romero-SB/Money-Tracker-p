import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import type { SelectorOption } from '@/components/pickers/selector-modal';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type FieldSelectorProps = {
  label: string;
  placeholder: string;
  option?: SelectorOption | null;
  onPress: () => void;
};

export function FieldSelector({ label, placeholder, option, onPress }: FieldSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {option ? (
          <IconBadge icon={option.icon} color={option.color} size={36} />
        ) : (
          <View style={styles.emptyBadge}>
            <Ionicons name="chevron-expand" size={18} color={Colors.textFaint} />
          </View>
        )}
        <Text style={[styles.value, !option && styles.placeholder]} numberOfLines={1}>
          {option ? option.title : placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: Colors.textMuted,
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
    paddingVertical: Spacing.sm + 2,
    minHeight: 56,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textFaint,
  },
});
