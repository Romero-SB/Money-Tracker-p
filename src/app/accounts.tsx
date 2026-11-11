import { Stack, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { ACCOUNT_TYPE_LABELS } from '@/constants/options';
import { Colors, Spacing } from '@/constants/theme';
import { useAccounts } from '@/hooks/use-accounts';
import { formatMoney } from '@/utils/format';

export default function AccountsScreen() {
  const { accounts, error } = useAccounts();

  const totalBalance = (accounts ?? [])
    .filter((account) => account.is_active)
    .reduce((sum, account) => sum + account.balance, 0);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Cuentas' }} />

      <Card style={styles.totalCard}>
        <ThemedText variant="small" color="muted">
          Saldo total
        </ThemedText>
        <ThemedText variant="title" color="primary" style={styles.totalAmount}>
          {formatMoney(totalBalance)}
        </ThemedText>
        <ThemedText variant="tiny" color="faint">
          {(accounts ?? []).filter((account) => account.is_active).length} cuentas activas
        </ThemedText>
      </Card>

      {accounts === null && !error ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <ThemedText color="expense" style={styles.center}>
          {error}
        </ThemedText>
      ) : accounts !== null && accounts.length === 0 ? (
        <Placeholder
          icon="wallet"
          title="Sin cuentas"
          message="Crea tu primera cuenta para empezar a registrar tus movimientos."
        />
      ) : (
        <Card style={styles.listCard}>
          {accounts?.map((account) => (
            <ListRow
              key={account.id}
              icon={account.icon}
              color={account.color}
              title={account.name}
              subtitle={
                account.is_active
                  ? ACCOUNT_TYPE_LABELS[account.type]
                  : `${ACCOUNT_TYPE_LABELS[account.type]} · Inactiva`
              }
              dimmed={!account.is_active}
              right={
                <View style={styles.balanceContainer}>
                  <ThemedText
                    variant="body"
                    color={account.balance >= 0 ? 'income' : 'expense'}
                    style={styles.balance}
                  >
                    {formatMoney(account.balance, account.currency)}
                  </ThemedText>
                </View>
              }
              onPress={() => router.push({ pathname: '/account-form', params: { id: account.id } })}
            />
          ))}
        </Card>
      )}

      <Button label="Nueva cuenta" onPress={() => router.push('/account-form')} style={styles.addButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  totalCard: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  totalAmount: {
    fontSize: 32,
  },
  listCard: {
    paddingVertical: Spacing.xs,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontWeight: '600',
  },
  addButton: {
    marginTop: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  center: {
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
