import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, View } from 'react-native';

import { SelectorModal } from '@/components/pickers/selector-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldSelector } from '@/components/ui/field-selector';
import { OptionChips } from '@/components/ui/option-chips';
import { Screen } from '@/components/ui/screen';
import { AppTextInput, FormField } from '@/components/ui/text-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useBudgets } from '@/hooks/use-budgets';
import { getBudget } from '@/services/budgets';
import { ensureNotificationPermission } from '@/services/notifications';
import type { BudgetPeriod, BudgetWithProgress } from '@/types/models';
import { formatMoney, parseAmount } from '@/utils/format';

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string; icon: 'calendar' | 'calendar-clear' }[] = [
  { value: 'monthly', label: 'Mensual', icon: 'calendar' },
  { value: 'yearly', label: 'Anual', icon: 'calendar-clear' },
];

export default function BudgetFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const db = useSQLiteContext();
  const { categories } = useCategories();
  const { create, update, remove } = useBudgets();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [budget, setBudget] = useState<BudgetWithProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    let cancelled = false;
    getBudget(db, editingId).then((result) => {
      if (cancelled || !result) {
        return;
      }
      setBudget(result);
      setCategoryId(result.category_id);
      setAmount(String(result.amount));
      setPeriod(result.period);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [editingId, db]);

  const categoryOptions = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => category.type === 'expense')
        .map((category) => ({
          id: category.id,
          icon: category.icon,
          color: category.color,
          title: category.name,
        })),
    [categories]
  );

  const selectedCategory = categoryOptions.find((option) => option.id === categoryId) ?? null;

  const validate = (): string | null => {
    if (categoryId === null) {
      return 'Selecciona una categoría de gasto.';
    }
    const amountValue = parseAmount(amount);
    if (amountValue === null || amountValue <= 0) {
      return 'Ingresa un monto mayor a cero.';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Datos incompletos', validationError);
      return;
    }

    const input = {
      category_id: categoryId!,
      amount: parseAmount(amount)!,
      period,
    };

    try {
      setSaving(true);
      if (editingId !== null) {
        await update(editingId, input);
      } else {
        await create(input);
        ensureNotificationPermission().catch(() => {});
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el presupuesto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (editingId === null) {
      return;
    }
    Alert.alert('Eliminar presupuesto', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(editingId);
            router.back();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el presupuesto.');
          }
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <Screen>
        <Stack.Screen options={{ title: isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto' }} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto' }} />

      <View style={styles.form}>
        <Card style={styles.card}>
          <FieldSelector
            label="Categoría de gasto"
            placeholder="Selecciona una categoría"
            option={selectedCategory}
            onPress={() => setCategoryPickerVisible(true)}
          />
          <AppTextInput
            label="Monto del presupuesto"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <FormField label="Período">
            <OptionChips options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          </FormField>
        </Card>

        {budget ? (
          <Card style={styles.card}>
            <ThemedText variant="small" color="muted">
              Gastado en {budget.period === 'monthly' ? 'este mes' : 'este año'}
            </ThemedText>
            <ThemedText variant="subtitle" color={budget.remaining >= 0 ? 'default' : 'expense'}>
              {formatMoney(budget.spent)} de {formatMoney(budget.amount)}
            </ThemedText>
          </Card>
        ) : (
          <ThemedText variant="tiny" color="faint" style={styles.note}>
            Recibirás una notificación cuando uses el 80% del presupuesto y cuando lo superes.
          </ThemedText>
        )}

        <Button
          label={isEditing ? 'Guardar cambios' : 'Crear presupuesto'}
          onPress={handleSave}
          loading={saving}
        />

        {isEditing ? (
          <Button label="Eliminar presupuesto" variant="danger" onPress={handleDelete} />
        ) : null}
      </View>

      <SelectorModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        title="Categoría"
        options={categoryOptions}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.lg,
  },
  note: {
    textAlign: 'center',
  },
});
