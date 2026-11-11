import { addDays, addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { RecurringFrequency, RecurringTransaction, RecurringWithDetails } from '@/types/models';
import { nowISO, todayISO } from '@/utils/dates';

export type RecurringInput = {
  type: 'income' | 'expense';
  amount: number;
  account_id: number;
  category_id?: number | null;
  description?: string;
  frequency: RecurringFrequency;
  start_date: string;
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export function nextOccurrence(date: Date, frequency: RecurringFrequency): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'biweekly':
      return addWeeks(date, 2);
    case 'monthly':
      return addMonths(date, 1);
    case 'quarterly':
      return addMonths(date, 3);
    case 'yearly':
      return addYears(date, 1);
  }
}

export function nextRunAfter(nextRun: string, frequency: RecurringFrequency): string {
  const today = todayISO();
  let current = parseISO(nextRun);
  let guard = 0;
  while (format(current, 'yyyy-MM-dd') <= today && guard < 500) {
    current = nextOccurrence(current, frequency);
    guard += 1;
  }
  return format(current, 'yyyy-MM-dd');
}

export function recurringRepository(db: SQLiteDatabase) {
  async function list(): Promise<RecurringWithDetails[]> {
    return db.getAllAsync<RecurringWithDetails>(
      `SELECT r.*, a.name AS account_name, c.name AS category_name
       FROM recurring_transactions r
       JOIN accounts a ON a.id = r.account_id
       LEFT JOIN categories c ON c.id = r.category_id
       ORDER BY r.is_active DESC, r.next_run`
    );
  }

  async function getById(id: number): Promise<RecurringTransaction | null> {
    return db.getFirstAsync<RecurringTransaction>('SELECT * FROM recurring_transactions WHERE id = ?', id);
  }

  async function getDue(): Promise<RecurringWithDetails[]> {
    return db.getAllAsync<RecurringWithDetails>(
      `SELECT r.*, a.name AS account_name, c.name AS category_name
       FROM recurring_transactions r
       JOIN accounts a ON a.id = r.account_id
       LEFT JOIN categories c ON c.id = r.category_id
       WHERE r.is_active = 1 AND r.next_run <= ?
       ORDER BY r.next_run`,
      todayISO()
    );
  }

  async function validate(input: RecurringInput): Promise<void> {
    if (!(input.amount > 0)) {
      throw new Error('El importe debe ser mayor a cero');
    }
    const account = await db.getFirstAsync<{ id: number }>('SELECT id FROM accounts WHERE id = ?', [
      input.account_id,
    ]);
    if (!account) {
      throw new Error('La cuenta seleccionada no existe');
    }
  }

  async function create(input: RecurringInput): Promise<number> {
    await validate(input);
    const now = nowISO();
    const result = await db.runAsync(
      `INSERT INTO recurring_transactions
         (type, amount, account_id, category_id, description, frequency, start_date, next_run, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        input.type,
        input.amount,
        input.account_id,
        input.category_id ?? null,
        input.description?.trim() ?? '',
        input.frequency,
        input.start_date,
        input.start_date,
        now,
        now,
      ]
    );
    return result.lastInsertRowId;
  }

  async function update(id: number, input: RecurringInput): Promise<void> {
    await validate(input);
    const recurring = await getById(id);
    if (!recurring) {
      throw new Error(`No existe la transacción recurrente ${id}`);
    }
    const nextRun =
      recurring.start_date !== input.start_date || recurring.frequency !== input.frequency
        ? input.start_date
        : recurring.next_run;
    await db.runAsync(
      `UPDATE recurring_transactions
       SET type = ?, amount = ?, account_id = ?, category_id = ?, description = ?, frequency = ?, start_date = ?, next_run = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.type,
        input.amount,
        input.account_id,
        input.category_id ?? null,
        input.description?.trim() ?? '',
        input.frequency,
        input.start_date,
        nextRun,
        nowISO(),
        id,
      ]
    );
  }

  async function remove(id: number): Promise<void> {
    await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', id);
  }

  async function setActive(id: number, isActive: boolean): Promise<void> {
    await db.runAsync('UPDATE recurring_transactions SET is_active = ?, updated_at = ? WHERE id = ?', [
      isActive ? 1 : 0,
      nowISO(),
      id,
    ]);
  }

  async function advanceNextRun(id: number): Promise<string> {
    const recurring = await getById(id);
    if (!recurring) {
      throw new Error(`No existe la transacción recurrente ${id}`);
    }
    const nextRun = nextRunAfter(recurring.next_run, recurring.frequency);
    await db.runAsync('UPDATE recurring_transactions SET next_run = ?, updated_at = ? WHERE id = ?', [
      nextRun,
      nowISO(),
      id,
    ]);
    return nextRun;
  }

  return { list, getById, getDue, create, update, remove, setActive, advanceNextRun };
}
