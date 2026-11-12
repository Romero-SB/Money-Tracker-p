import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';

import { settingsRepository } from '@/db/repositories/settings';

const PIN_KEY = 'app.pin';
const BIOMETRIC_KEY = 'biometric_unlock';

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_KEY)) !== null;
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored !== null && stored === pin;
}

export async function clearPin(db: SQLiteDatabase): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await settingsRepository(db).remove(BIOMETRIC_KEY);
}

export async function isBiometricUnlockEnabled(db: SQLiteDatabase): Promise<boolean> {
  return (await settingsRepository(db).get(BIOMETRIC_KEY)) === 'true';
}

export async function setBiometricUnlockEnabled(db: SQLiteDatabase, enabled: boolean): Promise<void> {
  await settingsRepository(db).set(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}

export async function canUseBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return false;
  }
  return LocalAuthentication.isEnrolledAsync();
}

let authenticating = false;

export function isAuthenticating(): boolean {
  return authenticating;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  authenticating = true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquea Money Tracker',
      cancelLabel: 'Cancelar',
    });
    return result.success;
  } finally {
    authenticating = false;
  }
}
