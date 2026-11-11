import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { type CategoryInput } from '@/db/repositories/categories';
import { useRepositories } from '@/hooks/use-repositories';
import type { Category } from '@/types/models';

export function useCategories() {
  const { categories: repo } = useRepositories();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await repo.getAll();
      setCategories(result);
      setError(null);
    } catch {
      setError('No se pudieron cargar las categorías');
    }
  }, [repo]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const create = useCallback(
    async (input: CategoryInput) => {
      const id = await repo.create(input);
      await refresh();
      return id;
    },
    [repo, refresh]
  );

  const update = useCallback(
    async (id: number, input: Partial<CategoryInput>) => {
      await repo.update(id, input);
      await refresh();
    },
    [repo, refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      await repo.remove(id);
      await refresh();
    },
    [repo, refresh]
  );

  return { categories, error, refresh, create, update, remove };
}
