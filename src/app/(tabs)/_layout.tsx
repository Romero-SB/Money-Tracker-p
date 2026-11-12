import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { BrandHeader } from '@/components/ui/brand-header';
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
          borderTopWidth: 0,
          height: 66,
          paddingTop: 6,
          paddingBottom: 10,
          elevation: 8,
          shadowColor: '#101828',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTitle: () => <BrandHeader />,
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
