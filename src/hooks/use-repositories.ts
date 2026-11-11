import { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { accountsRepository } from '@/db/repositories/accounts';
import { categoriesRepository } from '@/db/repositories/categories';
import { movementsRepository } from '@/db/repositories/movements';
import { settingsRepository } from '@/db/repositories/settings';

export function useRepositories() {
  const db = useSQLiteContext();

  return useMemo(
    () => ({
      accounts: accountsRepository(db),
      categories: categoriesRepository(db),
      movements: movementsRepository(db),
      settings: settingsRepository(db),
    }),
    [db]
  );
}
