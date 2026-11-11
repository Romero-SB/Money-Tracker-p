import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import { Button } from '@/components/ui/button';
import type { IconName } from '@/constants/options';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type IconPickerProps = {
  value: IconName;
  onChange: (icon: IconName) => void;
  icons: IconName[];
  accentColor?: string;
};

const COLUMNS = 6;

export function IconPicker({ value, onChange, icons, accentColor = Colors.primary }: IconPickerProps) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (icon: IconName) => {
    onChange(icon);
    setVisible(false);
  };

  return (
    <View>
      <Pressable onPress={() => setVisible(true)} style={styles.trigger}>
        <IconBadge icon={value} color={accentColor} />
        <Text style={styles.triggerLabel}>Cambiar icono</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Elige un icono</Text>
            <FlatList
              data={icons}
              keyExtractor={(icon) => icon}
              numColumns={COLUMNS}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={[styles.gridItem, selected && styles.gridItemSelected]}
                  >
                    <Ionicons
                      name={item}
                      size={24}
                      color={selected ? Colors.primary : Colors.textMuted}
                    />
                  </Pressable>
                );
              }}
            />
            <Button label="Cancelar" variant="secondary" onPress={() => setVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  triggerLabel: {
    fontSize: Typography.small,
    color: Colors.primary,
    fontWeight: '600',
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
    maxHeight: '70%',
    gap: Spacing.lg,
  },
  title: {
    fontSize: Typography.subtitle,
    fontWeight: '600',
    color: Colors.text,
  },
  grid: {
    gap: Spacing.md,
  },
  gridItem: {
    width: `${100 / COLUMNS}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  gridItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
});
