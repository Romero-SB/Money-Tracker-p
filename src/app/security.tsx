import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { PinPadModal, type PinPadModalMode } from '@/components/security/pin-pad-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import {
  authenticateWithBiometrics,
  canUseBiometrics,
  clearPin,
  hasPin,
  isBiometricUnlockEnabled,
  savePin,
  setBiometricUnlockEnabled,
  verifyPin,
} from '@/services/security';

type SecurityState = {
  pinSet: boolean;
  biometricsAvailable: boolean;
  biometricEnabled: boolean;
} | null;

export default function SecurityScreen() {
  const db = useSQLiteContext();
  const [state, setState] = useState<SecurityState>(null);
  const [modal, setModal] = useState<PinPadModalMode | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [pinSet, biometricsAvailable, biometricEnabled] = await Promise.all([
          hasPin(),
          canUseBiometrics(),
          isBiometricUnlockEnabled(db),
        ]);
        if (!cancelled) {
          setState({
            pinSet,
            biometricsAvailable,
            biometricEnabled: biometricEnabled && biometricsAvailable,
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  const handleSavePin = async (pin: string) => {
    await savePin(pin);
    setState((current) =>
      current ? { ...current, pinSet: true, biometricEnabled: false } : current
    );
    Alert.alert(
      modal === 'change' ? 'PIN actualizado' : 'PIN creado',
      modal === 'change'
        ? 'Tu nuevo PIN quedó guardado.'
        : 'Ahora la app pedirá tu PIN al abrirla o al volver de segundo plano.'
    );
  };

  const handleDisablePin = async (pin: string): Promise<boolean> => {
    const ok = await verifyPin(pin);
    if (!ok) {
      return false;
    }
    await clearPin(db);
    setState((current) =>
      current ? { ...current, pinSet: false, biometricEnabled: false } : current
    );
    Alert.alert('PIN desactivado', 'La app ya no pedirá PIN ni biometría al abrirla.');
    return true;
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!state || !state.pinSet) {
      return;
    }
    if (enabled) {
      const success = await authenticateWithBiometrics();
      if (!success) {
        Alert.alert('Biometría', 'No se pudo autenticar. Inténtalo de nuevo.');
        return;
      }
    }
    await setBiometricUnlockEnabled(db, enabled);
    setState({ ...state, biometricEnabled: enabled });
  };

  if (!state) {
    return (
      <Screen>
        <View style={styles.center} />
      </Screen>
    );
  }

  const biometricDisabled = !state.pinSet || !state.biometricsAvailable;

  return (
    <Screen scroll>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <IconBadge icon="lock-closed" color={Colors.primary} />
          <View style={styles.cardHeaderText}>
            <ThemedText variant="body" style={styles.cardTitle}>
              PIN de acceso
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              {state.pinSet
                ? 'Tu app está protegida con un PIN de 4 dígitos.'
                : 'Protege tu información con un PIN de 4 dígitos.'}
            </ThemedText>
          </View>
        </View>
        {state.pinSet ? (
          <View style={styles.buttonRow}>
            <Button label="Cambiar PIN" onPress={() => setModal('change')} style={styles.button} />
            <Button
              label="Desactivar"
              variant="danger"
              onPress={() => setModal('verify')}
              style={styles.button}
            />
          </View>
        ) : (
          <Button label="Crear PIN" onPress={() => setModal('create')} />
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <IconBadge icon="finger-print" color={Colors.info} />
          <View style={styles.cardHeaderText}>
            <ThemedText variant="body" style={styles.cardTitle}>
              Desbloqueo biométrico
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              {!state.pinSet
                ? 'Primero crea un PIN para usar biometría.'
                : state.biometricsAvailable
                  ? 'Usa tu huella o rostro para desbloquear la app.'
                  : 'No disponible en este dispositivo.'}
            </ThemedText>
          </View>
          <Switch
            value={state.biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={biometricDisabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={state.biometricEnabled ? '#FFFFFF' : Colors.textFaint}
          />
        </View>
      </Card>

      <ThemedText variant="tiny" color="faint" style={styles.note}>
        La app se bloquea al pasar a segundo plano y se desbloquea con tu PIN o biometría.
      </ThemedText>

      {modal ? (
        <PinPadModal
          visible
          mode={modal}
          title={modal === 'create' ? 'Crear PIN' : modal === 'change' ? 'Cambiar PIN' : 'Desactivar PIN'}
          onClose={() => setModal(null)}
          verifyCurrent={modal === 'verify' ? handleDisablePin : verifyPin}
          onNewPin={handleSavePin}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
  center: {
    flex: 1,
  },
  note: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
