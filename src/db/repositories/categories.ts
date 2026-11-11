import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, CategoryType } from '@/types/models';
import { nowISO } from '@/utils/dates';

export type CategoryInput = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

export function categoriesRepository(db: SQLiteDatabase) {
  async function getAll(type?: CategoryType): Promise<Category[]> {
    const where = type ? 'WHERE c.type = ?' : '';
    const params = type ? [type] : [];
    return db.getAllAsync<Category>(
      `SELECT * FROM categories c ${where} ORDER BY c.is_default DESC, c.name COLLATE NOCASE`,
      params
    );
  }

  async function getById(id: number): Promise<Category | null> {
    return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', id);
  }

  async function create(input: CategoryInput): Promise<number> {
    const now = nowISO();
    const result = await db.runAsync(
      `INSERT INTO categories (name, type, icon, color, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [input.name.trim(), input.type, input.icon, input.color, now, now]
    );
    return result.lastInsertRowId;
  }

  async function update(id: number, input: Partial<CategoryInput>): Promise<void> {
    const category = await getById(id);
    if (!category) {
      throw new Error(`No existe la categoría ${id}`);
    }
    await db.runAsync(
      `UPDATE categories SET name = ?, type = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?`,
      [
        (input.name ?? category.name).trim(),
        input.type ?? category.type,
        input.icon ?? category.icon,
        input.color ?? category.color,
        nowISO(),
        id,
      ]
    );
  }

  async function remove(id: number): Promise<void> {
    await db.runAsync('DELETE FROM categories WHERE id = ?', id);
  }

  async function hasMovements(id: number): Promise<boolean> {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM movements WHERE category_id = ?',
      id
    );
    return (result?.count ?? 0) > 0;
  }

  return { getAll, getById, create, update, remove, hasMovements };
}
