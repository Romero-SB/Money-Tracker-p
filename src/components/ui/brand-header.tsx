import { Image, StyleSheet, Text, View } from 'react-native';

import { APP_LOGO, APP_NAME } from '@/constants/brand';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function BrandHeader() {
  return (
    <View style={styles.container}>
      <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel={APP_NAME} />
      <Text style={styles.name}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
});
