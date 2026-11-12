import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

type PinKeypadProps = {
  pin: string;
  onPinChange: (next: string) => void;
  hasError?: boolean;
};

export function PinKeypad({ pin, onPinChange, hasError = false }: PinKeypadProps) {
  const handleDigit = (digit: string) => {
    if (pin.length >= 4) {
      return;
    }
    onPinChange(pin + digit);
  };

  const handleBackspace = () => {
    onPinChange(pin.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < pin.length && styles.dotFilled,
              hasError && styles.dotError,
            ]}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {DIGITS.map((digit) => (
          <Pressable
            key={digit}
            onPress={() => handleDigit(digit)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyText}>{digit}</Text>
          </Pressable>
        ))}
        <View style={styles.key} />
        <Pressable
          onPress={() => handleDigit('0')}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        >
          <Text style={styles.keyText}>0</Text>
        </Pressable>
        <Pressable
          onPress={handleBackspace}
          disabled={pin.length === 0}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        >
          <Ionicons name="backspace-outline" size={26} color={Colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.lg,
    minHeight: 18,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotError: {
    backgroundColor: Colors.expense,
    borderColor: Colors.expense,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    width: 264,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  keyPressed: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  keyText: {
    fontSize: Typography.subtitle + 6,
    fontWeight: '500',
    color: Colors.text,
  },
});
