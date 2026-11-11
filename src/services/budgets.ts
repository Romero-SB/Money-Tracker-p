import type { SQLiteDatabase } from 'expo-sqlite';

import { budgetsRepository, type BudgetInput } from '@/db/repositories/budgets';
import { clearBudgetAlertState } from '@/services/budget-alerts';
import type { BudgetWithProgress } from '@/types/models';

export async function listBudgets(db: SQLiteDatabase): Promise<BudgetWithProgress[]> {
  return budgetsRepository(db).list();
}

export async function getBudget(db: SQLiteDatabase, id: number): Promise<BudgetWithProgress | null> {
  return budgetsRepository(db).getById(id);
}

export async function createBudget(db: SQLiteDatabase, input: BudgetInput): Promise<number> {
  return budgetsRepository(db).create(input);
}

export async function updateBudget(db: SQLiteDatabase, id: number, input: BudgetInput): Promise<void> {
  await budgetsRepository(db).update(id, input);
  await clearBudgetAlertState(db, id);
}

export async function deleteBudget(db: SQLiteDatabase, id: number): Promise<void> {
  await budgetsRepository(db).remove(id);
  await clearBudgetAlertState(db, id);
}
