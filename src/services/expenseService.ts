import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import {
  Expense,
  ExpenseCategory,
  CreateExpenseInput,
  UpdateExpenseInput,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../types/expense.ts';

const LOCAL_EXPENSES_KEY = (ownerId: string, shopId: string) => `expenses_cache_${ownerId}_${shopId}`;
const LOCAL_CATEGORIES_KEY = (ownerId: string, shopId: string) => `expense_categories_cache_${ownerId}_${shopId}`;

// Idempotency lock set to prevent duplicate accidental creations
const activeExpenseLocks = new Set<string>();

/**
 * Helper to fetch local expenses cache
 */
function getLocalExpenses(ownerId: string, shopId: string): Expense[] {
  try {
    const raw = localStorage.getItem(LOCAL_EXPENSES_KEY(ownerId, shopId));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to read local expenses cache:', err);
    return [];
  }
}

/**
 * Helper to save local expenses cache
 */
function setLocalExpenses(ownerId: string, shopId: string, items: Expense[]): void {
  try {
    localStorage.setItem(LOCAL_EXPENSES_KEY(ownerId, shopId), JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save local expenses cache:', err);
  }
}

/**
 * Helper to fetch custom categories from local storage
 */
function getLocalCustomCategories(ownerId: string, shopId: string): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY(ownerId, shopId));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to read local expense categories cache:', err);
    return [];
  }
}

/**
 * Helper to save custom categories to local storage
 */
function setLocalCustomCategories(ownerId: string, shopId: string, categories: ExpenseCategory[]): void {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY(ownerId, shopId), JSON.stringify(categories));
  } catch (err) {
    console.warn('Failed to save local expense categories cache:', err);
  }
}

/**
 * Fetch all categories for a shop (System defaults + Custom categories)
 */
export async function fetchExpenseCategories(ownerId: string, shopId: string): Promise<string[]> {
  if (!ownerId || !shopId) return [...DEFAULT_EXPENSE_CATEGORIES];

  const categoriesSet = new Set<string>(DEFAULT_EXPENSE_CATEGORIES);

  try {
    const colRef = collection(db, 'owners', ownerId, 'shops', shopId, 'expense_categories');
    const snapshot = await getDocs(colRef);

    const customCats: ExpenseCategory[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as ExpenseCategory;
      if (data.name) {
        categoriesSet.add(data.name.trim());
        customCats.push(data);
      }
    });

    setLocalCustomCategories(ownerId, shopId, customCats);
  } catch (err) {
    console.warn('Using local cache for expense categories due to network/rules:', err);
    const cached = getLocalCustomCategories(ownerId, shopId);
    cached.forEach((c) => categoriesSet.add(c.name.trim()));
  }

  return Array.from(categoriesSet);
}

/**
 * Add a custom expense category for a shop
 */
export async function createCustomCategory(
  ownerId: string,
  shopId: string,
  categoryName: string
): Promise<ExpenseCategory> {
  if (!ownerId || !shopId) {
    throw new Error('Owner ID and Shop ID are required to create a category.');
  }

  const trimmedName = categoryName.trim();
  if (!trimmedName) {
    throw new Error('Expense category name cannot be empty.');
  }

  // Check duplicate
  const existingCategories = await fetchExpenseCategories(ownerId, shopId);
  if (existingCategories.some((c) => c.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error(`Expense category "${trimmedName}" already exists.`);
  }

  const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newCategory: ExpenseCategory = {
    id: categoryId,
    ownerId,
    shopId,
    name: trimmedName,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'owners', ownerId, 'shops', shopId, 'expense_categories', categoryId);
    await setDoc(docRef, {
      ...newCategory,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `owners/${ownerId}/shops/${shopId}/expense_categories/${categoryId}`);
  }

  const localCats = getLocalCustomCategories(ownerId, shopId);
  setLocalCustomCategories(ownerId, shopId, [newCategory, ...localCats]);

  return newCategory;
}

/**
 * Fetch all expenses for a shop ordered by date descending
 */
export async function fetchExpenses(ownerId: string, shopId: string): Promise<Expense[]> {
  if (!ownerId || !shopId) return [];

  try {
    const colRef = collection(db, 'owners', ownerId, 'shops', shopId, 'expenses');
    const q = query(colRef, orderBy('expenseDate', 'desc'));
    const snapshot = await getDocs(q);

    const expenses: Expense[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      expenses.push({
        id: d.id,
        ownerId: data.ownerId || ownerId,
        shopId: data.shopId || shopId,
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || 'Miscellaneous',
        title: data.title || '',
        amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
        expenseDate: data.expenseDate || (data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString()),
        paymentMethod: data.paymentMethod || 'Cash',
        note: data.note || '',
        isActive: data.isActive !== false,
        createdBy: data.createdBy || 'Unknown User',
        createdAt: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
      });
    });

    setLocalExpenses(ownerId, shopId, expenses);
    return expenses;
  } catch (err) {
    console.warn('Falling back to local storage for expenses:', err);
    return getLocalExpenses(ownerId, shopId);
  }
}

/**
 * Record a new expense for a shop
 */
