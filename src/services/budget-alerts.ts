import type { SQLiteDatabase } from 'expo-sqlite';

import { budgetsRepository } from '@/db/repositories/budgets';
import { settingsRepository } from '@/db/repositories/settings';
import {
  BUDGET_ALERTS_SETTING,
  ensureNotificationPermission,
  sendLocalNotification,
} from '@/services/notifications';
import type { BudgetWithProgress } from '@/types/models';
import { formatMoney } from '@/utils/format';

const ALERT_STATE_KEY = 'budget_alert_state';
const NEAR_THRESHOLD = 0.8;

const LEVELS = { none: 0, near: 1, exceeded: 2 } as const;

type AlertLevel = keyof typeof LEVELS;

type AlertState = Record<string, AlertLevel>;

async function readState(db: SQLiteDatabase): Promise<AlertState> {
  const raw = await settingsRepository(db).get(ALERT_STATE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as AlertState | null;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function levelFor(progress: number): AlertLevel {
  if (progress >= 1) {
    return 'exceeded';
  }
  if (progress >= NEAR_THRESHOLD) {
    return 'near';
  }
  return 'none';
}

async function notify(budget: BudgetWithProgress, level: AlertLevel): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }
  if (level === 'exceeded') {
    await sendLocalNotification(
      'Presupuesto superado',
      `Superaste el presupuesto de ${budget.category_name}: ${formatMoney(budget.spent)} de ${formatMoney(
        budget.amount
      )}.`
    );
  } else {
    await sendLocalNotification(
      'Presupuesto al 80%',
      `Usaste el ${Math.round(budget.progress * 100)}% del presupuesto de ${
        budget.category_name
      }: ${formatMoney(budget.spent)} de ${formatMoney(budget.amount)}.`
    );
  }
}

export async function checkBudgetAlerts(db: SQLiteDatabase, categoryId: number): Promise<void> {
  if ((await settingsRepository(db).get(BUDGET_ALERTS_SETTING)) === 'false') {
    return;
  }
  const budgets = await budgetsRepository(db).getByCategory(categoryId);
  if (budgets.length === 0) {
    return;
  }
  const state = await readState(db);
  let changed = false;

  for (const budget of budgets) {
    const level = levelFor(budget.progress);
    const previous = state[String(budget.id)] ?? 'none';
    if (level === previous) {
      continue;
    }
    if (LEVELS[level] > LEVELS[previous] && level !== 'none') {
      await notify(budget, level);
    }
    if (level === 'none') {
      delete state[String(budget.id)];
    } else {
      state[String(budget.id)] = level;
    }
    changed = true;
  }

  if (changed) {
    await settingsRepository(db).set(ALERT_STATE_KEY, JSON.stringify(state));
  }
}

export async function clearBudgetAlertState(db: SQLiteDatabase, budgetId: number): Promise<void> {
  const state = await readState(db);
  if (!(String(budgetId) in state)) {
    return;
  }
  delete state[String(budgetId)];
  await settingsRepository(db).set(ALERT_STATE_KEY, JSON.stringify(state));
}
