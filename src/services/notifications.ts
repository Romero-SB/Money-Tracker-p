import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { settingsRepository } from '@/db/repositories/settings';
import { todayISO } from '@/utils/dates';

const CHANNEL_ID = 'budgets';

export const BUDGET_ALERTS_SETTING = 'budget_alerts_enabled';
export const RECURRING_REMINDERS_SETTING = 'recurring_reminders_enabled';
const RECURRING_LAST_REMINDER_KEY = 'recurring_last_reminder_date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas de presupuesto',
      importance: AndroidImportance.HIGH,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return true;
  }
  if (!settings.canAskAgain) {
    return false;
  }
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

export async function sendLocalNotification(title: string, body: string): Promise<void> {
  const trigger =
    Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          channelId: CHANNEL_ID,
        }
      : null;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger,
  });
}

export async function isNotificationToggleEnabled(db: SQLiteDatabase, key: string): Promise<boolean> {
  return (await settingsRepository(db).get(key)) !== 'false';
}

export async function sendDueRecurringReminder(db: SQLiteDatabase, dueCount: number): Promise<void> {
  if (dueCount <= 0) {
    return;
  }
  const settings = settingsRepository(db);
  if ((await settings.get(RECURRING_REMINDERS_SETTING)) === 'false') {
    return;
  }
  const today = todayISO();
  if ((await settings.get(RECURRING_LAST_REMINDER_KEY)) === today) {
    return;
  }
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }
  await sendLocalNotification(
    'Movimientos recurrentes',
    `Tienes ${dueCount === 1 ? '1 recurrente pendiente' : `${dueCount} recurrentes pendientes`} de registrar.`
  );
  await settings.set(RECURRING_LAST_REMINDER_KEY, today);
}
