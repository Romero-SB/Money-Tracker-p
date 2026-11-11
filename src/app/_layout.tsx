import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME, initDatabase } from '@/db';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppTheme}>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ title: 'Cuentas' }} />
          <Stack.Screen name="account-form" options={{ title: 'Cuenta' }} />
          <Stack.Screen name="categories" options={{ title: 'Categorías' }} />
          <Stack.Screen name="category-form" options={{ title: 'Categoría' }} />
          <Stack.Screen name="movement-form" options={{ title: 'Movimiento' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
