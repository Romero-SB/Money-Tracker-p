import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinKeypad } from '@/components/security/pin-keypad';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { authenticateWithBiometrics, verifyPin } from '@/services/security';

type LockScreenProps = {
  biometricEnabled: boolean;
  onUnlock: () => void;
};

export function LockScreen({ biometricEnabled, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleBiometric = useCallback(() => {
    authenticateWithBiometrics()
      .then((success) => {
        if (success) {
          onUnlock();
          return;
        }
        setError('No se pudo autenticar. Ingresa tu PIN.');
      })
      .catch(() => {
        setError('No se pudo autenticar. Ingresa tu PIN.');
      });
  }, [onUnlock]);

  useEffect(() => {
    if (!biometricEnabled) {
      return;
    }
    handleBiometric();
  }, [biometricEnabled, handleBiometric]);

  const handleChange = (next: string) => {
    setError(null);
    if (next.length < 4) {
      setPin(next);
      return;
    }
    const entered = next;
    setPin('');
    verifyPin(entered)
      .then((ok) => {
        if (ok) {
          onUnlock();
          return;
        }
        setError('PIN incorrecto. Inténtalo de nuevo.');
      })
      .catch(() => {
        setError('No se pudo verificar el PIN.');
      });
  };

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="lock-closed" size={32} color={Colors.primary} />
            </View>
            <ThemedText variant="subtitle" style={styles.title}>
              App bloqueada
            </ThemedText>
            <ThemedText variant="small" color="muted" style={styles.subtitle}>
              Ingresa tu PIN de 4 dígitos para continuar
            </ThemedText>
          </View>

          {error ? (
            <ThemedText variant="small" color="expense" style={styles.error}>
              {error}
            </ThemedText>
          ) : (
            <View style={styles.errorPlaceholder} />
          )}

          <PinKeypad pin={pin} onPinChange={handleChange} hasError={error !== null} />

          {biometricEnabled ? (
            <Pressable onPress={handleBiometric} style={({ pressed }) => [styles.biometric, pressed && styles.pressed]}>
              <Ionicons name="finger-print" size={30} color={Colors.primary} />
            </Pressable>
          ) : (
            <View style={styles.biometricPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 100,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
  },
  error: {
    minHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorPlaceholder: {
    minHeight: 18,
  },
  biometric: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  biometricPlaceholder: {
    minHeight: 60,
  },
  pressed: {
    opacity: 0.7,
  },
});
