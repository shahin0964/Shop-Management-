/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';
import {
  DateRangeFilter,
  FinancialMetrics,
  ShopFinancialSummary,
  ExpenseCategoryBreakdown,
  PeriodFinancialData,
} from '../types/reports.ts';
import { ReportService } from '../services/reportService.ts';

export type ReportScope = 'CURRENT_SHOP' | 'COMBINED_OWNER';

interface ReportContextType {
  dateFilter: DateRangeFilter;
  setDateFilter: (filter: DateRangeFilter) => void;
  reportScope: ReportScope;
  setReportScope: (scope: ReportScope) => void;
  metrics: FinancialMetrics | null;
  shopSummaries: ShopFinancialSummary[];
  expenseCategoryBreakdown: ExpenseCategoryBreakdown[];
  periodTrend: PeriodFinancialData[];
  dateRangeLabel: string;
  isLoading: boolean;
  error: string | null;
  refreshReport: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { owner } = useAuth();
  const { activeShop, shops } = useShop();

  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({ type: 'THIS_MONTH' });
  const [reportScope, setReportScope] = useState<ReportScope>('CURRENT_SHOP');

  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [shopSummaries, setShopSummaries] = useState<ShopFinancialSummary[]>([]);
  const [expenseCategoryBreakdown, setExpenseCategoryBreakdown] = useState<ExpenseCategoryBreakdown[]>([]);
  const [periodTrend, setPeriodTrend] = useState<PeriodFinancialData[]>([]);
  const [dateRangeLabel, setDateRangeLabel] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!owner) {
      setMetrics(null);
      setShopSummaries([]);
      setExpenseCategoryBreakdown([]);
      setPeriodTrend([]);
      setDateRangeLabel('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (reportScope === 'COMBINED_OWNER' || !activeShop) {
        // Combined Owner Report across all owner shops
        const combined = await ReportService.getCombinedOwnerReport(owner.id, dateFilter);
        setMetrics(combined.metrics);
        setShopSummaries(combined.shopSummaries);
        setExpenseCategoryBreakdown(combined.expenseCategoryBreakdown);
        setPeriodTrend(combined.periodTrend);
        setDateRangeLabel(combined.dateRangeLabel);
      } else {
        // Single Shop Report
        const shopReport = await ReportService.getShopReport(owner.id, activeShop.id, dateFilter);
        setMetrics(shopReport.metrics);
        setShopSummaries([
          {
            shopId: activeShop.id,
            shopName: activeShop.name,
            shopCode: activeShop.code,
            metrics: shopReport.metrics,
          },
        ]);
        setExpenseCategoryBreakdown(shopReport.categoryBreakdown);
        setPeriodTrend(shopReport.periodTrend);
        setDateRangeLabel(shopReport.dateRangeLabel);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate financial report.';
      setError(msg);
      console.error('[ReportContext] Error loading report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [owner?.id, activeShop?.id, reportScope, dateFilter]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <ReportContext.Provider
      value={{
        dateFilter,
        setDateFilter,
        reportScope,
        setReportScope,
        metrics,
        shopSummaries,
        expenseCategoryBreakdown,
        periodTrend,
        dateRangeLabel,
        isLoading,
        error,
        refreshReport: loadReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}
