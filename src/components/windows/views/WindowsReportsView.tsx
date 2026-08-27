/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useSales } from '../../../context/SalesContext.tsx';
import { useExpense } from '../../../context/ExpenseContext.tsx';
import { useTelecomMfs } from '../../../context/TelecomMfsContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';

export const WindowsReportsView: React.FC = () => {
  const { owner } = useAuth();
  const { sales } = useSales();
  const { expenses } = useExpense();
  const { transactions: telecomTxns } = useTelecomMfs();
  const { customers } = useCustomer();
  const currency = owner?.currencySymbol || '৳';

  const [dateRange, setDateRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  // Calculations
  const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalCostOfGoods = sales.reduce((acc, s) => {
    const itemCost = s.items.reduce((iAcc, item) => iAcc + (item.costPrice || 0) * item.quantity, 0);
    return acc + itemCost;
  }, 0);

  const grossProfit = totalSalesRevenue - totalCostOfGoods;

  const totalExpensesSum = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalTelecomCommission = telecomTxns.reduce((acc, t) => acc + (t.commission || 0), 0);

  const netProfit = grossProfit + totalTelecomCommission - totalExpensesSum;
  const totalDuesReceivable = customers.reduce((acc, c) => acc + (c.currentDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Filter Header */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Financial Profit & Loss Statement</h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setDateRange('TODAY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              dateRange === 'TODAY' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateRange('WEEK')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              dateRange === 'WEEK' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setDateRange('MONTH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              dateRange === 'MONTH' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setDateRange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              dateRange === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Sales */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales Turnover</span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {currency} {totalSalesRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Total invoiced sales turnover</p>
        </div>

        {/* Gross Margin */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Profit Margin</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {currency} {grossProfit.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Total sales revenue minus Cost of Goods Sold (COGS)</p>
        </div>

        {/* Net Bottom Line */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Bottom Line Profit</span>
          <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {currency} {netProfit.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Includes sales margin, MFS commissions minus shop expenses</p>
        </div>
      </div>

      {/* Detailed Breakdown Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Financial Ledger Breakdown</h4>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">(+) Total Invoiced Sales Revenue</span>
            <span className="font-bold text-slate-900 font-mono">{currency} {totalSalesRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">(-) Cost of Goods Sold (COGS)</span>
            <span className="font-bold text-rose-600 font-mono">-{currency} {totalCostOfGoods.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-bold bg-slate-50 p-2 rounded-xl">
            <span className="text-slate-900">(=) Gross Profit Margin</span>
            <span className="text-emerald-700 font-mono">{currency} {grossProfit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">(+) Telecom & MFS Commission Income</span>
            <span className="font-bold text-emerald-600 font-mono">+{currency} {totalTelecomCommission.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 font-medium">
            <span className="text-slate-600">(-) Total Operational Expenses</span>
            <span className="font-bold text-rose-600 font-mono">-{currency} {totalExpensesSum.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 font-black text-sm bg-slate-900 text-white p-3 rounded-xl shadow-xs">
            <span>Net Profit / (Loss)</span>
            <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {currency} {netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
