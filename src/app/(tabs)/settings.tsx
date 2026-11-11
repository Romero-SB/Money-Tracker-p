import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import type { IconName } from '@/constants/options';
import { Spacing } from '@/constants/theme';

type MenuEntry = {
  icon: IconName;
  color: string;
  label: string;
  description: string;
  route?: Href;
};

const MENU: MenuEntry[] = [
  {
    icon: 'wallet',
    color: '#0D9488',
    label: 'Cuentas',
    description: 'Administra tus fuentes de dinero',
    route: '/accounts',
  },
  {
    icon: 'pricetags',
    color: '#6366F1',
    label: 'Categorías',
    description: 'Organiza tus ingresos y gastos',
    route: '/categories',
  },
];

const COMING_SOON: MenuEntry[] = [
  {
    icon: 'lock-closed',
    color: '#64748B',
    label: 'Seguridad',
    description: 'PIN de acceso y biometría',
  },
  {
    icon: 'notifications',
    color: '#64748B',
    label: 'Notificaciones',
    description: 'Recordatorios y alertas',
  },
  {
    icon: 'cloud-upload',
    color: '#64748B',
    label: 'Copias de seguridad',
    description: 'Respaldo y restauración',
  },
  {
    icon: 'download',
    color: '#64748B',
    label: 'Exportar',
    description: 'Exporta tus movimientos',
  },
];

export default function SettingsScreen() {
  return (
    <Screen scroll>
      <Card style={styles.card}>
        {MENU.map((entry) => (
          <ListRow
            key={entry.label}
            icon={entry.icon}
            color={entry.color}
            title={entry.label}
            subtitle={entry.description}
            onPress={() => router.push(entry.route!)}
          />
        ))}
      </Card>

      <View style={styles.section}>
        <ThemedText variant="tiny" color="faint" style={styles.sectionTitle}>
          PRÓXIMAMENTE
        </ThemedText>
        <Card style={styles.card}>
          {COMING_SOON.map((entry) => (
            <ListRow
              key={entry.label}
              icon={entry.icon}
              color={entry.color}
              title={entry.label}
              subtitle={entry.description}
              dimmed
            />
          ))}
        </Card>
      </View>

      <ThemedText variant="tiny" color="faint" style={styles.version}>
        Money Tracker v1.0 · Sol peruano (PEN)
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.xs,
  },
  section: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 1,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
