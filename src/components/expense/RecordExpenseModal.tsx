import React, { useState, useEffect } from 'react';
import { X, Receipt, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext.tsx';
import { EXPENSE_PAYMENT_METHODS } from '../../types/expense.ts';
import { AddCategoryModal } from './AddCategoryModal.tsx';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '৳',
}) => {
  const { categories, recordExpense, isSubmitting } = useExpense();

  const [categoryName, setCategoryName] = useState<string>('Miscellaneous');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [note, setNote] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);

  // Set default expense date to current local datetime format for input
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setExpenseDate(localISO);
      if (categories.length > 0) {
        setCategoryName(categories[0]);
      }
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Please enter an expense title or description.');
      return;
    }

    if (!categoryName) {
      setFormError('Please select an expense category.');
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Expense amount must be a valid number greater than zero.');
      return;
    }

    try {
      await recordExpense({
        categoryName,
        title: trimmedTitle,
        amount: numericAmount,
        expenseDate: expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString(),
        paymentMethod,
        note: note.trim(),
      });

      // Reset & Close
      setTitle('');
      setAmount('');
      setNote('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense entry.';
      setFormError(msg);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-8">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Record Business Expense</h3>
                <p className="text-xs text-slate-400">Log operational shop expenditures and payments</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Category Select + Add Custom Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Expense Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Category</span>
                </button>
              </div>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Title / Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly Shop Rent, Electricity Bill for Aug, Tea & Snacks..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>

            {/* Amount & Payment Method Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount ({currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none cursor-pointer"
                >
                  {EXPENSE_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expense Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Date & Time
              </label>
              <input
                type="datetime-local"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Note / Reference (Optional)
              </label>
              <textarea
                placeholder="Voucher number, invoice details, remarks..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Expenses are recorded directly for the current active shop branch. All amounts are strictly validated (&gt; 0) to ensure financial accounting integrity.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Expense...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Save Expense Entry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onCategoryAdded={(newCat) => setCategoryName(newCat)}
      />
    </>
  );
};
