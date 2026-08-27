/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useSales } from '../../../context/SalesContext.tsx';
import { useExpense } from '../../../context/ExpenseContext.tsx';
import { useTelecomMfs } from '../../../context/TelecomMfsContext.tsx';

type DateFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

export const AndroidReportsView: React.FC = () => {
  const { owner } = useAuth();
  const { sales } = useSales();
  const { expenses } = useExpense();
  const { transactions } = useTelecomMfs();
  const currency = owner?.currencySymbol || '৳';

  const [dateRange, setDateRange] = useState<DateFilter>('ALL');

  // Filter items by date
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filterByDate = (dateStr: string) => {
    if (dateRange === 'ALL') return true;
    if (dateRange === 'TODAY') return dateStr.startsWith(todayStr);

    const itemDate = new Date(dateStr);
    const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

    if (dateRange === 'WEEK') return diffDays <= 7;
    if (dateRange === 'MONTH') return diffDays <= 30;
    return true;
  };

  const filteredSales = sales.filter((s) => filterByDate(s.createdAt));
  const filteredExpenses = expenses.filter((e) => filterByDate(e.expenseDate));
  const filteredTelecom = transactions.filter((t) => filterByDate(t.createdAt));

  // Calculations
  const salesRevenue = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const telecomCommission = filteredTelecom.reduce(
    (acc, t) => acc + (t.commissionEarned || 0),
    0
  );

  const totalRevenue = salesRevenue + telecomCommission;

  // Calculate COGS
  let cogs = 0;
  filteredSales.forEach((sale) => {
    if (Array.isArray(sale.items)) {
      sale.items.forEach((item) => {
        cogs += (item.costPrice || 0) * (item.quantity || 0);
      });
    }
  });

  const grossProfit = totalRevenue - cogs;
  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  return (
    <div className="space-y-4 pb-20">
      {/* Date Range Selector Chips */}
      <div className="p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex justify-between gap-1 text-xs font-bold">
        {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as DateFilter[]).map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => setDateRange(range)}
            className={`flex-1 py-1.5 rounded-xl text-center transition-all cursor-pointer ${
              dateRange === range
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {range === 'TODAY'
              ? "Today"
              : range === 'WEEK'
              ? '7 Days'
              : range === 'MONTH'
              ? '30 Days'
              : 'All Time'}
          </button>
        ))}
      </div>

      {/* Primary Net Profit Card */}
      <div
        className={`p-4 rounded-2xl text-white shadow-md space-y-2 ${
          netProfit >= 0
            ? 'bg-gradient-to-r from-emerald-900 to-emerald-800 border border-emerald-700'
            : 'bg-gradient-to-r from-rose-900 to-rose-800 border border-rose-700'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider opacity-90">
            Net Profit / (Loss)
          </span>
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
            {netProfit >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-300" />
            )}
          </div>
        </div>

        <div className="text-2xl font-black">
          {currency} {netProfit.toFixed(2)}
        </div>

        <p className="text-[11px] opacity-80">
          Net financial gain after deducting COGS ({currency} {cogs.toFixed(2)}) & expenses ({currency} {totalOperatingExpenses.toFixed(2)})
        </p>
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Total Revenue */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-slate-500 font-bold block">Gross Revenue</span>
          <div className="text-lg font-black text-slate-900">
            {currency} {totalRevenue.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">
            Sales: {currency} {salesRevenue.toFixed(2)} • Comm: {currency} {telecomCommission.toFixed(2)}
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-slate-500 font-bold block">Gross Profit</span>
          <div className="text-lg font-black text-blue-600">
            {currency} {grossProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">Margin: {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0'}%</div>
        </div>

        {/* COGS */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-slate-500 font-bold block">Cost of Goods (COGS)</span>
          <div className="text-lg font-black text-slate-900">
            {currency} {cogs.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">Inventory Cost Value</div>
        </div>

        {/* Operating Expenses */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-slate-500 font-bold block">Total Expenses</span>
          <div className="text-lg font-black text-rose-600">
            {currency} {totalOperatingExpenses.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">Rent, Bills & Wages</div>
        </div>
      </div>

      {/* Summary Note */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1">
        <div className="font-bold text-slate-900">Real Backend Financial Consistency</div>
        <p>
          Calculations use the exact same formula and dataset as the Web platform reports. Changes made on Android automatically refresh financial metrics in real-time.
        </p>
      </div>
    </div>
  );
};
