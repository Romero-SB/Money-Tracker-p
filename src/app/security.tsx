import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { PinPadModal, type PinPadModalMode } from '@/components/security/pin-pad-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { StatusPill } from '@/components/ui/status-pill';
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
  const protectedApp = state.pinSet;

  return (
    <Screen scroll>
      <Card style={styles.hero}>
        <IconBadge
          icon={protectedApp ? 'shield-checkmark' : 'shield-outline'}
          color={protectedApp ? Colors.success : Colors.textMuted}
          size={56}
        />
        <View style={styles.heroText}>
          <ThemedText variant="subtitle" style={styles.heroTitle}>
            {protectedApp ? 'Tu información está protegida' : 'Tu app no tiene protección'}
          </ThemedText>
          <StatusPill
            label={protectedApp ? 'PIN activo' : 'Sin PIN'}
            color={protectedApp ? Colors.success : Colors.textMuted}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <IconBadge icon="keypad" color={Colors.primary} />
          <View style={styles.cardHeaderText}>
            <ThemedText variant="body" style={styles.cardTitle}>
              PIN de acceso
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              {state.pinSet
                ? 'Se pide al abrir la app y al volver de segundo plano.'
                : 'Un código de 4 dígitos para proteger la app.'}
            </ThemedText>
          </View>
        </View>
        {state.pinSet ? (
          <View style={styles.buttonRow}>
            <Button
              label="Cambiar PIN"
              variant="secondary"
              onPress={() => setModal('change')}
              style={styles.button}
            />
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
                  ? 'Usa tu huella o rostro para desbloquear.'
                  : 'No disponible en este dispositivo.'}
            </ThemedText>
          </View>
          <Switch
            value={state.biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={biometricDisabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <ThemedText variant="tiny" color="faint" style={styles.note}>
        Si desactivas el PIN, la biometría también se desactiva.
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroText: {
    flex: 1,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontWeight: '600',
  },
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
