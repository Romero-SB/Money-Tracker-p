import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import {
  backupDatabaseAsync,
  deleteDatabaseAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { settingsRepository } from '@/db/repositories/settings';
import { CURRENCY_SETTING_KEY, isValidCurrency, setDisplayCurrency } from '@/utils/format';

const TEMP_BACKUP_DB = 'temp-backup.db';
const RESTORE_SOURCE_DB = 'restore-source.db';

async function removeTempDatabase(name: string, directory?: string): Promise<void> {
  try {
    await deleteDatabaseAsync(name, directory);
  } catch {
    return;
  }
}

export async function createBackup(db: SQLiteDatabase): Promise<{ fileName: string }> {
  await removeTempDatabase(TEMP_BACKUP_DB);
  const backupDb = await openDatabaseAsync(TEMP_BACKUP_DB);
  try {
    await backupDatabaseAsync({ sourceDatabase: db, destDatabase: backupDb });
  } finally {
    await backupDb.closeAsync();
  }

  const fileName = `copia-money-tracker-${format(new Date(), 'yyyy-MM-dd-HHmm')}.db`;
  const destination = new File(Paths.cache, fileName);
  new File(backupDb.databasePath).copySync(destination, { overwrite: true });
  await removeTempDatabase(TEMP_BACKUP_DB);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destination.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Copia de seguridad',
    });
  }
  return { fileName };
}

export async function restoreBackup(db: SQLiteDatabase, sourceUri: string): Promise<void> {
  const sourceCopy = new File(Paths.cache, RESTORE_SOURCE_DB);
  new File(sourceUri).copySync(sourceCopy, { overwrite: true });

  const restoreDb = await openDatabaseAsync(RESTORE_SOURCE_DB, undefined, Paths.cache.uri);
  try {
    const table = await restoreDb.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'movements'"
    );
    if (!table) {
      throw new Error('El archivo no parece una copia de seguridad válida de Money Tracker.');
    }
    await backupDatabaseAsync({ sourceDatabase: restoreDb, destDatabase: db });
  } finally {
    await restoreDb.closeAsync();
    await removeTempDatabase(RESTORE_SOURCE_DB, Paths.cache.uri);
  }

  const currency = await settingsRepository(db).get(CURRENCY_SETTING_KEY);
  if (isValidCurrency(currency)) {
    setDisplayCurrency(currency);
  }
}
