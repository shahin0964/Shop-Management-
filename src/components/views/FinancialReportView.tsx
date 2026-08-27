/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  Building2,
  Layers,
  ShieldCheck,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRightLeft,
  Smartphone,
} from 'lucide-react';
import { useReport } from '../../context/ReportContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { FinancialDateFilter } from '../reports/FinancialDateFilter.tsx';
import { FinancialSummaryCards } from '../reports/FinancialSummaryCards.tsx';
import { FinancialTrendChart } from '../reports/FinancialTrendChart.tsx';
import { CategoryExpenseBreakdown } from '../reports/CategoryExpenseBreakdown.tsx';
import { MultiShopBreakdownTable } from '../reports/MultiShopBreakdownTable.tsx';

export const FinancialReportView: React.FC = () => {
  const { reportScope, refreshReport, isLoading, error, dateRangeLabel } = useReport();
  const { activeShop, shops } = useShop();
  const { owner } = useAuth();

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 rounded-2xl text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 text-rose-300 rounded-lg backdrop-blur-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Financial Reports & Profit / Loss</h1>
          </div>
          <p className="text-xs text-slate-300">
            Real historical business performance analytics: Revenue − COGS − Operational Expenses = Net Profit / Loss
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-rose-200">
              {reportScope === 'COMBINED_OWNER' ? 'Owner Multi-Branch View' : activeShop?.name || 'Shop View'}
            </div>
            <div className="text-[11px] text-slate-400">{dateRangeLabel}</div>
          </div>

          <button
            onClick={refreshReport}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Error Generating Financial Report:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 1. Date Range & Scope Filter */}
      <FinancialDateFilter />

      {/* 2. Key Financial Summary Metric Cards */}
      <FinancialSummaryCards />

      {/* 3. Performance Trend & Category Expense Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancialTrendChart />
        </div>
        <div>
          <CategoryExpenseBreakdown />
        </div>
      </div>

      {/* 4. Multi-Branch Per-Shop Comparative Breakdown Table */}
      <MultiShopBreakdownTable />
    </div>
  );
};
