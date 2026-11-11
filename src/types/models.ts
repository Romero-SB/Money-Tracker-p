export type AccountType = 'cash' | 'bank' | 'wallet' | 'savings' | 'other';

export type CategoryType = 'income' | 'expense';

export type MovementType = 'income' | 'expense' | 'transfer';

export type BudgetPeriod = 'monthly' | 'yearly';

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  currency: string;
  icon: string;
  color: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type AccountWithBalance = Account & {
  balance: number;
};

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type Movement = {
  id: number;
  type: MovementType;
  amount: number;
  account_id: number;
  destination_account_id: number | null;
  category_id: number | null;
  description: string;
  notes: string | null;
  occurred_at: string;
  is_deleted: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type MovementAttachment = {
  id: number;
  movement_id: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  size: number;
  created_at: string;
};

export type MovementWithDetails = Movement & {
  account_name: string;
  account_type: AccountType;
  destination_account_name: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  attachment_count: number;
};

export type Budget = {
  id: number;
  category_id: number;
  amount: number;
  period: BudgetPeriod;
  created_at: string;
  updated_at: string;
};

export type BudgetWithProgress = Budget & {
  category_name: string;
  category_icon: string;
  category_color: string;
  spent: number;
  remaining: number;
  progress: number;
};

export type SavingsGoal = {
  id: number;
  name: string;
  description: string | null;
  target_amount: number;
  deadline: string | null;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type GoalWithProgress = SavingsGoal & {
  saved: number;
  remaining: number;
  progress: number;
};

export type ContributionWithDate = GoalContribution & {
  occurred_at: string | null;
};

export type GoalContribution = {
  id: number;
  goal_id: number;
  movement_id: number | null;
  amount: number;
  created_at: string;
};

export type RecurringTransaction = {
  id: number;
  type: CategoryType;
  amount: number;
  account_id: number;
  category_id: number | null;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  next_run: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type RecurringWithDetails = RecurringTransaction & {
  account_name: string;
  category_name: string | null;
};

export type AppSettings = Record<string, string>;
