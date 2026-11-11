import { format } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  movementsRepository,
  type CategoryExpense,
  type MonthlyPoint,
} from '@/db/repositories/movements';
import { statsPeriodFromDate, todayISO } from '@/utils/dates';
import type { StatsPeriod } from '@/utils/dates';

const COMPARISON_MONTHS = 6;

export async function getCategoryExpenses(
  db: SQLiteDatabase,
  period: StatsPeriod
): Promise<CategoryExpense[]> {
  const from = format(statsPeriodFromDate(period), 'yyyy-MM-dd');
  return movementsRepository(db).expensesByCategory(from, todayISO());
}

export async function getMonthlyComparison(db: SQLiteDatabase): Promise<MonthlyPoint[]> {
  return movementsRepository(db).getMonthlyTotals(COMPARISON_MONTHS);
}
