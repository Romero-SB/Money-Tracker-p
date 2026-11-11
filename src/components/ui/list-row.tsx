import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type ListRowProps = {
  icon: string;
  color: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  dimmed?: boolean;
};

export function ListRow({ icon, color, title, subtitle, right, onPress, dimmed = false }: ListRowProps) {
  const content = (
    <View style={[styles.row, dimmed && styles.dimmed]}>
      <IconBadge icon={icon} color={color} />
      <View style={styles.textContainer}>
        <ThemedText variant="body" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText variant="tiny" color="faint" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={20} color={Colors.textFaint} />}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  dimmed: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '500',
  },
});
