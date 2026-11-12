import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ListRow } from '@/components/ui/list-row';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import type { MovementType } from '@/types/models';

const OPTIONS: { type: MovementType; label: string; description: string; icon: string; color: string }[] = [
  { type: 'income', label: 'Ingreso', description: 'Dinero que recibes', icon: 'add-circle', color: Colors.income },
  { type: 'expense', label: 'Gasto', description: 'Dinero que sale', icon: 'remove-circle', color: Colors.expense },
  { type: 'transfer', label: 'Transferencia', description: 'Entre tus cuentas', icon: 'swap-horizontal', color: Colors.transfer },
];

export function QuickAddMenu() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const handleSelect = (type: MovementType) => {
    setVisible(false);
    router.push({ pathname: '/movement-form', params: { type } });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setVisible(true)} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <ThemedText variant="subtitle" style={styles.sheetTitle}>
              Registrar movimiento
            </ThemedText>
            {OPTIONS.map((option) => (
              <ListRow
                key={option.type}
                icon={option.icon}
                color={option.color}
                title={option.label}
                subtitle={option.description}
                onPress={() => handleSelect(option.type)}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.floating,
  },
  pressed: {
    opacity: 0.85,
  },
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
    gap: Spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    marginBottom: Spacing.sm,
  },
});
