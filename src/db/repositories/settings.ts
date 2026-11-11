import type { SQLiteDatabase } from 'expo-sqlite';

export function settingsRepository(db: SQLiteDatabase) {
  async function get(key: string): Promise<string | null> {
    const result = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
    return result?.value ?? null;
  }

  async function set(key: string, value: string): Promise<void> {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
  }

  async function remove(key: string): Promise<void> {
    await db.runAsync('DELETE FROM settings WHERE key = ?', key);
  }

  async function getAll(): Promise<Record<string, string>> {
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  return { get, set, remove, getAll };
}
