import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { type GoalInput } from '@/db/repositories/goals';
import { createGoal, deleteGoal, listGoals, updateGoal } from '@/services/goals';
import type { GoalWithProgress } from '@/types/models';

export function useGoals() {
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<GoalWithProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await listGoals(db);
      setGoals(result);
      setError(null);
    } catch {
      setError('No se pudieron cargar las metas');
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const create = useCallback(
    async (input: GoalInput) => {
      const id = await createGoal(db, input);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: number, input: GoalInput) => {
      await updateGoal(db, id, input);
      await refresh();
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteGoal(db, id);
      await refresh();
    },
    [db, refresh]
  );

  return { goals, error, refresh, create, update, remove };
}
