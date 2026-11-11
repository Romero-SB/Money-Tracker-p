import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { SelectorModal } from '@/components/pickers/selector-modal';
import { MovementRow } from '@/components/movement/movement-row';
import { QuickAddMenu } from '@/components/movement/quick-add-menu';
import { AppTextInput } from '@/components/ui/text-input';
import { OptionChips } from '@/components/ui/option-chips';
import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAccounts } from '@/hooks/use-accounts';
import { useMovements } from '@/hooks/use-movements';
import type { MovementType, MovementWithDetails } from '@/types/models';
import { dayKey, dayLabel } from '@/utils/dates';

const PAGE_SIZE = 30;

type TypeFilter = 'all' | MovementType;

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string; icon?: 'apps' | 'add-circle' | 'remove-circle' | 'swap-horizontal' }[] = [
  { value: 'all', label: 'Todos', icon: 'apps' },
  { value: 'income', label: 'Ingresos', icon: 'add-circle' },
  { value: 'expense', label: 'Gastos', icon: 'remove-circle' },
  { value: 'transfer', label: 'Transf.', icon: 'swap-horizontal' },
];

type HistoryRow =
  | { key: string; kind: 'header'; label: string }
  | { key: string; kind: 'movement'; movement: MovementWithDetails };

function buildRows(items: MovementWithDetails[]): HistoryRow[] {
  const rows: HistoryRow[] = [];
  let lastKey = '';
  for (const movement of items) {
    const key = dayKey(movement.occurred_at);
    if (key !== lastKey) {
      rows.push({ key: `header-${key}`, kind: 'header', label: dayLabel(movement.occurred_at) });
      lastKey = key;
    }
    rows.push({ key: `m-${movement.id}`, kind: 'movement', movement });
  }
  return rows;
}

export default function MovementsScreen() {
  const router = useRouter();
  const { filters, setFilters, items, total, loading, loadingMore, error, loadMore, hasMore } =
    useMovements();
  const { accounts } = useAccounts();
  const [searchText, setSearchText] = useState('');
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);

  const rows = useMemo(() => buildRows(items), [items]);

  const accountOptions = useMemo(
    () =>
      (accounts ?? []).map((account) => ({
        id: account.id,
        icon: account.icon,
        color: account.color,
        title: account.name,
        subtitle: account.is_active ? undefined : 'Inactiva',
      })),
    [accounts]
  );

  const selectedAccount = accountOptions.find((option) => option.id === filters.account_id) ?? null;

  const handleTypeChip = (value: TypeFilter) => {
    setFilters({ ...filters, type: value === 'all' ? undefined : value });
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchText.trim() || undefined });
  };

  const handleSelectAccount = (id: number) => {
    setFilters({ ...filters, account_id: id });
  };

  const handleSelectAllAccounts = () => {
    setFilters({ ...filters, account_id: undefined });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText variant="title">Movimientos</ThemedText>
        <ThemedText variant="small" color="muted">
          {total} {total === 1 ? 'movimiento' : 'movimientos'}
        </ThemedText>
      </View>

      <View style={styles.filters}>
        <OptionChips options={TYPE_FILTER_OPTIONS} value={filters.type ?? 'all'} onChange={handleTypeChip} />
        <View style={styles.filterRow}>
          <View style={styles.searchContainer}>
            <AppTextInput
              placeholder="Buscar..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          <Pressable
            onPress={() => setAccountPickerVisible(true)}
            style={({ pressed }) => [styles.accountButton, pressed && styles.pressed]}
          >
            <Ionicons
              name="funnel"
              size={16}
              color={selectedAccount ? Colors.primary : Colors.textMuted}
            />
            <ThemedText
              variant="small"
              color={selectedAccount ? 'primary' : 'muted'}
              numberOfLines={1}
              style={styles.accountLabel}
            >
              {selectedAccount ? selectedAccount.title : 'Cuenta'}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Placeholder icon="cloud-offline" title="Algo salió mal" message={error} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Placeholder
            icon="receipt"
            title="Sin movimientos"
            message={
              filters.type || filters.account_id || filters.search
                ? 'Ningún movimiento coincide con los filtros.'
                : 'Registra tu primer ingreso o gasto con el botón +.'
            }
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={rows}
            keyExtractor={(row) => row.key}
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <View style={styles.dayHeader}>
                    <ThemedText variant="tiny" color="muted" style={styles.dayHeaderText}>
                      {item.label}
                    </ThemedText>
                  </View>
                );
              }
              return (
                <MovementRow
                  movement={item.movement}
                  onPress={() =>
                    router.push({ pathname: '/movement-form', params: { id: item.movement.id } })
                  }
                />
              );
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : total > PAGE_SIZE && !hasMore ? (
                <View style={styles.footer}>
                  <ThemedText variant="tiny" color="faint">
                    Has llegado al final
                  </ThemedText>
                </View>
              ) : null
            }
          />
        </View>
      )}

      <QuickAddMenu />

      <SelectorModal
        visible={accountPickerVisible}
        onClose={() => setAccountPickerVisible(false)}
        title="Filtrar por cuenta"
        options={accountOptions}
        selectedId={filters.account_id ?? null}
        onSelect={handleSelectAccount}
        noneOption={{ label: 'Todas las cuentas' }}
        onSelectNone={handleSelectAllAccounts}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  filters: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    minHeight: 44,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
    maxWidth: 140,
  },
  accountLabel: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  listContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dayHeaderText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
