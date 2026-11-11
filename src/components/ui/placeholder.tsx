import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type PlaceholderProps = {
  icon: IconName;
  title: string;
  message: string;
};

export function Placeholder({ icon, title, message }: PlaceholderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={36} color={Colors.primary} />
      </View>
      <ThemedText variant="title" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="body" color="muted" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
