import type { SQLiteDatabase } from 'expo-sqlite';

import type { Account, AccountType, AccountWithBalance } from '@/types/models';
import { nowISO } from '@/utils/dates';

export type AccountInput = {
  name: string;
  type: AccountType;
  initial_balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
};

const BALANCE_FORMULA = `
  a.initial_balance
  + COALESCE((SELECT SUM(m.amount) FROM movements m WHERE m.account_id = a.id AND m.type = 'income' AND m.is_deleted = 0), 0)
  - COALESCE((SELECT SUM(m.amount) FROM movements m WHERE m.account_id = a.id AND m.type = 'expense' AND m.is_deleted = 0), 0)
  + COALESCE((SELECT SUM(m.amount) FROM movements m WHERE m.destination_account_id = a.id AND m.type = 'transfer' AND m.is_deleted = 0), 0)
  - COALESCE((SELECT SUM(m.amount) FROM movements m WHERE m.account_id = a.id AND m.type = 'transfer' AND m.is_deleted = 0), 0)
`;

const SELECT_ACCOUNTS = `
SELECT
  a.id,
  a.name,
  a.type,
  a.initial_balance,
  a.currency,
  a.icon,
  a.color,
  a.is_active,
  a.created_at,
  a.updated_at,
  ${BALANCE_FORMULA} AS balance
FROM accounts a
`;

export function accountsRepository(db: SQLiteDatabase) {
  async function getAll(includeInactive = false): Promise<AccountWithBalance[]> {
    const where = includeInactive ? '' : 'WHERE a.is_active = 1';
    return db.getAllAsync<AccountWithBalance>(
      `${SELECT_ACCOUNTS} ${where} ORDER BY a.is_active DESC, a.name COLLATE NOCASE`
    );
  }

  async function getById(id: number): Promise<AccountWithBalance | null> {
    return db.getFirstAsync<AccountWithBalance>(`${SELECT_ACCOUNTS} WHERE a.id = ?`, id);
  }

  async function getBalance(id: number): Promise<number> {
    const account = await getById(id);
    return account?.balance ?? 0;
  }

  async function getTotalBalance(): Promise<number> {
    const result = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(balance) AS total FROM (${SELECT_ACCOUNTS} WHERE a.is_active = 1)`
    );
    return result?.total ?? 0;
  }

  async function create(input: AccountInput): Promise<number> {
    const now = nowISO();
    const result = await db.runAsync(
      `INSERT INTO accounts (name, type, initial_balance, currency, icon, color, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        input.name.trim(),
        input.type,
        input.initial_balance ?? 0,
        input.currency ?? 'PEN',
        input.icon ?? 'wallet',
        input.color ?? '#0D9488',
        now,
        now,
      ]
    );
    return result.lastInsertRowId;
  }

  async function update(id: number, input: Partial<AccountInput>): Promise<void> {
    const account = await db.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', id);
    if (!account) {
      throw new Error(`No existe la cuenta ${id}`);
    }
    await db.runAsync(
      `UPDATE accounts
       SET name = ?, type = ?, initial_balance = ?, currency = ?, icon = ?, color = ?, updated_at = ?
       WHERE id = ?`,
      [
        (input.name ?? account.name).trim(),
        input.type ?? account.type,
        input.initial_balance ?? account.initial_balance,
        input.currency ?? account.currency,
        input.icon ?? account.icon,
        input.color ?? account.color,
        nowISO(),
        id,
      ]
    );
  }

  async function setActive(id: number, isActive: boolean): Promise<void> {
    await db.runAsync(
      'UPDATE accounts SET is_active = ?, updated_at = ? WHERE id = ?',
      [isActive ? 1 : 0, nowISO(), id]
    );
  }

  return { getAll, getById, getBalance, getTotalBalance, create, update, setActive };
}
