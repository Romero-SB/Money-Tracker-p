import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANT_STYLES = {
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.inputBackground },
  danger: { backgroundColor: Colors.expense },
  ghost: { backgroundColor: 'transparent' },
};

const VARIANT_TEXT_STYLES = {
  primary: { color: '#FFFFFF' },
  secondary: { color: Colors.primary },
  danger: { color: '#FFFFFF' },
  ghost: { color: Colors.primary },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLES[variant],
        (variant === 'ghost' || variant === 'secondary') && styles.outline,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_TEXT_STYLES[variant].color} />
      ) : (
        <Text style={[styles.text, VARIANT_TEXT_STYLES[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    minHeight: 48,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: Typography.body,
    fontWeight: '600',
  },
});
