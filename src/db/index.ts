import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';
import { runSeed } from './seed';

export { DATABASE_NAME, DATABASE_VERSION } from './schema';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db);
  await runSeed(db);
}
