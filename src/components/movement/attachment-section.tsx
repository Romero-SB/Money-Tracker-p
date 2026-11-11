import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { ThemedText } from '@/components/ui/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  MAX_TOTAL_SIZE,
  openAttachment,
  pickDocument,
  pickFromCamera,
  pickFromGallery,
  type PendingAttachment,
} from '@/services/attachments';
import type { MovementAttachment } from '@/types/models';
import { formatBytes } from '@/utils/format';

type AttachmentSectionProps = {
  existing: MovementAttachment[];
  pending: PendingAttachment[];
  onAdd: (attachments: PendingAttachment[]) => void;
  onRemoveExisting: (attachment: MovementAttachment) => void;
  onRemovePending: (index: number) => void;
};

type AttachmentTile = {
  key: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  onRemove: () => void;
};

export function AttachmentSection({
  existing,
  pending,
  onAdd,
  onRemoveExisting,
  onRemovePending,
}: AttachmentSectionProps) {
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  const tiles: AttachmentTile[] = [
    ...existing.map((attachment) => ({
      key: `existing-${attachment.id}`,
      path: attachment.file_path,
      name: attachment.file_name,
      mimeType: attachment.mime_type,
      size: attachment.size,
      isImage: attachment.mime_type.startsWith('image/'),
      onRemove: () => onRemoveExisting(attachment),
    })),
    ...pending.map((attachment, index) => ({
      key: `pending-${index}-${attachment.uri}`,
      path: attachment.uri,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      isImage: attachment.mimeType.startsWith('image/'),
      onRemove: () => onRemovePending(index),
    })),
  ];

  const totalSize = tiles.reduce((sum, tile) => sum + tile.size, 0);
  const remaining = MAX_TOTAL_SIZE - totalSize;

  const handlePicked = (picked: PendingAttachment[]) => {
    const pickedSize = picked.reduce((sum, attachment) => sum + attachment.size, 0);
    if (pickedSize > remaining) {
      Alert.alert(
        'Límite excedido',
        `Cada movimiento admite hasta ${formatBytes(MAX_TOTAL_SIZE)} en adjuntos. Quedan ${formatBytes(Math.max(remaining, 0))} disponibles.`
      );
      return;
    }
    onAdd(picked);
  };

  const runPicker = async (pick: () => Promise<PendingAttachment[]>) => {
    setSourceModalVisible(false);
    setProcessing(true);
    try {
      const picked = await pick();
      if (picked.length > 0) {
        handlePicked(picked);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo adjuntar el archivo.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpen = async (tile: AttachmentTile) => {
    try {
      await openAttachment(tile.path, tile.name);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir el archivo.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="small" color="muted" style={styles.label}>
          Adjuntos ({tiles.length})
        </ThemedText>
        <ThemedText variant="tiny" color="faint">
          {formatBytes(totalSize)} / {formatBytes(MAX_TOTAL_SIZE)}
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {tiles.map((tile) => (
          <Pressable key={tile.key} style={styles.tile} onPress={() => handleOpen(tile)}>
            {tile.isImage ? (
              <Image source={{ uri: tile.path }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.pdfTile}>
                <Ionicons name="document-text" size={24} color={Colors.transfer} />
                <ThemedText variant="tiny" color="muted" numberOfLines={2} style={styles.pdfName}>
                  {tile.name}
                </ThemedText>
              </View>
            )}
            <Pressable onPress={tile.onRemove} style={styles.removeButton} hitSlop={6}>
              <Ionicons name="close-circle" size={20} color={Colors.text} />
            </Pressable>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setSourceModalVisible(true)}
          disabled={processing}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          {processing ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="add" size={24} color={Colors.textMuted} />
              <ThemedText variant="tiny" color="muted">
                Añadir
              </ThemedText>
            </>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={sourceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSourceModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <ThemedText variant="subtitle">Añadir adjunto</ThemedText>
            <ListRow
              icon="camera"
              color={Colors.primary}
              title="Tomar foto"
              subtitle="Usa la cámara del teléfono"
              onPress={() => runPicker(pickFromCamera)}
            />
            <ListRow
              icon="images"
              color={Colors.income}
              title="Galería"
              subtitle="Elige una o más fotos"
              onPress={() => runPicker(pickFromGallery)}
            />
            <ListRow
              icon="document-text"
              color={Colors.transfer}
              title="Documento (PDF)"
              subtitle="Selecciona un archivo"
              onPress={() => runPicker(pickDocument)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
  list: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pdfTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  pdfName: {
    textAlign: 'center',
    lineHeight: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
});
