import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';

type StatusPillProps = {
  label: string;
  color: string;
};

export function StatusPill({ label, color }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1F` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs + 2,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  label: {
    fontSize: Typography.tiny,
    fontWeight: '600',
  },
});
