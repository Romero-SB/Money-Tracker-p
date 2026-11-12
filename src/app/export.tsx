import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { exportMovementsCsv, getExportCount } from '@/services/export';

const COLUMNS = ['Fecha', 'Tipo', 'Cuenta', 'Categoría', 'Descripción', 'Importe'];

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

  const hasData = count !== null && count > 0;

  return (
    <Screen scroll>
      <Card style={styles.stat}>
        <IconBadge icon="document-text" color={Colors.primary} size={56} />
        <ThemedText variant="title" color="primary" style={styles.statNumber}>
          {count === null ? '…' : count}
        </ThemedText>
        <ThemedText variant="small" color="muted">
          {count === 1 ? 'movimiento listo para exportar' : 'movimientos listos para exportar'}
        </ThemedText>
        {count === 0 ? (
          <ThemedText variant="tiny" color="faint">
            Registra tu primer movimiento para poder exportarlo.
          </ThemedText>
        ) : null}
      </Card>

      <ThemedText variant="tiny" color="faint" style={styles.sectionTitle}>
        COLUMNAS DEL ARCHIVO
      </ThemedText>
      <Card style={styles.card}>
        <View style={styles.chips}>
          {COLUMNS.map((column) => (
            <View key={column} style={styles.chip}>
              <Ionicons name="checkmark" size={14} color={Colors.primary} />
              <ThemedText variant="small" style={styles.chipText}>
                {column}
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.note}>
          <Ionicons name="information-circle" size={16} color={Colors.textFaint} />
          <ThemedText variant="tiny" color="faint" style={styles.noteText}>
            Formato CSV compatible con Excel y Google Sheets. Los adjuntos no se incluyen.
          </ThemedText>
        </View>
      </Card>

      <Button
        label="Exportar CSV"
        onPress={handleExport}
        loading={exporting}
        disabled={!hasData}
        style={styles.action}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  statNumber: {
    fontSize: 40,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 1,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  card: {
    gap: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  noteText: {
    flex: 1,
  },
  action: {
    marginTop: Spacing.lg,
  },
});
