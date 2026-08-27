/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DateRangeType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export interface DateRangeFilter {
  type: DateRangeType;
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string;   // ISO date format YYYY-MM-DD
}

export interface FinancialMetrics {
  totalSalesCount: number;
  totalRevenue: number;         // Sum of completed sales totalAmount
  totalCogs: number;            // Sum of (quantity * costPrice) for all sold items
  grossProfit: number;          // totalRevenue - totalCogs
  grossProfitMargin: number;    // (grossProfit / totalRevenue) * 100
  totalExpenses: number;        // Sum of operational expenses
  netProfit: number;            // grossProfit - totalExpenses
  netProfitMargin: number;      // (netProfit / totalRevenue) * 100
  isLoss: boolean;              // true if netProfit < 0
  itemsWithoutCostCount: number;// Number of sold items where historical cost was 0
}

export interface ExpenseCategoryBreakdown {
  categoryName: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PeriodFinancialData {
  dateLabel: string;
  rawDate: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface ShopFinancialSummary {
  shopId: string;
  shopName: string;
  shopCode: string;
  metrics: FinancialMetrics;
}

export interface CombinedOwnerFinancialReport {
  metrics: FinancialMetrics;
  shopSummaries: ShopFinancialSummary[];
  expenseCategoryBreakdown: ExpenseCategoryBreakdown[];
  periodTrend: PeriodFinancialData[];
  dateRangeLabel: string;
}
