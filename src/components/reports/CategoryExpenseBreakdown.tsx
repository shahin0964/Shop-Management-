/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tag, Receipt } from 'lucide-react';
import { useReport } from '../../context/ReportContext.tsx';
import { formatCurrency } from '../../utils/dateReportUtils.ts';

export const CategoryExpenseBreakdown: React.FC = () => {
  const { expenseCategoryBreakdown, isLoading } = useReport();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-64" />
    );
  }

  if (!expenseCategoryBreakdown || expenseCategoryBreakdown.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
        <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs font-semibold text-slate-600">No Operational Expenses Logged</p>
        <p className="text-xs text-slate-400">Zero expense entries registered in this date filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
          <Tag className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Expense Category Breakdown</h3>
          <p className="text-xs text-slate-500">Distribution of operational spending</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {expenseCategoryBreakdown.map((cat, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {cat.categoryName}
                <span className="text-[10px] font-semibold text-slate-400">({cat.count} items)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">{formatCurrency(cat.amount)}</span>
                <span className="font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                  {cat.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
