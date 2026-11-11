import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useRecurring } from '@/hooks/use-recurring';
import { FREQUENCY_LABELS } from '@/db/repositories/recurring';
import type { RecurringWithDetails } from '@/types/models';
import { formatMoney } from '@/utils/format';
import { todayISO } from '@/utils/dates';

function typeIcon(type: string): { icon: 'add-circle' | 'remove-circle'; color: string } {
  return type === 'income'
    ? { icon: 'add-circle', color: Colors.income }
    : { icon: 'remove-circle', color: Colors.expense };
}

function RecurringCard({ item }: { item: RecurringWithDetails }) {
  const { icon, color } = typeIcon(item.type);
  const due = item.is_active && item.next_run <= todayISO();
  const nextLabel = format(parseISO(item.next_run), "d MMM yyyy", { locale: es });

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/recurring-form', params: { id: item.id } })}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <IconBadge icon={icon} color={color} />
          <View style={styles.titleColumn}>
            <ThemedText variant="body" style={styles.name} numberOfLines={1}>
              {item.description || 'Sin descripción'}
            </ThemedText>
            <ThemedText variant="tiny" color="faint" numberOfLines={1}>
              {FREQUENCY_LABELS[item.frequency]} · {item.account_name}
              {item.category_name ? ` · ${item.category_name}` : ''}
            </ThemedText>
          </View>
          <ThemedText variant="body" color={item.type === 'income' ? 'income' : 'expense'} style={styles.amount}>
            {formatMoney(item.amount)}
          </ThemedText>
        </View>
        <View style={styles.footerRow}>
          <ThemedText variant="tiny" color={due ? 'savings' : 'faint'}>
            {due ? `Vencida · próxima: ${nextLabel}` : `Próxima: ${nextLabel}`}
          </ThemedText>
          {!item.is_active ? <ThemedText variant="tiny" color="faint">Pausada</ThemedText> : null}
        </View>
      </Card>
    </Pressable>
  );
}

export default function RecurringScreen() {
  const { items, error } = useRecurring();

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Recurrentes' }} />

      {items === null && !error ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <ThemedText color="expense" style={styles.center}>
          {error}
        </ThemedText>
      ) : items !== null && items.length === 0 ? (
        <Placeholder
          icon="repeat"
          title="Sin recurrentes"
          message="Crea transacciones que se repiten (sueldo, alquiler, suscripciones) y recibe recordatorios para registrarlas."
        />
      ) : (
        <View style={styles.list}>
          {items?.map((item) => (
            <RecurringCard key={item.id} item={item} />
          ))}
        </View>
      )}

      <Button
        label="Nueva recurrente"
        onPress={() => router.push('/recurring-form')}
        style={styles.addButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: Spacing.xxl,
  },
  center: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  titleColumn: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
  amount: {
    fontWeight: '600',
    fontSize: Typography.body,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    marginTop: Spacing.lg,
  },
});
