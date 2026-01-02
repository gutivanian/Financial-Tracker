// pftu\lib\types.ts
// Type definitions for the application

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: 'bank' | 'cash' | 'e-wallet' | 'credit_card';
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  parent_id?: number;
  icon?: string;
  color?: string;
  budget_type?: 'needs' | 'wants' | 'savings';
  is_active: boolean;
  created_at: Date;
}

export interface Transaction {
  id: number;
  user_id: number;
  account_id?: number;
  to_account_id?: number;
  category_id?: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: Date;
  description?: string;
  notes?: string;
  merchant?: string;
  tags?: string[];
  is_recurring: boolean;
  recurring_id?: number;
  receipt_url?: string;
  admin_fee?: number;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  account_name?: string;
  to_account_name?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period_start: Date;
  period_end: Date;
  rollover: boolean;
  alert_threshold: number;
  created_at: Date;
  updated_at: Date;
  // Calculated fields
  spent?: number;
  remaining?: number;
  percentage?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface FinancialGoal {
  id: number;
  user_id: number;
  account_id?: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: Date;
  priority: 'high' | 'medium' | 'low';
  goal_type?: string;
  auto_save_amount: number;
  status: 'active' | 'completed' | 'paused';
  created_at: Date;
  updated_at: Date;
  // Calculated fields
  progress_percentage?: number;
  remaining_amount?: number;
  days_remaining?: number;
  monthly_required?: number;
}

export interface Investment {
  id: number;
  user_id: number;
  asset_type: 'stocks' | 'mutual_funds' | 'crypto' | 'bonds' | 'gold' | 'property';
  name: string;
  ticker?: string;
  purchase_date: Date;
  purchase_price: number;
  quantity: number;
  current_price?: number;
  platform?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Calculated fields
  total_cost?: number;
  current_value?: number;
  gain_loss?: number;
  gain_loss_percentage?: number;
}

export interface Asset {
  id: number;
  user_id: number;
  name: string;
  asset_type: 'property' | 'vehicle' | 'electronics' | 'jewelry' | 'collectibles';
  purchase_date?: Date;
  purchase_price?: number;
  current_value?: number;
  depreciation_rate?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Debt {
  id: number;
  user_id: number;
  debt_type: 'credit_card' | 'mortgage' | 'personal_loan' | 'auto_loan' | 'paylater' | 'personal';
  creditor: string;
  original_amount: number;
  current_balance: number;
  interest_rate?: number;
  minimum_payment?: number;
  payment_due_date?: number;
  start_date?: Date;
  maturity_date?: Date;
  status: 'active' | 'paid_off';
  created_at: Date;
  updated_at: Date;
  // Calculated fields
  paid_amount?: number;
  remaining_months?: number;
}

export interface CreditCard {
  id: number;
  user_id: number;
  account_id?: number;
  card_name: string;
  bank?: string;
  credit_limit: number;
  current_balance: number;
  statement_date?: number;
  due_date?: number;
  interest_rate?: number;
  rewards_program?: string;
  points_earned: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Calculated fields
  available_credit?: number;
  utilization_rate?: number;
}

export interface DashboardStats {
  total_income: number;
  total_expenses: number;
  net_cashflow: number;
  saving_rate: number;
  total_budget: number;
  budget_spent: number;
  budget_remaining: number;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

export interface SpendingByCategory {
  category_name: string;
  category_icon?: string;
  category_color?: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}
