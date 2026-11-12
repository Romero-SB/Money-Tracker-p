import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { APP_LOGO, APP_NAME } from '@/constants/brand';
import { Colors, Radius, Spacing } from '@/constants/theme';

const TRACK_WIDTH = 180;
const BAR_WIDTH = 72;

export function LoadingScreen() {
  const [progress] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    Animated.timing(fade, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [fade, progress]);

  const barStyle = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-BAR_WIDTH, TRACK_WIDTH],
        }),
      },
    ],
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel={APP_NAME} />
        <Text style={styles.name}>{APP_NAME}</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <Text style={styles.caption}>Preparando tus finanzas…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
  },
  name: {
    marginTop: Spacing.lg,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Colors.text,
  },
  track: {
    marginTop: Spacing.xl,
    width: TRACK_WIDTH,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  caption: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.textFaint,
  },
});
