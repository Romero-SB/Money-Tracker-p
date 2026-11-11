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
import { Colors, Spacing } from '@/constants/theme';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { createMovement, deleteMovement, getMovementWithDetails, updateMovement } from '@/services/movements';
import type { MovementType } from '@/types/models';
import { parseAmount } from '@/utils/format';

const TYPE_OPTIONS: { value: MovementType; label: string; icon: 'add-circle' | 'remove-circle' | 'swap-horizontal' }[] = [
  { value: 'income', label: 'Ingreso', icon: 'add-circle' },
  { value: 'expense', label: 'Gasto', icon: 'remove-circle' },
  { value: 'transfer', label: 'Transfer.', icon: 'swap-horizontal' },
];

export default function MovementFormScreen() {
  const { id, type } = useLocalSearchParams<{ id?: string; type?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const db = useSQLiteContext();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [movementType, setMovementType] = useState<MovementType>(
    type === 'income' || type === 'expense' || type === 'transfer' ? type : 'expense'
  );
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [destinationAccountId, setDestinationAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [destinationPickerVisible, setDestinationPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    let cancelled = false;
    getMovementWithDetails(db, editingId).then((result) => {
      if (cancelled || !result) {
        return;
      }
      setMovementType(result.type);
      setAmount(String(result.amount));
      setAccountId(result.account_id);
      setDestinationAccountId(result.destination_account_id);
      setCategoryId(result.category_id);
      setDescription(result.description);
      setNotes(result.notes ?? '');
      setDate(new Date(result.occurred_at));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [editingId, db]);

  const accountOptions = useMemo(() => {
    const source = accounts ?? [];
    const list = isEditing ? source : source.filter((account) => account.is_active);
    return list.map((account) => ({
      id: account.id,
      icon: account.icon,
      color: account.color,
      title: account.name,
      subtitle: account.is_active ? undefined : 'Inactiva',
    }));
  }, [accounts, isEditing]);

  const activeAccounts = useMemo(
    () => (accounts ?? []).filter((account) => account.is_active),
    [accounts]
  );

  const effectiveAccountId = accountId ?? activeAccounts[0]?.id ?? null;

  const categoryOptions = useMemo(() => {
    if (movementType === 'transfer') {
      return [];
    }
    return (categories ?? [])
      .filter((category) => category.type === movementType)
      .map((category) => ({
        id: category.id,
        icon: category.icon,
        color: category.color,
        title: category.name,
      }));
  }, [categories, movementType]);

  const selectedAccount =
    accountOptions.find((option) => option.id === effectiveAccountId) ?? null;
  const selectedDestination =
    accountOptions.find((option) => option.id === destinationAccountId) ?? null;
  const selectedCategory =
    categoryOptions.find((option) => option.id === categoryId) ?? null;

  const handleTypeChange = (next: MovementType) => {
    if (isEditing) {
      return;
    }
    setMovementType(next);
    if (next === 'transfer') {
      setCategoryId(null);
    } else {
      setDestinationAccountId(null);
    }
  };

  const validate = (): string | null => {
    const amountValue = parseAmount(amount);
    if (amountValue === null || amountValue <= 0) {
      return 'Ingresa un importe mayor a cero.';
    }
    if (effectiveAccountId === null) {
      return 'Selecciona una cuenta.';
    }
    if (movementType === 'transfer') {
      if (destinationAccountId === null) {
        return 'Selecciona la cuenta de destino.';
      }
      if (destinationAccountId === effectiveAccountId) {
        return 'El origen y el destino deben ser cuentas distintas.';
      }
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
      type: movementType,
      amount: parseAmount(amount)!,
      account_id: effectiveAccountId!,
      destination_account_id: movementType === 'transfer' ? destinationAccountId : null,
      category_id: movementType === 'transfer' ? null : categoryId,
      description,
      notes: notes.trim() ? notes : null,
      occurred_at: date.toISOString(),
    };

    try {
      setSaving(true);
      if (editingId !== null) {
        await updateMovement(db, editingId, input);
      } else {
        await createMovement(db, input);
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (editingId === null) {
      return;
    }
    Alert.alert('Eliminar movimiento', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMovement(db, editingId);
            router.back();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el movimiento.');
          }
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <Screen>
        <Stack.Screen options={{ title: isEditing ? 'Editar movimiento' : 'Nuevo movimiento' }} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEditing ? 'Editar movimiento' : 'Nuevo movimiento' }} />

      <View style={styles.form}>
        <Card style={styles.card}>
          <FormField label="Tipo">
            <OptionChips
              options={TYPE_OPTIONS}
              value={movementType}
              onChange={handleTypeChange}
              disabled={isEditing}
            />
            {isEditing ? (
              <ThemedText variant="tiny" color="faint">
                El tipo no se puede cambiar en un movimiento existente.
              </ThemedText>
            ) : null}
          </FormField>
          <AppTextInput
            label="Importe"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
        </Card>

        <Card style={styles.card}>
          <FieldSelector
            label={movementType === 'transfer' ? 'Cuenta de origen' : 'Cuenta'}
            placeholder="Selecciona una cuenta"
            option={selectedAccount}
            onPress={() => setAccountPickerVisible(true)}
          />
          {movementType === 'transfer' ? (
            <FieldSelector
              label="Cuenta de destino"
              placeholder="Selecciona el destino"
              option={selectedDestination}
              onPress={() => setDestinationPickerVisible(true)}
            />
          ) : (
            <FieldSelector
              label="Categoría (opcional)"
              placeholder="Sin categoría"
              option={selectedCategory}
              onPress={() => setCategoryPickerVisible(true)}
            />
          )}
        </Card>

        <Card style={styles.card}>
          <AppTextInput
            label="Descripción (opcional)"
            placeholder="Ej: Almuerzo, Sueldo noviembre"
            value={description}
            onChangeText={setDescription}
            maxLength={100}
          />
          <FormField label="Fecha y hora">
            <DateTimeField value={date} onChange={setDate} />
          </FormField>
          <AppTextInput
            label="Notas (opcional)"
            placeholder="Detalles adicionales"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </Card>

        <Button
          label={isEditing ? 'Guardar cambios' : 'Registrar movimiento'}
          onPress={handleSave}
          loading={saving}
        />

        {isEditing ? (
          <Button label="Eliminar movimiento" variant="danger" onPress={handleDelete} />
        ) : null}
      </View>

      <SelectorModal
        visible={accountPickerVisible}
        onClose={() => setAccountPickerVisible(false)}
        title="Cuenta de origen"
        options={accountOptions}
        selectedId={effectiveAccountId}
        onSelect={setAccountId}
      />
      {movementType === 'transfer' ? (
        <SelectorModal
          visible={destinationPickerVisible}
          onClose={() => setDestinationPickerVisible(false)}
          title="Cuenta de destino"
          options={accountOptions.filter((option) => option.id !== effectiveAccountId)}
          selectedId={destinationAccountId}
          onSelect={setDestinationAccountId}
        />
      ) : (
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
      )}
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
  amountInput: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