export async function createExpense(
  ownerId: string,
  shopId: string,
  createdBy: string,
  input: CreateExpenseInput
): Promise<Expense> {
  if (!ownerId || !shopId) {
    throw new Error('Active branch/shop selection is required to record an expense.');
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error('Expense title or description is required.');
  }

  const categoryName = input.categoryName.trim();
  if (!categoryName) {
    throw new Error('Expense category selection is required.');
  }

  // Amount strict validation
  const amount = Number(input.amount);
  if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
    throw new Error('Expense amount must be a valid positive number greater than zero.');
  }

  const expenseDate = input.expenseDate ? new Date(input.expenseDate).toISOString() : new Date().toISOString();
  const paymentMethod = input.paymentMethod?.trim() || 'Cash';
  const note = input.note?.trim() || '';

  // Idempotency lock check
  const lockKey = `${ownerId}_${shopId}_${title.toLowerCase()}_${amount}_${expenseDate.substring(0, 16)}`;
  if (activeExpenseLocks.has(lockKey)) {
    throw new Error('A duplicate expense creation is already in progress. Please wait.');
  }

  activeExpenseLocks.add(lockKey);

  try {
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();

    const newExpense: Expense = {
      id: expenseId,
      ownerId,
      shopId,
      categoryName,
      title,
      amount,
      expenseDate,
      paymentMethod,
      note,
      isActive: true,
      createdBy: createdBy || 'Cashier / Manager',
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const docRef = doc(db, 'owners', ownerId, 'shops', shopId, 'expenses', expenseId);

    await setDoc(docRef, {
      ...newExpense,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update local cache
    const existing = getLocalExpenses(ownerId, shopId);
    setLocalExpenses(ownerId, shopId, [newExpense, ...existing]);

    return newExpense;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `owners/${ownerId}/shops/${shopId}/expenses`);
    throw err;
  } finally {
    activeExpenseLocks.delete(lockKey);
  }
}

/**
 * Safely update an existing expense while preserving IDs and Owner/Shop scoping
 */
export async function updateExpense(
  ownerId: string,
  shopId: string,
  expenseId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  if (!ownerId || !shopId || !expenseId) {
    throw new Error('Missing owner, shop, or expense ID for update operation.');
  }

  const existingExpenses = getLocalExpenses(ownerId, shopId);
  const target = existingExpenses.find((e) => e.id === expenseId);

  const updatedTitle = input.title !== undefined ? input.title.trim() : target?.title || '';
  if (!updatedTitle) {
    throw new Error('Expense title cannot be empty.');
  }

  const updatedCategory = input.categoryName !== undefined ? input.categoryName.trim() : target?.categoryName || 'Miscellaneous';
  if (!updatedCategory) {
    throw new Error('Expense category cannot be empty.');
  }

  let updatedAmount = target?.amount || 0;
  if (input.amount !== undefined) {
    const parsedAmount = Number(input.amount);
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Expense amount must be a valid positive number greater than zero.');
    }
    updatedAmount = parsedAmount;
  }

  const updatedDate = input.expenseDate !== undefined ? new Date(input.expenseDate).toISOString() : target?.expenseDate || new Date().toISOString();
  const updatedPaymentMethod = input.paymentMethod !== undefined ? input.paymentMethod.trim() : target?.paymentMethod || 'Cash';
  const updatedNote = input.note !== undefined ? input.note.trim() : target?.note || '';
  const nowISO = new Date().toISOString();

  const updatedExpense: Expense = {
    id: expenseId,
    ownerId,
    shopId,
    categoryId: target?.categoryId || '',
    categoryName: updatedCategory,
    title: updatedTitle,
    amount: updatedAmount,
    expenseDate: updatedDate,
    paymentMethod: updatedPaymentMethod,
    note: updatedNote,
    isActive: target?.isActive !== false,
    createdBy: target?.createdBy || 'User',
    createdAt: target?.createdAt || nowISO,
    updatedAt: nowISO,
  };

  try {
    const docRef = doc(db, 'owners', ownerId, 'shops', shopId, 'expenses', expenseId);
    await updateDoc(docRef, {
      categoryName: updatedCategory,
      title: updatedTitle,
      amount: updatedAmount,
      expenseDate: updatedDate,
      paymentMethod: updatedPaymentMethod,
      note: updatedNote,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `owners/${ownerId}/shops/${shopId}/expenses/${expenseId}`);
  }

  // Update local cache
  const newExpenses = existingExpenses.map((e) => (e.id === expenseId ? updatedExpense : e));
  setLocalExpenses(ownerId, shopId, newExpenses);

  return updatedExpense;
}

/**
 * Safely delete / soft-delete an expense record
 */
export async function deleteExpense(ownerId: string, shopId: string, expenseId: string): Promise<void> {
  if (!ownerId || !shopId || !expenseId) {
    throw new Error('Missing owner, shop, or expense ID for deletion operation.');
  }

  try {
    const docRef = doc(db, 'owners', ownerId, 'shops', shopId, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `owners/${ownerId}/shops/${shopId}/expenses/${expenseId}`);
  }

  const existing = getLocalExpenses(ownerId, shopId);
  const updated = existing.filter((e) => e.id !== expenseId);
  setLocalExpenses(ownerId, shopId, updated);
}
