import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AppState, StyleSheet, useColorScheme, View } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

import { LockScreen } from '@/components/security/lock-screen';
import { DATABASE_NAME, initDatabase } from '@/db';
import { Colors } from '@/constants/theme';
import { canUseBiometrics, hasPin, isAuthenticating, isBiometricUnlockEnabled } from '@/services/security';

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

type GateStatus = 'checking' | 'locked' | 'open';

function AppGate({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [status, setStatus] = useState<GateStatus>('checking');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const lock = useCallback(async () => {
    if (!(await hasPin())) {
      setStatus('open');
      return;
    }
    const enabled =
      (await isBiometricUnlockEnabled(db)) && (await canUseBiometrics());
    setBiometricEnabled(enabled);
    setStatus('locked');
  }, [db]);

  useEffect(() => {
    hasPin()
      .then((pinSet) => {
        if (!pinSet) {
          setStatus('open');
          return;
        }
        return Promise.all([isBiometricUnlockEnabled(db), canUseBiometrics()]).then(
          ([enabled, available]) => {
            setBiometricEnabled(enabled && available);
            setStatus('locked');
          }
        );
      })
      .catch(() => {
        setStatus('open');
      });

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && !isAuthenticating()) {
        lock();
      }
    });
    return () => subscription.remove();
  }, [db, lock]);

  const handleUnlock = useCallback(() => {
    setStatus('open');
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {status === 'checking' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />
      ) : null}
      {status === 'locked' ? (
        <LockScreen biometricEnabled={biometricEnabled} onUnlock={handleUnlock} />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppTheme}>
      <StatusBar style="dark" />
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <AppGate>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: Colors.background },
              headerTitleStyle: { fontWeight: '700', color: Colors.text },
              headerTintColor: Colors.primary,
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="accounts" options={{ title: 'Cuentas' }} />
            <Stack.Screen name="account-form" options={{ title: 'Cuenta' }} />
            <Stack.Screen name="categories" options={{ title: 'Categorías' }} />
            <Stack.Screen name="category-form" options={{ title: 'Categoría' }} />
            <Stack.Screen name="movement-form" options={{ title: 'Movimiento' }} />
            <Stack.Screen name="budgets" options={{ title: 'Presupuestos' }} />
            <Stack.Screen name="budget-form" options={{ title: 'Presupuesto' }} />
            <Stack.Screen name="goal-form" options={{ title: 'Meta de ahorro' }} />
            <Stack.Screen name="recurring" options={{ title: 'Recurrentes' }} />
            <Stack.Screen name="recurring-form" options={{ title: 'Recurrente' }} />
            <Stack.Screen name="security" options={{ title: 'Seguridad' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notificaciones' }} />
            <Stack.Screen name="export" options={{ title: 'Exportar datos' }} />
            <Stack.Screen name="backup" options={{ title: 'Copias de seguridad' }} />
          </Stack>
        </AppGate>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
