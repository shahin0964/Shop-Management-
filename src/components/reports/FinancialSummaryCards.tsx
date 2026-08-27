/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Receipt,
  PieChart,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useReport } from '../../context/ReportContext.tsx';
import { formatCurrency } from '../../utils/dateReportUtils.ts';

export const FinancialSummaryCards: React.FC = () => {
  const { metrics, isLoading } = useReport();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  const {
    totalSalesCount,
    totalRevenue,
    totalCogs,
    grossProfit,
    grossProfitMargin,
    totalExpenses,
    netProfit,
    netProfitMargin,
    isLoss,
    itemsWithoutCostCount,
  } = metrics;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Sales Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Revenue</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{totalSalesCount} Completed Sales</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* 2. Cost of Goods Sold (COGS) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">COGS (Product Cost)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalCogs)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Historical Cost Snapshot</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* 3. Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Profit</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
              <PieChart className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl font-extrabold text-indigo-950 tracking-tight">
              {formatCurrency(grossProfit)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Margin:</span>
              <span className="font-extrabold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px]">
                {grossProfitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
        </div>

        {/* 4. Operating Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Shop Operational Costs</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

        {/* 5. Net Profit / Loss */}
        <div
          className={`p-4 rounded-xl border shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group ${
            isLoss
              ? 'bg-rose-50/50 border-rose-200 text-rose-950'
              : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isLoss ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {isLoss ? 'Net Loss' : 'Net Profit'}
            </span>
            <div
              className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${
                isLoss ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl font-black tracking-tight ${
                isLoss ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {isLoss ? `- ${formatCurrency(Math.abs(netProfit))}` : formatCurrency(netProfit)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={isLoss ? 'text-rose-600 font-medium' : 'text-emerald-700 font-medium'}>
                Net Margin:
              </span>
              <span
                className={`font-black px-2 py-0.5 rounded text-[11px] ${
                  isLoss ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {netProfitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 h-1.5 ${
              isLoss ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          />
        </div>
      </div>

      {/* Notice if any sold items were missing cost price */}
      {itemsWithoutCostCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Note on COGS Accuracy:</strong> {itemsWithoutCostCount} sold item(s) in this period had no cost price snapshot recorded during creation. They were calculated with ৳0 cost.
          </span>
        </div>
      )}
    </div>
  );
};
