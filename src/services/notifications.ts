import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'budgets';

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
