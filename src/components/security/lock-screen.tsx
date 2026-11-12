import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinKeypad } from '@/components/security/pin-keypad';
import { ThemedText } from '@/components/ui/themed-text';
import { APP_LOGO, APP_NAME } from '@/constants/brand';
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
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel={APP_NAME} />

          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="lock-closed" size={30} color="#FFFFFF" />
            </View>
            <ThemedText variant="title" style={styles.title}>
              App bloqueada
            </ThemedText>
            <ThemedText variant="small" color="muted" style={styles.subtitle}>
              Ingresa tu PIN de 4 dígitos para continuar
            </ThemedText>
          </View>

          <View style={styles.pinArea}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.expense} />
                <ThemedText variant="small" color="expense" style={styles.errorText}>
                  {error}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.errorPlaceholder} />
            )}

            <PinKeypad pin={pin} onPinChange={handleChange} hasError={error !== null} />
          </View>

          {biometricEnabled ? (
            <Pressable
              onPress={handleBiometric}
              style={({ pressed }) => [styles.biometric, pressed && styles.pressed]}
            >
              <Ionicons name="finger-print" size={28} color={Colors.primary} />
              <ThemedText variant="tiny" color="primary" style={styles.biometricLabel}>
                Usar biometría
              </ThemedText>
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
    overflow: 'hidden',
  },
  blobTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primaryLight,
    opacity: 0.7,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primaryLight,
    opacity: 0.5,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: Radius.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
  },
  pinArea: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.expense}14`,
  },
  errorText: {
    fontWeight: '500',
  },
  errorPlaceholder: {
    height: 30,
  },
  biometric: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  biometricLabel: {
    fontWeight: '600',
  },
  biometricPlaceholder: {
    height: 64,
  },
  pressed: {
    opacity: 0.7,
  },
});
