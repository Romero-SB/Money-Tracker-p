import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ColorPicker } from '@/components/pickers/color-picker';
import { IconPicker } from '@/components/pickers/icon-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptionChips } from '@/components/ui/option-chips';
import { Screen } from '@/components/ui/screen';
import { AppTextInput, FormField } from '@/components/ui/text-input';
import { ThemedText } from '@/components/ui/themed-text';
import { ACCOUNT_ICONS, ACCOUNT_TYPES, type IconName } from '@/constants/options';
import { Spacing } from '@/constants/theme';
import { useRepositories } from '@/hooks/use-repositories';
import { useAccounts } from '@/hooks/use-accounts';
import type { AccountType } from '@/types/models';
import { formatMoney, parseAmount } from '@/utils/format';

export default function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const { accounts: accountsRepo } = useRepositories();
  const { create, update, setActive } = useAccounts();
  const [account, setAccount] = useState<{
    id: number;
    is_active: 0 | 1;
    currency: string;
    balance: number;
  } | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [initialBalance, setInitialBalance] = useState('');
  const [icon, setIcon] = useState<IconName>('wallet');
  const [color, setColor] = useState('#0D9488');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId === null) {
      return;
    }
    let cancelled = false;
    accountsRepo.getById(editingId).then((result) => {
      if (cancelled || !result) {
        return;
      }
      setAccount({
        id: result.id,
        is_active: result.is_active,
        currency: result.currency,
        balance: result.balance,
      });
      setName(result.name);
      setType(result.type);
      setInitialBalance(String(result.initial_balance));
      setIcon(result.icon as IconName);
      setColor(result.color);
    });
    return () => {
      cancelled = true;
    };
  }, [editingId, accountsRepo]);

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Escribe un nombre para la cuenta.';
    }
    const balance = parseAmount(initialBalance);
    if (balance === null) {
      return 'El saldo inicial debe ser un número válido.';
    }
    if (balance < 0) {
      return 'El saldo inicial no puede ser negativo.';
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
      name,
      type,
      initial_balance: parseAmount(initialBalance) ?? 0,
      icon,
      color,
    };

    try {
      setSaving(true);
      if (editingId !== null) {
        await update(editingId, input);
      } else {
        await create(input);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!account) {
      return;
    }
    try {
      await setActive(account.id, !account.is_active);
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la cuenta.');
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEditing ? 'Editar cuenta' : 'Nueva cuenta' }} />

      <View style={styles.form}>
        <Card style={styles.card}>
          <AppTextInput
            label="Nombre"
            placeholder="Ej: Efectivo, BCP, Yape"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={50}
          />
          <FormField label="Tipo">
            <OptionChips options={ACCOUNT_TYPES} value={type} onChange={setType} />
          </FormField>
          <AppTextInput
            label="Saldo inicial"
            placeholder="0.00"
            value={initialBalance}
            onChangeText={setInitialBalance}
            keyboardType="decimal-pad"
            hint="Se usa junto con tus movimientos para calcular el saldo actual."
          />
        </Card>

        <Card style={styles.card}>
          <FormField label="Icono">
            <IconPicker value={icon} onChange={setIcon} icons={ACCOUNT_ICONS} accentColor={color} />
          </FormField>
          <FormField label="Color">
            <ColorPicker value={color} onChange={setColor} />
          </FormField>
        </Card>

        {account ? (
          <Card style={styles.card}>
            <ThemedText variant="small" color="muted">
              Saldo actual
            </ThemedText>
            <ThemedText variant="subtitle" color={account.balance >= 0 ? 'income' : 'expense'}>
              {formatMoney(account.balance, account.currency)}
            </ThemedText>
            <Button
              label={account.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
              variant={account.is_active ? 'secondary' : 'primary'}
              onPress={handleToggleActive}
              style={styles.toggleButton}
            />
            <ThemedText variant="tiny" color="faint" style={styles.note}>
              Una cuenta inactiva se oculta del flujo principal pero conserva su historial.
            </ThemedText>
          </Card>
        ) : null}

        <Button label={isEditing ? 'Guardar cambios' : 'Crear cuenta'} onPress={handleSave} loading={saving} />
      </View>
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
    marginTop: Spacing.md,
  },
  note: {
    marginTop: Spacing.sm,
  },
});
