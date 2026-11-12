import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { StyleSheet, View } from 'react-native';

import { SelectorModal } from '@/components/pickers/selector-modal';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import type { IconName } from '@/constants/options';
import { Spacing } from '@/constants/theme';
import { settingsRepository } from '@/db/repositories/settings';
import {
  CURRENCIES,
  CURRENCY_SETTING_KEY,
  currencyLabel,
  getDisplayCurrency,
  isValidCurrency,
  setDisplayCurrency,
  type CurrencyCode,
} from '@/utils/format';

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
  {
    icon: 'pie-chart',
    color: '#F59E0B',
    label: 'Presupuestos',
    description: 'Límites de gasto y alertas',
    route: '/budgets',
  },
  {
    icon: 'repeat',
    color: '#8B5CF6',
    label: 'Recurrentes',
    description: 'Movimientos que se repiten',
    route: '/recurring',
  },
  {
    icon: 'lock-closed',
    color: '#EF4444',
    label: 'Seguridad',
    description: 'PIN de acceso y biometría',
    route: '/security',
  },
  {
    icon: 'notifications',
    color: '#0284C7',
    label: 'Notificaciones',
    description: 'Alertas y recordatorios',
    route: '/notifications',
  },
  {
    icon: 'cloud-upload',
    color: '#10B981',
    label: 'Copias de seguridad',
    description: 'Respaldo y restauración',
    route: '/backup',
  },
  {
    icon: 'download',
    color: '#D97706',
    label: 'Exportar',
    description: 'Exporta tus movimientos a CSV',
    route: '/export',
  },
];

const CURRENCY_OPTIONS = CURRENCIES.map((currency, index) => ({
  id: index + 1,
  icon: (['cash', 'logo-usd', 'logo-euro'] as IconName[])[index],
  color: '#0D9488',
  title: currency.label,
  subtitle: `${currency.symbol} · ${currency.code}`,
  code: currency.code,
}));

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const current = getDisplayCurrency();
    return isValidCurrency(current) ? current : 'PEN';
  });
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);

  const handleCurrencySelect = async (id: number) => {
    const option = CURRENCY_OPTIONS.find((item) => item.id === id);
    if (!option) {
      return;
    }
    setCurrency(option.code);
    setDisplayCurrency(option.code);
    await settingsRepository(db).set(CURRENCY_SETTING_KEY, option.code);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <ThemedText variant="tiny" color="faint" style={styles.sectionTitle}>
          PREFERENCIAS
        </ThemedText>
        <Card style={styles.card}>
          <ListRow
            icon="cash"
            color="#0D9488"
            title="Moneda"
            subtitle={currencyLabel(currency)}
            onPress={() => setCurrencyPickerVisible(true)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText variant="tiny" color="faint" style={styles.sectionTitle}>
          GESTIÓN
        </ThemedText>
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
      </View>

      <ThemedText variant="tiny" color="faint" style={styles.footer}>
        Money Tracker v1.0
      </ThemedText>

      <SelectorModal
        visible={currencyPickerVisible}
        onClose={() => setCurrencyPickerVisible(false)}
        title="Moneda"
        options={CURRENCY_OPTIONS}
        selectedId={CURRENCY_OPTIONS.find((item) => item.code === currency)?.id ?? null}
        onSelect={handleCurrencySelect}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.xs,
  },
  content: {
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 1,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
