import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { type RecurringInput } from '@/db/repositories/recurring';
import {
  createRecurring,
  deleteRecurring,
  listRecurring,
  setRecurringActive,
  updateRecurring,
} from '@/services/recurring';
import type { RecurringWithDetails } from '@/types/models';

export function useRecurring() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<RecurringWithDetails[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await listRecurring(db);
      setItems(result);
      setError(null);
    } catch {
      setError('No se pudieron cargar las transacciones recurrentes');
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const create = useCallback(
    async (input: RecurringInput) => {
      const id = await createRecurring(db, input);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: number, input: RecurringInput) => {
      await updateRecurring(db, id, input);
      await refresh();
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteRecurring(db, id);
      await refresh();
    },
    [db, refresh]
  );

  const setActive = useCallback(
    async (id: number, isActive: boolean) => {
      await setRecurringActive(db, id, isActive);
      await refresh();
    },
    [db, refresh]
  );

  return { items, error, refresh, create, update, remove, setActive };
}
