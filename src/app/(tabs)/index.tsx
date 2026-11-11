import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MovementRow } from '@/components/movement/movement-row';
import { QuickAddMenu } from '@/components/movement/quick-add-menu';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { OptionChips } from '@/components/ui/option-chips';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAccounts } from '@/hooks/use-accounts';
import { useDashboard } from '@/hooks/use-dashboard';
import type { DashboardPeriod } from '@/utils/dates';
import { formatMoney } from '@/utils/format';

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomeScreen() {
  const router = useRouter();
  const { accounts } = useAccounts();
  const { period, setPeriod, summary, latest, loading, error } = useDashboard();

  const activeAccounts = (accounts ?? []).filter((account) => account.is_active);
  const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);
  const todayLabel = capitalizeFirst(format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es }));
  const balance = summary ? summary.income - summary.expense : 0;

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
    <Screen>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText variant="title">Inicio</ThemedText>
          <ThemedText variant="small" color="muted">
            {todayLabel}
          </ThemedText>
        </View>
        <Card style={styles.balanceCard}>
          <ThemedText variant="small" color="muted">
            Saldo total
          </ThemedText>
          <ThemedText
            variant="title"
            style={styles.balanceAmount}
            color={totalBalance < 0 ? 'expense' : 'default'}
          >
            {formatMoney(totalBalance)}
          </ThemedText>
          <ThemedText variant="tiny" color="faint">
            {activeAccounts.length} {activeAccounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <OptionChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          {error ? (
            <ThemedText variant="small" color="expense">
              {error}
            </ThemedText>
          ) : summary ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <IconBadge icon="arrow-down-circle" color={Colors.income} size={34} />
                <ThemedText variant="tiny" color="muted">
                  Ingresos
                </ThemedText>
                <ThemedText variant="body" color="income" style={styles.summaryValue}>
                  {formatMoney(summary.income)}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <IconBadge icon="arrow-up-circle" color={Colors.expense} size={34} />
                <ThemedText variant="tiny" color="muted">
                  Gastos
                </ThemedText>
                <ThemedText variant="body" color="expense" style={styles.summaryValue}>
                  {formatMoney(summary.expense)}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <IconBadge icon="wallet" color={Colors.primary} size={34} />
                <ThemedText variant="tiny" color="muted">
                  Balance
                </ThemedText>
                <ThemedText
                  variant="body"
                  color={balance < 0 ? 'expense' : 'primary'}
                  style={styles.summaryValue}
                >
                  {formatMoney(balance)}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle">Cuentas</ThemedText>
            <Pressable onPress={() => router.push('/accounts')} hitSlop={8}>
              <ThemedText variant="small" color="primary">
                Ver todas
              </ThemedText>
            </Pressable>
          </View>
          {activeAccounts.length === 0 ? (
            <ThemedText variant="small" color="faint">
              Aún no tienes cuentas activas.
            </ThemedText>
          ) : (
            activeAccounts.slice(0, 4).map((account) => (
              <Pressable
                key={account.id}
                onPress={() => router.push('/accounts')}
                style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
              >
                <IconBadge icon={account.icon} color={account.color} size={38} />
                <ThemedText variant="body" style={styles.accountName} numberOfLines={1}>
                  {account.name}
                </ThemedText>
                <ThemedText
                  variant="body"
                  color={account.balance < 0 ? 'expense' : 'default'}
                  style={styles.accountBalance}
                >
                  {formatMoney(account.balance, account.currency)}
                </ThemedText>
              </Pressable>
            ))
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle">Últimos movimientos</ThemedText>
            <Pressable onPress={() => router.push('/movements')} hitSlop={8}>
              <ThemedText variant="small" color="primary">
                Ver todos
              </ThemedText>
            </Pressable>
          </View>
          {latest.length === 0 ? (
            <View style={styles.emptyMovements}>
              <Placeholder
                icon="receipt"
                title="Sin movimientos"
                message="Registra tu primer ingreso o gasto con el botón +."
              />
            </View>
          ) : (
            latest.map((movement) => (
              <MovementRow
                key={movement.id}
                movement={movement}
                onPress={() =>
                  router.push({ pathname: '/movement-form', params: { id: movement.id } })
                }
              />
            ))
          )}
        </Card>
      </ScrollView>

      <QuickAddMenu />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: {
    gap: 2,
  },
  card: {
    gap: Spacing.md,
  },
  balanceCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  balanceAmount: {
    fontSize: Typography.title + 8,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryValue: {
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
  },
  accountName: {
    flex: 1,
    fontWeight: '500',
  },
  accountBalance: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  emptyMovements: {
    alignItems: 'center',
  },
});
