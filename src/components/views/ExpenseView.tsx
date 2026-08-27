import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  TrendingDown,
  Tag,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Expense, EXPENSE_PAYMENT_METHODS } from '../../types/expense.ts';
import { RecordExpenseModal } from '../expense/RecordExpenseModal.tsx';
import { EditExpenseModal } from '../expense/EditExpenseModal.tsx';
import { ExpenseDetailModal } from '../expense/ExpenseDetailModal.tsx';
import { AddCategoryModal } from '../expense/AddCategoryModal.tsx';

export const ExpenseView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const {
    expenses,
    categories,
    isLoading,
    error,
    refreshData,
    dailySummary,
    removeExpense,
  } = useExpense();

  const currencySymbol = owner?.currencySymbol || '৳';

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Expense | null>(null);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<Expense | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return expenses.filter((e) => {
      // Search Title or Note
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.createdBy && e.createdBy.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === 'ALL' || e.categoryName === selectedCategory;

      // Payment method filter
      const matchesPayment = selectedPaymentMethod === 'ALL' || e.paymentMethod === selectedPaymentMethod;

      // Date range filter
      let matchesDate = true;
      if (dateRangeFilter === 'TODAY') {
        const eDateStr = new Date(e.expenseDate).toISOString().split('T')[0];
        matchesDate = eDateStr === todayStr;
      } else if (dateRangeFilter === 'MONTH') {
        const d = new Date(e.expenseDate);
        matchesDate = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }

      return matchesSearch && matchesCategory && matchesPayment && matchesDate;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, dateRangeFilter]);

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record? Historical records will be removed.')) {
      return;
    }

    setDeletingId(expenseId);
    try {
      await removeExpense(expenseId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!activeShop) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 my-6 max-w-xl mx-auto shadow-xs">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No Active Branch Selected</h3>
        <p className="text-sm text-slate-500 mt-1">
          Please select a branch or shop from the top branch selector to record and view shop operational expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {activeShop.name} ({activeShop.code})
            </span>
            <span className="text-xs text-slate-400">• Step 10 Expense Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Shop Operational Expense Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record, audit, and track real business expenditures for rent, utility bills, maintenance, and staff expenses
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh Expense Records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4 text-slate-600" />
            <span>Add Custom Category</span>
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expenses Today</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {currencySymbol} {dailySummary.totalExpensesToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dailySummary.expenseCountToday} expense records logged today
          </p>
        </div>

        {/* Card 2: This Month's Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expenses This Month</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {currencySymbol} {dailySummary.totalExpensesThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumulative month-to-date total</p>
        </div>

        {/* Card 3: Categories Available */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {dailySummary.categoryCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Standard &amp; custom categories</p>
        </div>

        {/* Card 4: Total Expense Records */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {expenses.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total expenses for this branch</p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense title, note, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none bg-white"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Date Filter Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setDateRangeFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    dateRangeFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDateRangeFilter('TODAY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    dateRangeFilter === 'TODAY'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateRangeFilter('MONTH')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    dateRangeFilter === 'MONTH'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Category:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment:
                </span>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="ALL">All Payment Methods</option>
                  {EXPENSE_PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Expense Date</th>
                <th className="py-3 px-4">Title / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {isLoading && expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading expense history...</span>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No Expense Records Found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click &quot;Record Expense&quot; to add your first operational cost entry for this branch.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                      {new Date(record.expenseDate).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{record.title}</div>
                      {record.note && (
                        <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs">
                          {record.note}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {record.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {record.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600 text-base whitespace-nowrap">
                      {currencySymbol} {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{record.createdBy}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelectedExpenseForDetail(record)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View Expense Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedExpenseForEdit(record)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete Expense Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RecordExpenseModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        currencySymbol={currencySymbol}
      />

      <EditExpenseModal
        expense={selectedExpenseForEdit}
        onClose={() => setSelectedExpenseForEdit(null)}
        currencySymbol={currencySymbol}
      />

      <ExpenseDetailModal
        expense={selectedExpenseForDetail}
        onClose={() => setSelectedExpenseForDetail(null)}
        currencySymbol={currencySymbol}
        shopName={activeShop.name}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
