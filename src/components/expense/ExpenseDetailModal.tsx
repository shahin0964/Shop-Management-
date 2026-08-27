import React from 'react';
import { X, Receipt, Calendar, User, FileText, CheckCircle2, Building2, Tag, CreditCard, Clock } from 'lucide-react';
import { Expense } from '../../types/expense.ts';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
  currencySymbol?: string;
  shopName?: string;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  onClose,
  currencySymbol = '৳',
  shopName,
}) => {
  if (!expense) return null;

  const formattedExpenseDate = new Date(expense.expenseDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formattedCreatedDate = new Date(expense.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const formattedUpdatedDate = new Date(expense.updatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Expense Details</h3>
              <p className="text-xs text-slate-400 font-mono">{expense.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-center">
            <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Total Expense Amount</p>
            <p className="text-3xl font-extrabold text-rose-900 mt-1">
              {currencySymbol} {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200/60 text-rose-800 text-[11px] font-semibold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Operational Expense Entry</span>
            </div>
          </div>

          {/* Key Grid */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> Title / Description
              </span>
              <span className="font-bold text-slate-900 text-xs text-right max-w-[200px] truncate">
                {expense.title}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" /> Category
              </span>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                {expense.categoryName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-400" /> Payment Method
              </span>
              <span className="font-bold text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                {expense.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Expense Date
              </span>
              <span className="text-slate-800 text-xs font-medium">
                {formattedExpenseDate}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Recorded By
              </span>
              <span className="text-slate-800 text-xs font-medium">
                {expense.createdBy}
              </span>
            </div>

            {shopName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" /> Branch
                </span>
                <span className="text-slate-800 text-xs font-medium">
                  {shopName}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Created: {formattedCreatedDate}
              </span>
              {expense.updatedAt !== expense.createdAt && (
                <span>Updated: {formattedUpdatedDate}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          {expense.note && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" /> Note / Remarks
              </p>
              <p className="text-xs text-slate-800">{expense.note}</p>
            </div>
          )}

          {/* Action */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
