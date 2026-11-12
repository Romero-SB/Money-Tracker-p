import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { createBackup, restoreBackup } from '@/services/backup';

export default function BackupScreen() {
  const db = useSQLiteContext();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleCreate = async () => {
    try {
      setBackingUp(true);
      const result = await createBackup(db);
      Alert.alert(
        'Copia creada',
        `Se generó "${result.fileName}". Elige dónde guardarla o compártela.`
      );
    } catch {
      Alert.alert('Error', 'No se pudo crear la copia de seguridad.');
    } finally {
      setBackingUp(false);
    }
  };

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }
      const asset = result.assets[0];
      Alert.alert(
        'Restaurar copia',
        `Se reemplazarán TODOS los datos actuales por los de "${asset.name}". Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: () => {
              setRestoring(true);
              restoreBackup(db, asset.uri)
                .then(() => {
                  Alert.alert(
                    'Datos restaurados',
                    'La información se restauró correctamente. Las pantallas se actualizarán al volver a ellas.'
                  );
                })
                .catch((error) => {
                  Alert.alert(
                    'Error',
                    error instanceof Error
                      ? error.message
                      : 'No se pudo restaurar la copia de seguridad.'
                  );
                })
                .finally(() => {
                  setRestoring(false);
                });
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
    }
  };

  return (
    <Screen scroll>
      <Card style={styles.card}>
        <View style={styles.header}>
          <IconBadge icon="cloud-upload" color={Colors.success} />
          <View style={styles.headerText}>
            <ThemedText variant="body" style={styles.title}>
              Crear copia de seguridad
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              Incluye cuentas, movimientos, categorías, presupuestos, metas y recurrentes. Los
              adjuntos no se incluyen.
            </ThemedText>
          </View>
        </View>
        <Button label="Crear y compartir" onPress={handleCreate} loading={backingUp} />
      </Card>

      <Card style={styles.card}>
        <View style={styles.header}>
          <IconBadge icon="cloud-download" color={Colors.warning} />
          <View style={styles.headerText}>
            <ThemedText variant="body" style={styles.title}>
              Restaurar copia
            </ThemedText>
            <ThemedText variant="tiny" color="faint">
              Selecciona un archivo .db creado por Money Tracker. Reemplazará todos los datos
              actuales.
            </ThemedText>
          </View>
        </View>
        <Button label="Seleccionar archivo" variant="danger" onPress={handlePick} loading={restoring} />
      </Card>

      <ThemedText variant="tiny" color="faint" style={styles.note}>
        Guarda tus copias en un lugar seguro. Puedes compartirlas por correo, Drive o enviarlas a tu
        computadora.
      </ThemedText>
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
  note: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
