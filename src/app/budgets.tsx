import { Stack, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useBudgets } from '@/hooks/use-budgets';
import type { BudgetWithProgress } from '@/types/models';
import { formatMoney } from '@/utils/format';

const PERIOD_LABELS = {
  monthly: 'Mensual',
  yearly: 'Anual',
} as const;

function progressColor(progress: number): string {
  if (progress >= 1) {
    return Colors.expense;
  }
  if (progress >= 0.8) {
    return Colors.warning;
  }
  return Colors.primary;
}

function BudgetCard({ budget }: { budget: BudgetWithProgress }) {
  const percent = Math.round(budget.progress * 100);
  const color = progressColor(budget.progress);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/budget-form', params: { id: budget.id } })}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.budgetCard}>
        <View style={styles.headerRow}>
          <IconBadge icon={budget.category_icon} color={budget.category_color} />
          <View style={styles.titleColumn}>
            <ThemedText variant="body" style={styles.name}>
              {budget.category_name}
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              {PERIOD_LABELS[budget.period]}
            </ThemedText>
          </View>
          <ThemedText variant="body" color={budget.progress >= 1 ? 'expense' : 'default'} style={styles.percent}>
            {percent}%
          </ThemedText>
        </View>

        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(budget.progress, 1) * 100}%`, backgroundColor: color },
            ]}
          />
        </View>

        <View style={styles.amountRow}>
          <ThemedText variant="small" color="muted">
            {formatMoney(budget.spent)} de {formatMoney(budget.amount)}
          </ThemedText>
          <ThemedText
            variant="small"
            color={budget.remaining >= 0 ? 'income' : 'expense'}
            style={styles.remaining}
          >
            {budget.remaining >= 0
              ? `Disponible: ${formatMoney(budget.remaining)}`
              : `Excedido: ${formatMoney(Math.abs(budget.remaining))}`}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

export default function BudgetsScreen() {
  const { budgets, error } = useBudgets();

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Presupuestos' }} />

      {budgets === null && !error ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <ThemedText color="expense" style={styles.center}>
          {error}
        </ThemedText>
      ) : budgets !== null && budgets.length === 0 ? (
        <Placeholder
          icon="pie-chart"
          title="Sin presupuestos"
          message="Crea un presupuesto por categoría para controlar cuánto gastas cada mes."
        />
      ) : (
        <View style={styles.list}>
          {budgets?.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </View>
      )}

      <Button label="Nuevo presupuesto" onPress={() => router.push('/budget-form')} style={styles.addButton} />
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
  budgetCard: {
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
  percent: {
    fontSize: Typography.subtitle,
    fontWeight: '700',
  },
  bar: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBackground,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  remaining: {
    fontWeight: '600',
  },
  addButton: {
    marginTop: Spacing.lg,
  },
});
