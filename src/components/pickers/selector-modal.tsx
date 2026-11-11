import { FlashList } from '@shopify/flash-list';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListRow } from '@/components/ui/list-row';
import { Button } from '@/components/ui/button';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export type SelectorOption = {
  id: number;
  icon: string;
  color: string;
  title: string;
  subtitle?: string;
};

type SelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectorOption[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
  noneOption?: { label: string };
  onSelectNone?: () => void;
};

export function SelectorModal({
  visible,
  onClose,
  title,
  options,
  selectedId,
  onSelect,
  noneOption,
  onSelectNone,
}: SelectorModalProps) {
  const handleSelect = (id: number) => {
    onSelect(id);
    onClose();
  };

  const handleSelectNone = () => {
    onSelectNone?.();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {noneOption ? (
            <Pressable onPress={handleSelectNone} style={styles.noneButton}>
              <Text style={styles.noneLabel}>{noneOption.label}</Text>
            </Pressable>
          ) : null}
          <View style={styles.listContainer}>
            <FlashList
              data={options}
              keyExtractor={(option) => String(option.id)}
              renderItem={({ item }) => (
                <ListRow
                  icon={item.icon}
                  color={item.color}
                  title={item.title}
                  subtitle={item.subtitle}
                  right={
                    item.id === selectedId ? (
                      <Text style={styles.check}>✓</Text>
                    ) : (
                      <View style={styles.checkPlaceholder} />
                    )
                  }
                  onPress={() => handleSelect(item.id)}
                />
              )}
              contentContainerStyle={styles.list}
            />
          </View>
          <Button label="Cancelar" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '75%',
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.subtitle,
    fontWeight: '600',
    color: Colors.text,
  },
  noneButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBackground,
  },
  noneLabel: {
    fontSize: Typography.small,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  listContainer: {
    flexShrink: 1,
  },
  list: {
    paddingBottom: Spacing.md,
  },
  check: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  checkPlaceholder: {
    width: 24,
  },
});
