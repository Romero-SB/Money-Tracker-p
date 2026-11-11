import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { COLOR_PALETTE } from '@/constants/options';
import { Colors, Spacing } from '@/constants/theme';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
};

export function ColorPicker({ value, onChange, colors = COLOR_PALETTE }: ColorPickerProps) {
  return (
    <View style={styles.container}>
      {colors.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            style={[styles.swatch, { backgroundColor: color }, selected && styles.selected]}
          >
            {selected ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: Colors.text,
  },
});
