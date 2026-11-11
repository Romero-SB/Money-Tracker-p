import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

type IconBadgeProps = {
  icon: string;
  color: string;
  size?: number;
};

export function IconBadge({ icon, color, size = 44 }: IconBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}22`,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Ionicons name={icon as ComponentProps<typeof Ionicons>['name']} size={Math.round(size * 0.52)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
