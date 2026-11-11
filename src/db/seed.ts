import type { SQLiteDatabase } from 'expo-sqlite';

type SeedCategory = {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
};

const DEFAULT_CATEGORIES: SeedCategory[] = [
  { name: 'Alimentación', type: 'expense', icon: 'fast-food', color: '#F97316' },
  { name: 'Transporte', type: 'expense', icon: 'bus', color: '#3B82F6' },
  { name: 'Hogar', type: 'expense', icon: 'home', color: '#8B5CF6' },
  { name: 'Servicios', type: 'expense', icon: 'flash', color: '#EAB308' },
  { name: 'Educación', type: 'expense', icon: 'book', color: '#06B6D4' },
  { name: 'Entretenimiento', type: 'expense', icon: 'game-controller', color: '#EC4899' },
  { name: 'Salud', type: 'expense', icon: 'medkit', color: '#EF4444' },
  { name: 'Ropa', type: 'expense', icon: 'shirt', color: '#14B8A6' },
  { name: 'Regalos', type: 'expense', icon: 'gift', color: '#F43F5E' },
  { name: 'Otros gastos', type: 'expense', icon: 'ellipsis-horizontal-circle', color: '#64748B' },
  { name: 'Salario', type: 'income', icon: 'briefcase', color: '#10B981' },
  { name: 'Ventas', type: 'income', icon: 'cart', color: '#22C55E' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#84CC16' },
  { name: 'Inversiones', type: 'income', icon: 'trending-up', color: '#F59E0B' },
  { name: 'Otros ingresos', type: 'income', icon: 'add-circle', color: '#64748B' },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  currency: 'PEN',
};

export async function runSeed(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  const categoryCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM categories');
  if ((categoryCount?.count ?? 0) === 0) {
    await db.withTransactionAsync(async () => {
      for (const category of DEFAULT_CATEGORIES) {
        await db.runAsync(
          'INSERT INTO categories (name, type, icon, color, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)',
          [category.name, category.type, category.icon, category.color, now, now]
        );
      }
    });
  }

  const accountCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM accounts');
  if ((accountCount?.count ?? 0) === 0) {
    await db.runAsync(
      'INSERT INTO accounts (name, type, initial_balance, currency, icon, color, is_active, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?, 1, ?, ?)',
      ['Efectivo', 'cash', 'PEN', 'wallet', '#0D9488', now, now]
    );
  }

  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.runAsync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  });
}
