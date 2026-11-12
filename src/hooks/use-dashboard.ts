import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { format } from 'date-fns';

import { getPeriodSummary, listMovements } from '@/services/movements';
import { getDueRecurring } from '@/services/recurring';
import { sendDueRecurringReminder } from '@/services/notifications';
import type { MovementWithDetails, RecurringWithDetails } from '@/types/models';
import type { DashboardPeriod } from '@/utils/dates';
import { periodFromDate } from '@/utils/dates';

const LATEST_LIMIT = 5;

export function useDashboard() {
  const db = useSQLiteContext();
  const [period, setPeriodState] = useState<DashboardPeriod>('month');
  const [summary, setSummary] = useState<{ income: number; expense: number } | null>(null);
  const [latest, setLatest] = useState<MovementWithDetails[]>([]);
  const [dueRecurring, setDueRecurring] = useState<RecurringWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (currentPeriod: DashboardPeriod) => {
      try {
        const from = format(periodFromDate(currentPeriod), 'yyyy-MM-dd');
        const to = format(new Date(), 'yyyy-MM-dd');
        const [summaryResult, latestResult, dueRecurringResult] = await Promise.all([
          getPeriodSummary(db, from, to),
          listMovements(db, {}, LATEST_LIMIT, 0),
          getDueRecurring(db),
        ]);
        setSummary(summaryResult);
        setLatest(latestResult.items);
        setDueRecurring(dueRecurringResult);
        setError(null);
        sendDueRecurringReminder(db, dueRecurringResult.length).catch(() => {});
      } catch {
        setError('No se pudo cargar el resumen');
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      load(period);
    }, [load, period])
  );

  const setPeriod = useCallback((next: DashboardPeriod) => {
    setPeriodState(next);
  }, []);

  const refresh = useCallback(() => {
    load(period);
  }, [load, period]);

  return { period, setPeriod, summary, latest, dueRecurring, loading, error, refresh };
}
