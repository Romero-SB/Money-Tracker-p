import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { PinKeypad } from '@/components/security/pin-keypad';
import { Button } from '@/components/ui/button';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export type PinPadModalMode = 'create' | 'change' | 'verify';

type PinPadModalProps = {
  visible: boolean;
  mode: PinPadModalMode;
  title: string;
  onClose: () => void;
  verifyCurrent?: (pin: string) => Promise<boolean>;
  onNewPin: (pin: string) => void | Promise<void>;
};

type Stage = 'current' | 'new' | 'confirm';

const INITIAL_STAGE: Record<PinPadModalMode, Stage> = {
  create: 'new',
  change: 'current',
  verify: 'current',
};

export function PinPadModal({
  visible,
  mode,
  title,
  onClose,
  verifyCurrent,
  onNewPin,
}: PinPadModalProps) {
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [stage, setStage] = useState<Stage>(INITIAL_STAGE[mode]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPin('');
    setFirstPin('');
    setStage(INITIAL_STAGE[mode]);
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const subtitleFor = (current: Stage): string => {
    if (current === 'current') {
      return mode === 'verify' ? 'Ingresa tu PIN actual' : 'Ingresa tu PIN actual para continuar';
    }
    if (current === 'new') {
      return 'Ingresa tu nuevo PIN de 4 dígitos';
    }
    return 'Repite el PIN para confirmar';
  };

  const handleChange = (next: string) => {
    if (busy) {
      return;
    }
    setError(null);
    if (next.length < 4) {
      setPin(next);
      return;
    }
    if (stage === 'current') {
      setBusy(true);
      verifyCurrent?.(next)
        .then((ok) => {
          if (ok) {
            if (mode === 'verify') {
              close();
              return;
            }
            setPin('');
            setStage('new');
          } else {
            setPin('');
            setError('PIN incorrecto. Inténtalo de nuevo.');
          }
        })
        .catch(() => {
          setPin('');
          setError('No se pudo verificar el PIN.');
        })
        .finally(() => {
          setBusy(false);
        });
      return;
    }
    if (stage === 'new') {
      setFirstPin(next);
      setPin('');
      setStage('confirm');
      return;
    }
    if (next === firstPin) {
      const newPin = next;
      reset();
      void Promise.resolve(onNewPin(newPin)).then(() => {
        onClose();
      });
      return;
    }
    setPin('');
    setFirstPin('');
    setStage('new');
    setError('Los PIN no coinciden. Vuelve a intentarlo.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitleFor(stage)}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.pad}>
            <PinKeypad pin={pin} onPinChange={handleChange} hasError={error !== null} />
          </View>
          <Button label="Cancelar" variant="secondary" onPress={close} />
        </View>
      </View>
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
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.subtitle,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.small,
    color: Colors.textMuted,
  },
  error: {
    fontSize: Typography.small,
    color: Colors.expense,
    fontWeight: '500',
  },
  pad: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
