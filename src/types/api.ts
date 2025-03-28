
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  userId: string;
  currency: string;
  theme: string;
  language: string;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MoneySource {
  id: string;
  userId: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';
  currency: string;
  balance: number;
  color?: string;
  icon?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'SAVING';
  color: string;
  icon: string;
  budget?: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  moneySourceId: string;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  attachments?: string[];
  tags?: string[];
  category?: Category;
  moneySource?: MoneySource;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceHistory {
  id: string;
  userId: string;
  moneySourceId: string;
  amount: number;
  balanceAfter: number;
  date: string;
  reason: string;
  moneySource?: MoneySource;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseHistory {
  id: string;
  userId: string;
  expenseId: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  previousData?: Partial<Expense>;
  newData?: Partial<Expense>;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  code: string;
  rate: number;
  name: string;
  date: string;
}

export interface DashboardOverview {
  totalExpenses: number;
  totalIncome: number;
  totalSavings: number;
  netBalance: number;
  period: string;
}

export interface ExpenseTrend {
  period: string;
  expenses: number;
  income: number;
  savings: number;
}

export interface ExpenseComposition {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface BudgetComparison {
  categoryId: string;
  categoryName: string;
  budget: number;
  actual: number;
  difference: number;
  percentageUsed: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
