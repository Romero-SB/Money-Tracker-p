import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';

import { SelectorModal } from '@/components/pickers/selector-modal';
import { Button } from '@/components/ui/button';
import { DateTimeField } from '@/components/ui/date-time-field';
import { FieldSelector } from '@/components/ui/field-selector';
import { AppTextInput } from '@/components/ui/text-input';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { AccountWithBalance } from '@/types/models';
import { parseAmount } from '@/utils/format';

export type ContributionFormInput = {
  amount: number;
  account_id: number;
  occurred_at: string;
};

type ContributionModalProps = {
  visible: boolean;
  goalName: string;
  accounts: AccountWithBalance[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: ContributionFormInput) => void;
};

export function ContributionModal({
  visible,
  goalName,
  accounts,
  saving,
  onClose,
  onSubmit,
}: ContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);

  const activeAccounts = accounts.filter((account) => account.is_active);
  const effectiveAccountId = accountId ?? activeAccounts[0]?.id ?? null;
  const selectedAccount = activeAccounts.find((account) => account.id === effectiveAccountId) ?? null;

  const handleSave = () => {
    const amountValue = parseAmount(amount);
    if (amountValue === null || amountValue <= 0) {
      Alert.alert('Datos incompletos', 'Ingresa un monto mayor a cero.');
      return;
    }
    if (effectiveAccountId === null) {
      Alert.alert('Datos incompletos', 'Selecciona una cuenta.');
      return;
    }
    onSubmit({
      amount: amountValue,
      account_id: effectiveAccountId,
      occurred_at: date.toISOString(),
    });
  };

  const handleClose = () => {
    setAmount('');
    setAccountId(null);
    setDate(new Date());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Aportar a {goalName}</Text>
          <AppTextInput
            label="Monto del aporte"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            hint="Se registrará como un gasto desde la cuenta seleccionada."
          />
          <FieldSelector
            label="Cuenta"
            placeholder="Selecciona una cuenta"
            option={
              selectedAccount
                ? {
                    id: selectedAccount.id,
                    icon: selectedAccount.icon,
                    color: selectedAccount.color,
                    title: selectedAccount.name,
                  }
                : null
            }
            onPress={() => setAccountPickerVisible(true)}
          />
          <DateTimeField value={date} onChange={setDate} />
          <Button label="Aportar" onPress={handleSave} loading={saving} />
          <Button label="Cancelar" variant="secondary" onPress={handleClose} />
        </View>
      </View>

      <SelectorModal
        visible={accountPickerVisible}
        onClose={() => setAccountPickerVisible(false)}
        title="Cuenta"
        options={activeAccounts.map((account) => ({
          id: account.id,
          icon: account.icon,
          color: account.color,
          title: account.name,
          subtitle: account.is_active ? undefined : 'Inactiva',
        }))}
        selectedId={effectiveAccountId}
        onSelect={setAccountId}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
});
