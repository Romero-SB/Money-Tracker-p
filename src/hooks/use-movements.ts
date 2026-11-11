import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import type { MovementFilters } from '@/db/repositories/movements';
import { listMovements } from '@/services/movements';
import type { MovementWithDetails } from '@/types/models';

const PAGE_SIZE = 30;

export function useMovements() {
  const db = useSQLiteContext();
  const [filters, setFiltersState] = useState<MovementFilters>({});
  const [items, setItems] = useState<MovementWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number, currentFilters: MovementFilters, append: boolean) => {
      try {
        const result = await listMovements(db, currentFilters, PAGE_SIZE, offset);
        setItems((previous) => (append ? [...previous, ...result.items] : result.items));
        setTotal(result.total);
        setError(null);
      } catch {
        setError('No se pudieron cargar los movimientos');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      load(0, filters, false);
    }, [load, filters])
  );

  const setFilters = useCallback((next: MovementFilters) => {
    setFiltersState(next);
  }, []);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || items.length >= total) {
      return;
    }
    setLoadingMore(true);
    load(items.length, filters, true);
  }, [loading, loadingMore, items.length, total, load, filters]);

  const hasMore = items.length < total;

  return { filters, setFilters, items, total, loading, loadingMore, error, loadMore, hasMore };
}
