import { format, parseISO } from 'date-fns';
import type { SQLiteDatabase } from 'expo-sqlite';

import { recurringRepository, type RecurringInput } from '@/db/repositories/recurring';
import { movementsRepository } from '@/db/repositories/movements';
import type { RecurringWithDetails } from '@/types/models';

export async function listRecurring(db: SQLiteDatabase): Promise<RecurringWithDetails[]> {
  return recurringRepository(db).list();
}

export async function getRecurring(
  db: SQLiteDatabase,
  id: number
): Promise<RecurringWithDetails | null> {
  const items = await recurringRepository(db).list();
  return items.find((item) => item.id === id) ?? null;
}

export async function getDueRecurring(db: SQLiteDatabase): Promise<RecurringWithDetails[]> {
  return recurringRepository(db).getDue();
}

export async function createRecurring(db: SQLiteDatabase, input: RecurringInput): Promise<number> {
  return recurringRepository(db).create(input);
}

export async function updateRecurring(
  db: SQLiteDatabase,
  id: number,
  input: RecurringInput
): Promise<void> {
  return recurringRepository(db).update(id, input);
}

export async function deleteRecurring(db: SQLiteDatabase, id: number): Promise<void> {
  await recurringRepository(db).remove(id);
}

export async function setRecurringActive(
  db: SQLiteDatabase,
  id: number,
  isActive: boolean
): Promise<void> {
  await recurringRepository(db).setActive(id, isActive);
}

export async function applyRecurring(db: SQLiteDatabase, id: number): Promise<number> {
  let movementId = 0;
  await db.withTransactionAsync(async () => {
    const repo = recurringRepository(db);
    const recurring = await repo.getById(id);
    if (!recurring || !recurring.is_active) {
      throw new Error('La transacción recurrente no está activa');
    }
    const occurredAt = `${format(parseISO(recurring.next_run), "yyyy-MM-dd'T'12:00:00")}`;
    movementId = await movementsRepository(db).create({
      type: recurring.type,
      amount: recurring.amount,
      account_id: recurring.account_id,
      category_id: recurring.category_id,
      description: recurring.description,
      occurred_at: occurredAt,
    });
    await repo.advanceNextRun(id);
  });
  return movementId;
}

export async function skipRecurring(db: SQLiteDatabase, id: number): Promise<void> {
  await recurringRepository(db).advanceNextRun(id);
}
