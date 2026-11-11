import type { SQLiteDatabase } from 'expo-sqlite';

import type { ContributionWithDate, GoalContribution, GoalWithProgress, SavingsGoal } from '@/types/models';
import { nowISO } from '@/utils/dates';

export type GoalInput = {
  name: string;
  description?: string | null;
  target_amount: number;
  deadline?: string | null;
};

export function goalsRepository(db: SQLiteDatabase) {
  async function list(): Promise<GoalWithProgress[]> {
    const goals = await db.getAllAsync<SavingsGoal & { saved: number | null }>(
      `SELECT g.*, COALESCE(SUM(c.amount), 0) AS saved
       FROM savings_goals g
       LEFT JOIN goal_contributions c ON c.goal_id = g.id
       GROUP BY g.id
       ORDER BY g.is_active DESC, g.deadline IS NULL, g.deadline`
    );
    return goals.map((goal) => ({
      ...goal,
      saved: goal.saved ?? 0,
      remaining: goal.target_amount - (goal.saved ?? 0),
      progress: goal.target_amount > 0 ? (goal.saved ?? 0) / goal.target_amount : 0,
    }));
  }

  async function getById(id: number): Promise<GoalWithProgress | null> {
    const goals = await list();
    return goals.find((goal) => goal.id === id) ?? null;
  }

  async function validate(input: GoalInput): Promise<void> {
    if (!input.name.trim()) {
      throw new Error('Escribe un nombre para la meta');
    }
    if (!(input.target_amount > 0)) {
      throw new Error('El monto objetivo debe ser mayor a cero');
    }
  }

  async function create(input: GoalInput): Promise<number> {
    await validate(input);
    const now = nowISO();
    const result = await db.runAsync(
      `INSERT INTO savings_goals (name, description, target_amount, deadline, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [input.name.trim(), input.description?.trim() || null, input.target_amount, input.deadline ?? null, now, now]
    );
    return result.lastInsertRowId;
  }

  async function update(id: number, input: GoalInput): Promise<void> {
    await validate(input);
    const goal = await db.getFirstAsync<SavingsGoal>('SELECT * FROM savings_goals WHERE id = ?', id);
    if (!goal) {
      throw new Error(`No existe la meta ${id}`);
    }
    await db.runAsync(
      `UPDATE savings_goals
       SET name = ?, description = ?, target_amount = ?, deadline = ?, updated_at = ?
       WHERE id = ?`,
      [input.name.trim(), input.description?.trim() || null, input.target_amount, input.deadline ?? null, nowISO(), id]
    );
  }

  async function remove(id: number): Promise<void> {
    await db.runAsync('DELETE FROM savings_goals WHERE id = ?', id);
  }

  async function getContributions(goalId: number): Promise<ContributionWithDate[]> {
    return db.getAllAsync<ContributionWithDate>(
      `SELECT c.*, m.occurred_at AS occurred_at
       FROM goal_contributions c
       LEFT JOIN movements m ON m.id = c.movement_id
       WHERE c.goal_id = ?
       ORDER BY COALESCE(m.occurred_at, c.created_at) DESC`,
      goalId
    );
  }

  async function getContribution(id: number): Promise<GoalContribution | null> {
    return db.getFirstAsync<GoalContribution>('SELECT * FROM goal_contributions WHERE id = ?', id);
  }

  async function addContribution(goalId: number, movementId: number | null, amount: number): Promise<number> {
    const result = await db.runAsync(
      'INSERT INTO goal_contributions (goal_id, movement_id, amount, created_at) VALUES (?, ?, ?, ?)',
      [goalId, movementId, amount, nowISO()]
    );
    return result.lastInsertRowId;
  }

  async function removeContribution(id: number): Promise<void> {
    await db.runAsync('DELETE FROM goal_contributions WHERE id = ?', id);
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
    getContributions,
    getContribution,
    addContribution,
    removeContribution,
  };
}
