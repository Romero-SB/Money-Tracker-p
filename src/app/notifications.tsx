import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { settingsRepository } from '@/db/repositories/settings';
import {
  BUDGET_ALERTS_SETTING,
  RECURRING_REMINDERS_SETTING,
  ensureNotificationPermission,
  isNotificationToggleEnabled,
  sendLocalNotification,
} from '@/services/notifications';

type NotificationsState = {
  budgetAlerts: boolean;
  recurringReminders: boolean;
} | null;

export default function NotificationsScreen() {
  const db = useSQLiteContext();
  const [state, setState] = useState<NotificationsState>(null);
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [budgetAlerts, recurringReminders] = await Promise.all([
          isNotificationToggleEnabled(db, BUDGET_ALERTS_SETTING),
          isNotificationToggleEnabled(db, RECURRING_REMINDERS_SETTING),
        ]);
        if (!cancelled) {
          setState({ budgetAlerts, recurringReminders });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  const handleToggle = (key: string, field: 'budgetAlerts' | 'recurringReminders') => {
    return async (enabled: boolean) => {
      setState((current) => (current ? { ...current, [field]: enabled } : current));
      await settingsRepository(db).set(key, enabled ? 'true' : 'false');
    };
  };

  const handleTest = async () => {
    try {
      setSending(true);
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notificaciones desactivadas',
          'Activa las notificaciones de Money Tracker en los ajustes del sistema para recibirlas.'
        );
        return;
      }
      await sendLocalNotification(
        'Notificación de prueba',
        'Así se verán las alertas de presupuestos y recurrentes.'
      );
    } catch {
      Alert.alert('Error', 'No se pudo enviar la notificación.');
    } finally {
      setSending(false);
    }
  };

  if (!state) {
    return (
      <Screen>
        <View style={styles.center} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Card style={styles.card}>
        <View style={styles.row}>
          <IconBadge icon="pie-chart" color={Colors.savings} />
          <View style={styles.rowText}>
            <ThemedText variant="body" style={styles.rowTitle}>
              Alertas de presupuestos
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              Avisan cuando usas el 80% de un presupuesto y al superarlo.
            </ThemedText>
          </View>
          <Switch
            value={state.budgetAlerts}
            onValueChange={handleToggle(BUDGET_ALERTS_SETTING, 'budgetAlerts')}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={state.budgetAlerts ? '#FFFFFF' : Colors.textFaint}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <IconBadge icon="repeat" color={Colors.info} />
          <View style={styles.rowText}>
            <ThemedText variant="body" style={styles.rowTitle}>
              Recordatorios de recurrentes
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              Avisan una vez al día si tienes recurrentes pendientes de registrar.
            </ThemedText>
          </View>
          <Switch
            value={state.recurringReminders}
            onValueChange={handleToggle(RECURRING_REMINDERS_SETTING, 'recurringReminders')}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={state.recurringReminders ? '#FFFFFF' : Colors.textFaint}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <ThemedText variant="body" style={styles.rowTitle}>
          Probar notificaciones
        </ThemedText>
        <ThemedText variant="tiny" color="faint">
          Envía una notificación de ejemplo para verificar que todo funciona.
        </ThemedText>
        <Button label="Enviar notificación de prueba" onPress={handleTest} loading={sending} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: '600',
  },
  center: {
    flex: 1,
  },
});
