import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { OptionChips } from '@/components/ui/option-chips';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useStats } from '@/hooks/use-stats';
import type { StatsPeriod } from '@/utils/dates';
import { statsPeriodLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/format';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string; icon: 'calendar' | 'hourglass' | 'calendar-clear' }[] = [
  { value: 'month', label: 'Mes', icon: 'calendar' },
  { value: 'quarter', label: '3 meses', icon: 'hourglass' },
  { value: 'year', label: 'Año', icon: 'calendar-clear' },
];

function LegendDot({ color }: { color: string }) {
  return <View style={[styles.legendDot, { backgroundColor: color }]} />;
}

export default function StatsScreen() {
  const { period, setPeriod, categoryExpenses, monthly, error } = useStats();

  const totalExpense = useMemo(
    () => (categoryExpenses ?? []).reduce((sum, item) => sum + item.total, 0),
    [categoryExpenses]
  );

  const pieData = useMemo(
    () =>
      (categoryExpenses ?? []).map((item) => ({
        value: item.total,
        color: item.category_color,
      })),
    [categoryExpenses]
  );

  const monthlyHasData = useMemo(
    () => (monthly ?? []).some((point) => point.income > 0 || point.expense > 0),
    [monthly]
  );

  const lineIncome = useMemo(
    () => (monthly ?? []).map((point) => ({ value: point.income, label: point.label })),
    [monthly]
  );
  const lineExpense = useMemo(
    () => (monthly ?? []).map((point) => ({ value: point.expense, label: point.label })),
    [monthly]
  );

  const loading = categoryExpenses === null && monthly === null && !error;

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <OptionChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
        {error ? (
          <ThemedText color="expense" style={styles.center}>
            {error}
          </ThemedText>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <View style={styles.titleColumn}>
          <ThemedText variant="subtitle">Gastos por categoría</ThemedText>
          <ThemedText variant="tiny" color="faint">
            {statsPeriodLabel(period)} · {formatMoney(totalExpense)}
          </ThemedText>
        </View>
        {totalExpense === 0 ? (
          <ThemedText variant="small" color="muted" style={styles.emptyText}>
            Sin gastos registrados en este período.
          </ThemedText>
        ) : (
          <>
            <View style={styles.chartCenter}>
              <PieChart
                data={pieData}
                donut
                radius={95}
                innerRadius={65}
                strokeColor={Colors.card}
                strokeWidth={2}
                focusOnPress
                centerLabelComponent={() => (
                  <View style={styles.centerColumn}>
                    <ThemedText variant="tiny" color="faint">
                      TOTAL
                    </ThemedText>
                    <ThemedText variant="body" color="primary" style={styles.centerTotal}>
                      {formatMoney(totalExpense)}
                    </ThemedText>
                  </View>
                )}
              />
            </View>
            <View style={styles.categoryList}>
              {categoryExpenses?.slice(0, 10).map((item) => {
                const percent = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
                return (
                  <View key={item.category_id} style={styles.categoryRow}>
                    <IconBadge icon={item.category_icon} color={item.category_color} size={32} />
                    <ThemedText variant="small" style={styles.categoryName} numberOfLines={1}>
                      {item.category_name}
                    </ThemedText>
                    <ThemedText variant="small" color="muted" style={styles.categoryAmount}>
                      {formatMoney(item.total)} · {Math.round(percent)}%
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.titleColumn}>
          <ThemedText variant="subtitle">Ingresos vs gastos</ThemedText>
          <ThemedText variant="tiny" color="faint">
            Últimos 6 meses
          </ThemedText>
        </View>
        {!monthlyHasData ? (
          <ThemedText variant="small" color="muted" style={styles.emptyText}>
            Aún no hay movimientos para comparar.
          </ThemedText>
        ) : (
          <>
            <LineChart
              data={lineIncome}
              data2={lineExpense}
              color={Colors.income}
              color2={Colors.expense}
              startFillColor={`${Colors.income}33`}
              endFillColor={`${Colors.income}05`}
              startFillColor2={`${Colors.expense}33`}
              endFillColor2={`${Colors.expense}05`}
              curved
              areaChart
              hideDataPoints
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              initialSpacing={Spacing.sm}
              endSpacing={Spacing.sm}
              adjustToWidth
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <LegendDot color={Colors.income} />
                <ThemedText variant="tiny" color="muted">
                  Ingresos
                </ThemedText>
              </View>
              <View style={styles.legendItem}>
                <LegendDot color={Colors.expense} />
                <ThemedText variant="tiny" color="muted">
                  Gastos
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: Spacing.lg,
  },
  titleColumn: {
    gap: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  chartCenter: {
    alignItems: 'center',
  },
  centerColumn: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  centerTotal: {
    fontWeight: '700',
  },
  categoryList: {
    gap: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryName: {
    flex: 1,
  },
  categoryAmount: {
    fontSize: Typography.small,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  axisText: {
    fontSize: Typography.tiny,
    color: Colors.textMuted,
  },
});
