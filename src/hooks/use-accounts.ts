import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { type AccountInput } from '@/db/repositories/accounts';
import { useRepositories } from '@/hooks/use-repositories';
import type { AccountWithBalance } from '@/types/models';

export function useAccounts() {
  const { accounts: repo } = useRepositories();
  const [accounts, setAccounts] = useState<AccountWithBalance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await repo.getAll(true);
      setAccounts(result);
      setError(null);
    } catch {
      setError('No se pudieron cargar las cuentas');
    }
  }, [repo]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const create = useCallback(
    async (input: AccountInput) => {
      const id = await repo.create(input);
      await refresh();
      return id;
    },
    [repo, refresh]
  );

  const update = useCallback(
    async (id: number, input: Partial<AccountInput>) => {
      await repo.update(id, input);
      await refresh();
    },
    [repo, refresh]
  );

  const setActive = useCallback(
    async (id: number, isActive: boolean) => {
      await repo.setActive(id, isActive);
      await refresh();
    },
    [repo, refresh]
  );

  return { accounts, error, refresh, create, update, setActive };
}
