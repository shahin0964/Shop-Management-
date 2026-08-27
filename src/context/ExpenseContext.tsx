import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';
import {
  Expense,
  ExpenseCategory,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../types/expense.ts';
import {
  fetchExpenses,
  fetchExpenseCategories,
  createExpense,
  updateExpense,
  deleteExpense,
  createCustomCategory,
} from '../services/expenseService.ts';

interface ExpenseSummary {
  totalExpensesToday: number;
  expenseCountToday: number;
  totalExpensesThisMonth: number;
  categoryCount: number;
}

interface ExpenseContextType {
  expenses: Expense[];
  categories: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  dailySummary: ExpenseSummary;
  recordExpense: (input: CreateExpenseInput) => Promise<Expense>;
  editExpense: (expenseId: string, input: UpdateExpenseInput) => Promise<Expense>;
  removeExpense: (expenseId: string) => Promise<void>;
  addCustomCategory: (categoryName: string) => Promise<ExpenseCategory>;
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { owner, userProfile } = useAuth();
  const { activeShop } = useShop();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ownerId = owner?.id || userProfile?.ownerId || '';
  const shopId = activeShop?.id || '';
  const creatorName = userProfile?.displayName || userProfile?.email || 'Shop User';

  // Load data for currently active shop
  const loadData = useCallback(async () => {
    if (!ownerId || !shopId) {
      setExpenses([]);
      setCategories([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [fetchedExpenses, fetchedCats] = await Promise.all([
        fetchExpenses(ownerId, shopId),
        fetchExpenseCategories(ownerId, shopId),
      ]);
      setExpenses(fetchedExpenses);
      setCategories(fetchedCats);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load expense records.';
      setError(msg);
      console.error('Error loading expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute daily & monthly summary
  const dailySummary = useMemo<ExpenseSummary>(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalExpensesToday = 0;
    let expenseCountToday = 0;
    let totalExpensesThisMonth = 0;

    expenses.forEach((e) => {
      const eDate = new Date(e.expenseDate);
      const dateStr = eDate.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        totalExpensesToday += e.amount;
        expenseCountToday += 1;
      }

      if (eDate.getFullYear() === currentYear && eDate.getMonth() === currentMonth) {
        totalExpensesThisMonth += e.amount;
      }
    });

    return {
      totalExpensesToday,
      expenseCountToday,
      totalExpensesThisMonth,
      categoryCount: categories.length,
    };
  }, [expenses, categories]);

  // Actions
  const handleRecordExpense = async (input: CreateExpenseInput): Promise<Expense> => {
    if (!ownerId || !shopId) {
      throw new Error('Please select an active branch/shop first.');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newExp = await createExpense(ownerId, shopId, creatorName, input);
      setExpenses((prev) => [newExp, ...prev]);
      return newExp;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record expense.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (expenseId: string, input: UpdateExpenseInput): Promise<Expense> => {
    if (!ownerId || !shopId) {
      throw new Error('Please select an active branch/shop first.');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedExp = await updateExpense(ownerId, shopId, expenseId, input);
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? updatedExp : e)));
      return updatedExp;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update expense.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveExpense = async (expenseId: string): Promise<void> => {
    if (!ownerId || !shopId) {
      throw new Error('Please select an active branch/shop first.');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteExpense(ownerId, shopId, expenseId);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete expense.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomCategory = async (categoryName: string): Promise<ExpenseCategory> => {
    if (!ownerId || !shopId) {
      throw new Error('Please select an active branch/shop first.');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newCat = await createCustomCategory(ownerId, shopId, categoryName);
      setCategories((prev) => Array.from(new Set([...prev, newCat.name])));
      return newCat;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create expense category.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        categories,
        isLoading,
        isSubmitting,
        error,
        dailySummary,
        recordExpense: handleRecordExpense,
        editExpense: handleEditExpense,
        removeExpense: handleRemoveExpense,
        addCustomCategory: handleAddCustomCategory,
        refreshData: loadData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = (): ExpenseContextType => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return ctx;
};
