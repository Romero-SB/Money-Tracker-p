import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { type BudgetInput } from '@/db/repositories/budgets';
import {
  createBudget,
  deleteBudget,
  listBudgets,
  updateBudget,
} from '@/services/budgets';
import type { BudgetWithProgress } from '@/types/models';

export function useBudgets() {
  const db = useSQLiteContext();
  const [budgets, setBudgets] = useState<BudgetWithProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await listBudgets(db);
      setBudgets(result);
      setError(null);
    } catch {
      setError('No se pudieron cargar los presupuestos');
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const create = useCallback(
    async (input: BudgetInput) => {
      const id = await createBudget(db, input);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: number, input: BudgetInput) => {
      await updateBudget(db, id, input);
      await refresh();
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteBudget(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return { budgets, error, refresh, create, update, remove };
}
