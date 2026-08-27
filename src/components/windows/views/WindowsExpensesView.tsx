/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditCard, Plus, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useExpense } from '../../../context/ExpenseContext.tsx';

export const WindowsExpensesView: React.FC = () => {
  const { owner } = useAuth();
  const { expenses, recordExpense } = useExpense();
  const currency = owner?.currencySymbol || '৳';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Shop Rent');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Expense title is required.');
      return;
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await recordExpense({
        title,
        categoryName: category,
        amount: amt,
        note,
      });

      setTitle('');
      setAmount('');
      setNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpensesSum = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Expense Form (5 cols) */}
      <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-4 h-4 text-rose-600" />
          <span>Record Shop Operational Expense</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Title / Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Utility electricity bill, Tea & snacks, Staff tea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option value="Shop Rent">Shop Rent</option>
              <option value="Electricity & Utilities">Electricity & Utilities</option>
              <option value="Staff Salary">Staff Salary / Wage</option>
              <option value="Snacks & Entertainment">Snacks & Office Entertainment</option>
              <option value="Maintenance & Repair">Maintenance & Repair</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Amount ({currency}) *</label>
            <input
              type="number"
              min="1"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Additional Note (Optional)</label>
            <input
              type="text"
              placeholder="Voucher or receipt reference..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording...' : 'Log Expense'}</span>
          </button>
        </form>
      </div>

      {/* Expense History Table (7 cols) */}
      <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Recorded Expense Ledger ({expenses.length})
          </h3>
          <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Total: {currency} {totalExpensesSum.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No shop expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.note && <div className="text-[10px] text-slate-400">{exp.note}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600 font-mono">
                      {currency} {exp.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
