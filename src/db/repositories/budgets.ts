import { format, startOfMonth, startOfYear } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Budget, BudgetPeriod, BudgetWithProgress } from '@/types/models';
import { nowISO } from '@/utils/dates';

export type BudgetInput = {
  category_id: number;
  amount: number;
  period: BudgetPeriod;
};

function periodRange(period: BudgetPeriod): { from: string; to: string } {
  const now = new Date();
  const start = period === 'monthly' ? startOfMonth(now) : startOfYear(now);
  return { from: format(start, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
}

export function budgetsRepository(db: SQLiteDatabase) {
  async function list(): Promise<BudgetWithProgress[]> {
    const budgets = await db.getAllAsync<
      Budget & {
        category_name: string;
        category_icon: string;
        category_color: string;
      }
    >(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       ORDER BY c.name`
    );

    const monthlySpent = await spentByCategory('monthly');
    const yearlySpent = await spentByCategory('yearly');

    return budgets.map((budget) => {
      const spent =
        (budget.period === 'monthly' ? monthlySpent.get(budget.category_id) : yearlySpent.get(budget.category_id)) ??
        0;
      return {
        ...budget,
        spent,
        remaining: budget.amount - spent,
        progress: budget.amount > 0 ? spent / budget.amount : 0,
      };
    });
  }

  async function spentByCategory(period: BudgetPeriod): Promise<Map<number, number>> {
    const { from, to } = periodRange(period);
    const rows = await db.getAllAsync<{ category_id: number; total: number | null }>(
      `SELECT category_id, COALESCE(SUM(amount), 0) AS total
       FROM movements
       WHERE is_deleted = 0 AND type = 'expense' AND category_id IS NOT NULL
         AND occurred_at >= ? AND occurred_at <= ?
       GROUP BY category_id`,
      [from, `${to}T23:59:59.999Z`]
    );
    return new Map(rows.map((row) => [row.category_id, row.total ?? 0]));
  }

  async function getById(id: number): Promise<BudgetWithProgress | null> {
    const budgets = await list();
    return budgets.find((budget) => budget.id === id) ?? null;
  }

  async function getByCategory(categoryId: number): Promise<BudgetWithProgress[]> {
    const budgets = await list();
    return budgets.filter((budget) => budget.category_id === categoryId);
  }

  async function validate(input: BudgetInput, excludeId?: number): Promise<void> {
    if (!(input.amount > 0)) {
      throw new Error('El monto del presupuesto debe ser mayor a cero');
    }
    const category = await db.getFirstAsync<{ type: string }>('SELECT type FROM categories WHERE id = ?', [
      input.category_id,
    ]);
    if (!category) {
      throw new Error('La categoría seleccionada no existe');
    }
    if (category.type !== 'expense') {
      throw new Error('Solo puedes crear presupuestos para categorías de gasto');
    }
    const duplicate = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM budgets WHERE category_id = ? AND period = ?',
      [input.category_id, input.period]
    );
    if (duplicate && duplicate.id !== excludeId) {
      throw new Error('Ya existe un presupuesto para esta categoría en ese período');
    }
  }

  async function create(input: BudgetInput): Promise<number> {
    await validate(input);
    const now = nowISO();
    const result = await db.runAsync(
      `INSERT INTO budgets (category_id, amount, period, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [input.category_id, input.amount, input.period, now, now]
    );
    return result.lastInsertRowId;
  }

  async function update(id: number, input: BudgetInput): Promise<void> {
    await validate(input, id);
    const budget = await db.getFirstAsync<Budget>('SELECT * FROM budgets WHERE id = ?', id);
    if (!budget) {
      throw new Error(`No existe el presupuesto ${id}`);
    }
    await db.runAsync(
      'UPDATE budgets SET category_id = ?, amount = ?, period = ?, updated_at = ? WHERE id = ?',
      [input.category_id, input.amount, input.period, nowISO(), id]
    );
  }

  async function remove(id: number): Promise<void> {
    await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
  }

  return { list, getById, getByCategory, create, update, remove };
}
