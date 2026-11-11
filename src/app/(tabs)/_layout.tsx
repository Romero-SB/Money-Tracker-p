import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { Colors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
  name: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
};

const TABS: TabConfig[] = [
  { name: 'index', label: 'Inicio', icon: 'wallet-outline', activeIcon: 'wallet' },
  { name: 'movements', label: 'Movimientos', icon: 'swap-horizontal-outline', activeIcon: 'swap-horizontal' },
  { name: 'stats', label: 'Estadísticas', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
  { name: 'goals', label: 'Objetivos', icon: 'flag-outline', activeIcon: 'flag' },
  { name: 'settings', label: 'Ajustes', icon: 'settings-outline', activeIcon: 'settings' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
        },
        headerShadowVisible: false,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={size} color={color as string} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
