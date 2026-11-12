import type { SQLiteDatabase } from 'expo-sqlite';

import { settingsRepository } from './repositories/settings';
import { runMigrations } from './migrations';
import { runSeed } from './seed';
import { CURRENCY_SETTING_KEY, isValidCurrency, setDisplayCurrency } from '@/utils/format';

export { DATABASE_NAME, DATABASE_VERSION } from './schema';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db);
  await runSeed(db);
  const currency = await settingsRepository(db).get(CURRENCY_SETTING_KEY);
  if (isValidCurrency(currency)) {
    setDisplayCurrency(currency);
  }
}
