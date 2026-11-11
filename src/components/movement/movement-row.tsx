import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { MovementWithDetails } from '@/types/models';
import { formatMoney } from '@/utils/format';
import { timeLabel } from '@/utils/dates';

type MovementRowProps = {
  movement: MovementWithDetails;
  onPress: () => void;
};

export function MovementRow({ movement, onPress }: MovementRowProps) {
  const icon =
    movement.type === 'transfer'
      ? 'swap-horizontal'
      : movement.type === 'income'
        ? (movement.category_icon ?? 'add-circle')
        : (movement.category_icon ?? 'remove-circle');
  const color =
    movement.type === 'transfer'
      ? Colors.transfer
      : movement.type === 'income'
        ? (movement.category_color ?? Colors.income)
        : (movement.category_color ?? Colors.expense);

  const title =
    movement.description || movement.category_name ||
    (movement.type === 'transfer' ? 'Transferencia' : 'Sin categoría');

  const subtitle =
    movement.type === 'transfer' && movement.destination_account_name
      ? `${movement.account_name} → ${movement.destination_account_name}`
      : movement.account_name;

  const amountText =
    movement.type === 'income'
      ? `+${formatMoney(movement.amount)}`
      : movement.type === 'expense'
        ? `-${formatMoney(movement.amount)}`
        : formatMoney(movement.amount);

  const amountColor =
    movement.type === 'income' ? 'income' : movement.type === 'expense' ? 'expense' : 'transfer';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <IconBadge icon={icon} color={color} size={42} />
      <View style={styles.textContainer}>
        <ThemedText variant="body" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText variant="tiny" color="faint" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <View style={styles.right}>
        <ThemedText variant="body" color={amountColor} style={styles.amount}>
          {amountText}
        </ThemedText>
        <View style={styles.metaRow}>
          {movement.attachment_count > 0 ? (
            <Ionicons name="attach" size={12} color={Colors.textFaint} style={styles.attach} />
          ) : null}
          <ThemedText variant="tiny" color="faint">
            {timeLabel(movement.occurred_at)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
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
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attach: {
    marginTop: 1,
  },
});
