import type { SQLiteDatabase } from 'expo-sqlite';

import { goalsRepository, type GoalInput } from '@/db/repositories/goals';
import { movementsRepository } from '@/db/repositories/movements';
import type { ContributionWithDate, GoalWithProgress } from '@/types/models';

export type ContributionInput = {
  amount: number;
  account_id: number;
  occurred_at: string;
};

export async function listGoals(db: SQLiteDatabase): Promise<GoalWithProgress[]> {
  return goalsRepository(db).list();
}

export async function getGoal(db: SQLiteDatabase, id: number): Promise<GoalWithProgress | null> {
  return goalsRepository(db).getById(id);
}

export async function getGoalContributions(
  db: SQLiteDatabase,
  goalId: number
): Promise<ContributionWithDate[]> {
  return goalsRepository(db).getContributions(goalId);
}

export async function createGoal(db: SQLiteDatabase, input: GoalInput): Promise<number> {
  return goalsRepository(db).create(input);
}

export async function updateGoal(db: SQLiteDatabase, id: number, input: GoalInput): Promise<void> {
  return goalsRepository(db).update(id, input);
}

export async function deleteGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await goalsRepository(db).remove(id);
}

export async function addGoalContribution(
  db: SQLiteDatabase,
  goalId: number,
  goalName: string,
  input: ContributionInput
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const movementId = await movementsRepository(db).create({
      type: 'expense',
      amount: input.amount,
      account_id: input.account_id,
      category_id: null,
      description: `Aporte a ${goalName}`,
      occurred_at: input.occurred_at,
    });
    await goalsRepository(db).addContribution(goalId, movementId, input.amount);
  });
}

export async function removeGoalContribution(db: SQLiteDatabase, contributionId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    const contribution = await goalsRepository(db).getContribution(contributionId);
    if (!contribution) {
      return;
    }
    await goalsRepository(db).removeContribution(contribution.id);
    if (contribution.movement_id !== null) {
      await movementsRepository(db).remove(contribution.movement_id);
    }
  });
}
