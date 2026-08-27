export interface ExpenseCategory {
  id: string;
  ownerId: string;
  shopId: string;
  name: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  ownerId: string;
  shopId: string;
  categoryId?: string;
  categoryName: string;
  title: string;
  amount: number; // Must be strictly > 0
  expenseDate: string; // ISO String
  paymentMethod: string; // Cash, Bank Transfer, bKash, Nagad, Rocket, Card, Other
  note?: string;
  isActive?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  categoryName: string;
  title: string;
  amount: number;
  expenseDate?: string;
  paymentMethod?: string;
  note?: string;
}

export interface UpdateExpenseInput {
  categoryName?: string;
  title?: string;
  amount?: number;
  expenseDate?: string;
  paymentMethod?: string;
  note?: string;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Internet',
  'Transportation',
  'Maintenance',
  'Salary / Employee Expense',
  'Miscellaneous',
] as const;

export const EXPENSE_PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'bKash',
  'Nagad',
  'Rocket',
  'Card',
  'Other',
] as const;
