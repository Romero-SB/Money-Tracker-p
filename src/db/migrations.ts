import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, MIGRATION_V1 } from './schema';

type Migration = {
  version: number;
  up: string;
};

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: MIGRATION_V1,
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
    });
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
