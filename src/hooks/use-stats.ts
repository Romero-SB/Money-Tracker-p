import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import type { CategoryExpense, MonthlyPoint } from '@/db/repositories/movements';
import { getCategoryExpenses, getMonthlyComparison } from '@/services/stats';
import type { StatsPeriod } from '@/utils/dates';

export function useStats() {
  const db = useSQLiteContext();
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [expenses, comparison] = await Promise.all([
        getCategoryExpenses(db, period),
        getMonthlyComparison(db),
      ]);
      setCategoryExpenses(expenses);
      setMonthly(comparison);
      setError(null);
    } catch {
      setError('No se pudieron cargar las estadísticas');
    }
  }, [db, period]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { period, setPeriod, categoryExpenses, monthly, error };
}
