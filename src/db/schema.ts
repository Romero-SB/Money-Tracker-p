export const DATABASE_NAME = 'money-tracker.db';

export const DATABASE_VERSION = 1;

export const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'wallet', 'savings', 'other')),
  initial_balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PEN',
  icon TEXT NOT NULL DEFAULT 'wallet',
  color TEXT NOT NULL DEFAULT '#0D9488',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(name, type)
);

CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount REAL NOT NULL CHECK (amount > 0),
  account_id INTEGER NOT NULL,
  destination_account_id INTEGER,
  category_id INTEGER,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT,
  occurred_at TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (destination_account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CHECK (type != 'transfer' OR destination_account_id IS NOT NULL),
  CHECK (type == 'transfer' OR destination_account_id IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_movements_account ON movements(account_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_movements_category ON movements(category_id);
CREATE INDEX IF NOT EXISTS idx_movements_occurred_at ON movements(occurred_at);
CREATE INDEX IF NOT EXISTS idx_movements_deleted ON movements(is_deleted, occurred_at);

CREATE TABLE IF NOT EXISTS movement_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  movement_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_movement ON movement_attachments(movement_id);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  category_id INTEGER NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'yearly')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount REAL NOT NULL CHECK (target_amount > 0),
  deadline TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  goal_id INTEGER NOT NULL,
  movement_id INTEGER,
  amount REAL NOT NULL CHECK (amount > 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
  FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions(goal_id);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount REAL NOT NULL CHECK (amount > 0),
  account_id INTEGER NOT NULL,
  category_id INTEGER,
  description TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date TEXT NOT NULL,
  next_run TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON recurring_transactions(is_active, next_run);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
