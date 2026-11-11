import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

import type { AccountType, BudgetPeriod, CategoryType, MovementType, RecurringFrequency } from '@/types/models';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: IconName }[] = [
  { value: 'cash', label: 'Efectivo', icon: 'cash' },
  { value: 'bank', label: 'Cuenta bancaria', icon: 'business' },
  { value: 'wallet', label: 'Billetera digital', icon: 'phone-portrait' },
  { value: 'savings', label: 'Ahorros', icon: 'diamond' },
  { value: 'other', label: 'Otro', icon: 'wallet' },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  wallet: 'Billetera digital',
  savings: 'Ahorros',
  other: 'Otro',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
};

export const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
];

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  monthly: 'Mensual',
  yearly: 'Anual',
};

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export const COLOR_PALETTE = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#EC4899',
  '#F43F5E',
  '#64748B',
];

export const CATEGORY_ICONS: IconName[] = [
  'fast-food',
  'restaurant',
  'cafe',
  'pizza',
  'bus',
  'car',
  'bicycle',
  'airplane',
  'walk',
  'home',
  'bed',
  'flash',
  'water',
  'wifi',
  'school',
  'book',
  'library',
  'game-controller',
  'film',
  'musical-notes',
  'tv',
  'medkit',
  'heart',
  'fitness',
  'barbell',
  'shirt',
  'pricetag',
  'gift',
  'paw',
  'briefcase',
  'cart',
  'laptop',
  'trending-up',
  'cash',
  'card',
  'build',
  'construct',
  'calculator',
  'calendar',
  'people',
  'person',
  'star',
  'football',
  'ellipsis-horizontal-circle',
];

export const ACCOUNT_ICONS: IconName[] = [
  'wallet',
  'cash',
  'card',
  'business',
  'diamond',
  'phone-portrait',
  'home',
  'briefcase',
  'airplane',
  'school',
  'medkit',
  'pricetag',
  'bar-chart',
];
