import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { exportMovementsCsv, getExportCount } from '@/services/export';

const COLUMNS = [
  { icon: 'calendar', label: 'Fecha' },
  { icon: 'swap-horizontal', label: 'Tipo' },
  { icon: 'wallet', label: 'Cuenta' },
  { icon: 'pricetag', label: 'Categoría' },
  { icon: 'document-text', label: 'Descripción' },
  { icon: 'cash', label: 'Importe' },
] as const;

export default function ExportScreen() {
  const db = useSQLiteContext();
  const [count, setCount] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getExportCount(db)
        .then((result) => {
          if (!cancelled) {
            setCount(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCount(0);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  const handleExport = async () => {
    try {
      setExporting(true);
      const result = await exportMovementsCsv(db);
      Alert.alert(
        'Exportación lista',
        `Se preparó "${result.fileName}" con ${result.count} ${
          result.count === 1 ? 'movimiento' : 'movimientos'
        }. Elige dónde guardarlo o compartirlo.`
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo exportar.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen scroll>
      <Card style={styles.card}>
        <View style={styles.header}>
          <IconBadge icon="document-text" color={Colors.primary} />
          <View style={styles.headerText}>
            <ThemedText variant="body" style={styles.title}>
              Exportar movimientos
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              Genera un archivo CSV (compatible con Excel y Google Sheets) con todos tus movimientos.
            </ThemedText>
          </View>
        </View>

        <View style={styles.columns}>
          {COLUMNS.map((column) => (
            <View key={column.label} style={styles.columnRow}>
              <IconBadge icon={column.icon} color={Colors.textMuted} size={30} />
              <ThemedText variant="small">{column.label}</ThemedText>
            </View>
          ))}
        </View>

        <ThemedText variant="tiny" color="faint">
          Los adjuntos y las notas no se incluyen en el archivo.
        </ThemedText>
      </Card>

      <Card style={styles.card}>
        <ThemedText variant="small" color="muted">
          {count === null
            ? 'Contando movimientos…'
            : count === 0
              ? 'Aún no tienes movimientos para exportar.'
              : `${count} ${count === 1 ? 'movimiento listo' : 'movimientos listos'} para exportar.`}
        </ThemedText>
        <Button
          label="Exportar CSV"
          onPress={handleExport}
          loading={exporting}
          disabled={count === null || count === 0}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  columns: {
    gap: Spacing.sm,
  },
  columnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
