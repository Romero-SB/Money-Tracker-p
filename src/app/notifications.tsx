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

type ToggleRowProps = {
  icon: string;
  color: string;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ icon, color, title, description, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <IconBadge icon={icon} color={color} />
      <View style={styles.rowText}>
        <ThemedText variant="body" style={styles.rowTitle}>
          {title}
        </ThemedText>
        <ThemedText variant="tiny" color="faint">
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

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
      <ThemedText variant="tiny" color="faint" style={styles.sectionTitle}>
        ALERTAS
      </ThemedText>
      <Card style={styles.card}>
        <ToggleRow
          icon="pie-chart"
          color={Colors.savings}
          title="Alertas de presupuestos"
          description="Avisa al usar el 80% de un presupuesto y al superarlo."
          value={state.budgetAlerts}
          onChange={handleToggle(BUDGET_ALERTS_SETTING, 'budgetAlerts')}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="repeat"
          color={Colors.info}
          title="Recordatorios de recurrentes"
          description="Avisa una vez al día si tienes recurrentes pendientes."
          value={state.recurringReminders}
          onChange={handleToggle(RECURRING_REMINDERS_SETTING, 'recurringReminders')}
        />
      </Card>

      <ThemedText variant="tiny" color="faint" style={styles.sectionTitle}>
        PRUEBA
      </ThemedText>
      <Card style={styles.testCard}>
        <View style={styles.row}>
          <IconBadge icon="paper-plane" color={Colors.primary} />
          <View style={styles.rowText}>
            <ThemedText variant="body" style={styles.rowTitle}>
              Notificación de prueba
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              Verifica que el sistema muestra los avisos de la app.
            </ThemedText>
          </View>
        </View>
        <Button label="Enviar prueba" variant="secondary" onPress={handleTest} loading={sending} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    letterSpacing: 1,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  testCard: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  center: {
    flex: 1,
  },
});
