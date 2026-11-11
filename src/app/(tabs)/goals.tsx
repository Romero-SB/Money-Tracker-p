import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useGoals } from '@/hooks/use-goals';
import type { GoalWithProgress } from '@/types/models';
import { formatMoney } from '@/utils/format';

function deadlineLabel(deadline: string | null): string {
  if (!deadline) {
    return 'Sin fecha límite';
  }
  const date = parseISO(deadline);
  const days = differenceInCalendarDays(date, new Date());
  const formatted = format(date, "d MMM yyyy", { locale: es });
  if (days < 0) {
    return `Venció el ${formatted}`;
  }
  if (days === 0) {
    return 'Vence hoy';
  }
  if (days === 1) {
    return 'Vence mañana';
  }
  return `Vence el ${formatted} · faltan ${days} días`;
}

function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const complete = goal.progress >= 1;
  const color = complete ? Colors.income : Colors.savings;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/goal-form', params: { id: goal.id } })}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.goalCard}>
        <View style={styles.headerRow}>
          <IconBadge icon={complete ? 'checkmark-circle' : 'flag'} color={color} />
          <View style={styles.titleColumn}>
            <ThemedText variant="body" style={styles.name} numberOfLines={1}>
              {goal.name}
            </ThemedText>
            <ThemedText variant="tiny" color="faint" numberOfLines={1}>
              {deadlineLabel(goal.deadline)}
            </ThemedText>
          </View>
          <ThemedText variant="body" color={complete ? 'income' : 'default'} style={styles.percent}>
            {Math.round(goal.progress * 100)}%
          </ThemedText>
        </View>

        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(goal.progress, 1) * 100}%`, backgroundColor: color },
            ]}
          />
        </View>

        <View style={styles.amountRow}>
          <ThemedText variant="small" color="muted">
            {formatMoney(goal.saved)} de {formatMoney(goal.target_amount)}
          </ThemedText>
          <ThemedText variant="small" color={complete ? 'income' : 'savings'} style={styles.remaining}>
            {complete
              ? '¡Meta completada!'
              : `Falta ${formatMoney(goal.remaining)}`}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

export default function GoalsScreen() {
  const { goals, error } = useGoals();

  const activeGoals = (goals ?? []).filter((goal) => goal.is_active);
  const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.target_amount, 0);

  return (
    <Screen scroll>
      {goals === null && !error ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <ThemedText color="expense" style={styles.center}>
          {error}
        </ThemedText>
      ) : goals !== null && goals.length === 0 ? (
        <Placeholder
          icon="flag"
          title="Sin metas de ahorro"
          message="Crea una meta para ahorrar con propósito: un viaje, un fondo de emergencia y más."
        />
      ) : (
        <>
          <Card style={styles.totalCard}>
            <ThemedText variant="small" color="muted">
              Ahorro total en metas
            </ThemedText>
            <ThemedText variant="title" color="primary" style={styles.totalAmount}>
              {formatMoney(totalSaved)}
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              de {formatMoney(totalTarget)} en {activeGoals.length}{' '}
              {activeGoals.length === 1 ? 'meta activa' : 'metas activas'}
            </ThemedText>
          </Card>

          <View style={styles.list}>
            {goals?.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </View>
        </>
      )}

      <Button label="Nueva meta" onPress={() => router.push('/goal-form')} style={styles.addButton} />
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
  totalCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  totalAmount: {
    fontSize: 32,
  },
  list: {
    gap: Spacing.md,
  },
  goalCard: {
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
