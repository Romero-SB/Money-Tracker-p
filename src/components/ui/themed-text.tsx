import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

type ThemedTextProps = {
  variant?: 'title' | 'subtitle' | 'body' | 'small' | 'tiny';
  color?: 'default' | 'muted' | 'faint' | 'primary' | 'income' | 'expense' | 'transfer' | 'savings';
} & Omit<TextProps, 'style'> & { style?: StyleProp<TextStyle> };

const variantStyles = StyleSheet.create({
  title: { fontSize: Typography.title, fontWeight: '800' as const, color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: Typography.subtitle, fontWeight: '700' as const, color: Colors.text, letterSpacing: -0.2 },
  body: { fontSize: Typography.body, color: Colors.text },
  small: { fontSize: Typography.small, color: Colors.text },
  tiny: { fontSize: Typography.tiny, color: Colors.text },
});

const colorStyles = StyleSheet.create({
  default: { color: Colors.text },
  muted: { color: Colors.textMuted },
  faint: { color: Colors.textFaint },
  primary: { color: Colors.primary },
  income: { color: Colors.income },
  expense: { color: Colors.expense },
  transfer: { color: Colors.transfer },
  savings: { color: Colors.savings },
});

export function ThemedText({
  children,
  variant = 'body',
  color = 'default',
  style,
  ...rest
}: ThemedTextProps) {
  return (
    <Text style={[variantStyles[variant], colorStyles[color], style]} {...rest}>
      {children}
    </Text>
  );
}
