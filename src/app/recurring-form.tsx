import { format } from 'date-fns';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, View } from 'react-native';

import { SelectorModal } from '@/components/pickers/selector-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateTimeField } from '@/components/ui/date-time-field';
import { FieldSelector } from '@/components/ui/field-selector';
import { OptionChips } from '@/components/ui/option-chips';
import { Screen } from '@/components/ui/screen';
import { AppTextInput, FormField } from '@/components/ui/text-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useRecurring } from '@/hooks/use-recurring';
import { getRecurring, setRecurringActive } from '@/services/recurring';
import type { RecurringFrequency, RecurringWithDetails } from '@/types/models';
import { parseAmount } from '@/utils/format';

const TYPE_OPTIONS: { value: 'income' | 'expense'; label: string; icon: 'add-circle' | 'remove-circle' }[] = [
  { value: 'income', label: 'Ingreso', icon: 'add-circle' },
  { value: 'expense', label: 'Gasto', icon: 'remove-circle' },
];

const FREQUENCY_OPTIONS: {
  value: RecurringFrequency;
  label: string;
  icon: 'sunny' | 'calendar' | 'sync' | 'today' | 'grid' | 'calendar-clear';
}[] = [
  { value: 'daily', label: 'Diario', icon: 'sunny' },
  { value: 'weekly', label: 'Semanal', icon: 'calendar' },
  { value: 'biweekly', label: 'Quincenal', icon: 'sync' },
  { value: 'monthly', label: 'Mensual', icon: 'today' },
  { value: 'quarterly', label: 'Trimestral', icon: 'grid' },
  { value: 'yearly', label: 'Anual', icon: 'calendar-clear' },
];

export default function RecurringFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const db = useSQLiteContext();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { create, update, remove } = useRecurring();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [recurring, setRecurring] = useState<RecurringWithDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    let cancelled = false;
    getRecurring(db, editingId).then((result) => {
      if (cancelled || !result) {
        return;
      }
      setRecurring(result);
      setType(result.type);
      setAmount(String(result.amount));
      setDescription(result.description);
      setFrequency(result.frequency);
      setStartDate(new Date(`${result.start_date}T12:00:00`));
      setAccountId(result.account_id);
      setCategoryId(result.category_id);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [editingId, db]);

  const accountOptions = useMemo(
    () =>
      (accounts ?? [])
        .filter((account) => account.is_active)
        .map((account) => ({
          id: account.id,
          icon: account.icon,
          color: account.color,
          title: account.name,
        })),
    [accounts]
  );

  const activeAccounts = useMemo(
    () => (accounts ?? []).filter((account) => account.is_active),
    [accounts]
  );
  const effectiveAccountId = accountId ?? activeAccounts[0]?.id ?? null;

  const categoryOptions = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => category.type === type)
        .map((category) => ({
          id: category.id,
          icon: category.icon,
          color: category.color,
          title: category.name,
        })),
    [categories, type]
  );

  const selectedAccount = accountOptions.find((option) => option.id === effectiveAccountId) ?? null;
  const selectedCategory = categoryOptions.find((option) => option.id === categoryId) ?? null;

  const validate = (): string | null => {
    const amountValue = parseAmount(amount);
    if (amountValue === null || amountValue <= 0) {
      return 'Ingresa un importe mayor a cero.';
    }
    if (effectiveAccountId === null) {
      return 'Selecciona una cuenta.';
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
      type,
      amount: parseAmount(amount)!,
      account_id: effectiveAccountId!,
      category_id: categoryId,
      description,
      frequency,
      start_date: format(startDate, 'yyyy-MM-dd'),
    };

    try {
      setSaving(true);
      if (editingId !== null) {
        await update(editingId, input);
      } else {
        await create(input);
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar la recurrente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (editingId === null || !recurring) {
      return;
    }
    try {
      await setRecurringActive(db, editingId, !recurring.is_active);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la recurrente.');
    }
  };

  const handleDelete = () => {
    if (editingId === null) {
      return;
    }
    Alert.alert('Eliminar recurrente', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(editingId);
            router.back();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la recurrente.');
          }
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <Screen>
        <Stack.Screen options={{ title: isEditing ? 'Editar recurrente' : 'Nueva recurrente' }} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEditing ? 'Editar recurrente' : 'Nueva recurrente' }} />

      <View style={styles.form}>
        <Card style={styles.card}>
          <FormField label="Tipo">
            <OptionChips options={TYPE_OPTIONS} value={type} onChange={setType} />
          </FormField>
          <AppTextInput
            label="Importe"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <AppTextInput
            label="Descripción"
            placeholder="Ej: Sueldo, Alquiler, Netflix"
            value={description}
            onChangeText={setDescription}
            maxLength={80}
          />
        </Card>

        <Card style={styles.card}>
          <FieldSelector
            label="Cuenta"
            placeholder="Selecciona una cuenta"
            option={selectedAccount}
            onPress={() => setAccountPickerVisible(true)}
          />
          <FieldSelector
            label="Categoría (opcional)"
            placeholder="Sin categoría"
            option={selectedCategory}
            onPress={() => setCategoryPickerVisible(true)}
          />
        </Card>

        <Card style={styles.card}>
          <FormField label="Frecuencia">
            <OptionChips options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />
          </FormField>
          <FormField label="Fecha de inicio">
            <DateTimeField value={startDate} onChange={setStartDate} />
          </FormField>
        </Card>

        {recurring ? (
          <Card style={styles.card}>
            <ThemedText variant="small" color="muted">
              Próxima ejecución
            </ThemedText>
            <ThemedText variant="subtitle">{format(new Date(`${recurring.next_run}T12:00:00`), "d MMM yyyy")}</ThemedText>
            <ThemedText variant="tiny" color="faint">
              Cuando llegue la fecha, Inicio te pedirá confirmar el registro de este movimiento.
            </ThemedText>
            <Button
              label={recurring.is_active ? 'Pausar' : 'Reactivar'}
              variant="secondary"
              onPress={handleToggleActive}
              style={styles.toggleButton}
            />
          </Card>
        ) : (
          <ThemedText variant="tiny" color="faint" style={styles.note}>
            Cuando llegue la fecha de ejecución, la pantalla de Inicio te pedirá confirmar el registro
            del movimiento.
          </ThemedText>
        )}

        <Button
          label={isEditing ? 'Guardar cambios' : 'Crear recurrente'}
          onPress={handleSave}
          loading={saving}
        />

        {isEditing ? (
          <Button label="Eliminar recurrente" variant="danger" onPress={handleDelete} />
        ) : null}
      </View>

      <SelectorModal
        visible={accountPickerVisible}
        onClose={() => setAccountPickerVisible(false)}
        title="Cuenta"
        options={accountOptions}
        selectedId={effectiveAccountId}
        onSelect={setAccountId}
      />
      <SelectorModal
        visible={categoryPickerVisible}
        onClose={() => setCategoryPickerVisible(false)}
        title="Categoría"
        options={categoryOptions}
        selectedId={categoryId}
        onSelect={setCategoryId}
        noneOption={{ label: 'Sin categoría' }}
        onSelectNone={() => setCategoryId(null)}
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
  toggleButton: {
    marginTop: Spacing.sm,
  },
  note: {
    textAlign: 'center',
  },
});
