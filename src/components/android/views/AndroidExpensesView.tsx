/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useExpense } from '../../../context/ExpenseContext.tsx';
import { DEFAULT_EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '../../../types/expense.ts';

export const AndroidExpensesView: React.FC = () => {
  const { owner } = useAuth();
  const { expenses, recordExpense } = useExpense();
  const currency = owner?.currencySymbol || '৳';

  const [categoryName, setCategoryName] = useState<string>(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(EXPENSE_PAYMENT_METHODS[0]);
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Expense amount must be greater than zero.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Expense Title / Description is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await recordExpense({
        categoryName,
        title,
        amount: amt,
        paymentMethod,
        note,
        expenseDate: new Date().toISOString(),
      });

      setSuccessMsg(`Expense of ${currency} ${amt} recorded successfully!`);
      setTitle('');
      setAmount('');
      setNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Total Expense Summary */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Operational Expense
          </span>
          <div className="text-xl font-black text-white mt-0.5">
            {currency} {totalExpenseAmount.toFixed(2)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* Record Expense Form */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Plus className="w-4 h-4 text-amber-600" />
          <span>Record New Operational Expense</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Shop Rent for August"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category *</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {EXPENSE_PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Amount ({currency}) *</label>
            <input
              type="number"
              min="1"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Optional Note / Ref</label>
            <input
              type="text"
              placeholder="Memo / Voucher number..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-medium border border-emerald-200">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording...' : 'Record Expense'}</span>
          </button>
        </form>
      </div>

      {/* Expense History Feed */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
          Recorded Expense History
        </h4>
        <div className="divide-y divide-slate-100 text-xs">
          {expenses.slice(0, 5).map((exp) => (
            <div key={exp.id} className="py-2.5 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">{exp.title}</div>
                <div className="text-[10px] text-slate-500">
                  {exp.categoryName} • Paid via {exp.paymentMethod}
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-rose-600">
                  - {currency} {exp.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
