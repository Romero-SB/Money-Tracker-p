import type { SQLiteDatabase } from 'expo-sqlite';

import {
  movementsRepository,
  type MovementFilters,
  type MovementInput,
} from '@/db/repositories/movements';
import type { MovementWithDetails } from '@/types/models';

export async function createMovement(db: SQLiteDatabase, input: MovementInput): Promise<number> {
  let createdId = 0;
  await db.withTransactionAsync(async () => {
    createdId = await movementsRepository(db).create(input);
  });
  return createdId;
}

export async function updateMovement(
  db: SQLiteDatabase,
  id: number,
  input: MovementInput
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await movementsRepository(db).update(id, input);
  });
}

export async function deleteMovement(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await movementsRepository(db).remove(id);
  });
}

export async function getMovementWithDetails(
  db: SQLiteDatabase,
  id: number
): Promise<MovementWithDetails | null> {
  return movementsRepository(db).getWithDetails(id);
}

export async function listMovements(
  db: SQLiteDatabase,
  filters: MovementFilters,
  limit: number,
  offset: number
): Promise<{ items: MovementWithDetails[]; total: number }> {
  return movementsRepository(db).list(filters, limit, offset);
}
