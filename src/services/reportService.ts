/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesService } from './salesService.ts';
import { fetchExpenses } from './expenseService.ts';
import { ShopService } from './shopService.ts';
import { type Sale } from '../types/sales.ts';
import { type Expense } from '../types/expense.ts';
import { type Shop } from '../types/shop.ts';
import {
  DateRangeFilter,
  FinancialMetrics,
  ExpenseCategoryBreakdown,
  PeriodFinancialData,
  ShopFinancialSummary,
  CombinedOwnerFinancialReport,
} from '../types/reports.ts';
import { getDateBounds, isDateInRange } from '../utils/dateReportUtils.ts';
import { normalizeCurrencyNumber } from './productService.ts';

export class ReportService {
  /**
   * Calculate financial metrics from arrays of sales and expenses within a date range
   */
  public static calculateMetrics(
    sales: Sale[],
    expenses: Expense[],
    filter: DateRangeFilter
  ): {
    metrics: FinancialMetrics;
    filteredSales: Sale[];
    filteredExpenses: Expense[];
    categoryBreakdown: ExpenseCategoryBreakdown[];
    periodTrend: PeriodFinancialData[];
  } {
    const bounds = getDateBounds(filter);

    // 1. Filter Sales within Date Range
    const filteredSales = sales.filter((s) => isDateInRange(s.createdAt, bounds));

    // 2. Filter Expenses within Date Range
    const filteredExpenses = expenses.filter((e) =>
      isDateInRange(e.expenseDate || e.createdAt, bounds)
    );

    // 3. Compute Revenue, COGS & Sales Metrics
    let totalSalesCount = filteredSales.length;
    let totalRevenue = 0;
    let totalCogs = 0;
    let itemsWithoutCostCount = 0;

    filteredSales.forEach((sale) => {
      totalRevenue = normalizeCurrencyNumber(totalRevenue + (sale.totalAmount || 0));

      if (Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const costPrice = Number(item.costPrice || 0);

          if (costPrice <= 0) {
            itemsWithoutCostCount += 1;
          }

          const itemCogs = normalizeCurrencyNumber(qty * Math.max(0, costPrice));
          totalCogs = normalizeCurrencyNumber(totalCogs + itemCogs);
        });
      }
    });

    const grossProfit = normalizeCurrencyNumber(totalRevenue - totalCogs);
    const grossProfitMargin = totalRevenue > 0
      ? normalizeCurrencyNumber((grossProfit / totalRevenue) * 100)
      : 0;

    // 4. Compute Expenses & Category Breakdown
    let totalExpenses = 0;
    const catMap = new Map<string, { amount: number; count: number }>();

    filteredExpenses.forEach((exp) => {
      const amt = normalizeCurrencyNumber(Number(exp.amount || 0));
      totalExpenses = normalizeCurrencyNumber(totalExpenses + amt);

      const catName = exp.categoryName || 'Miscellaneous';
      const existing = catMap.get(catName) || { amount: 0, count: 0 };
      catMap.set(catName, {
        amount: normalizeCurrencyNumber(existing.amount + amt),
        count: existing.count + 1,
      });
    });

    const categoryBreakdown: ExpenseCategoryBreakdown[] = Array.from(catMap.entries()).map(
      ([categoryName, val]) => ({
        categoryName,
        amount: val.amount,
        percentage: totalExpenses > 0 ? normalizeCurrencyNumber((val.amount / totalExpenses) * 100) : 0,
        count: val.count,
      })
    ).sort((a, b) => b.amount - a.amount);

    // 5. Compute Net Profit / Loss
    const netProfit = normalizeCurrencyNumber(grossProfit - totalExpenses);
    const netProfitMargin = totalRevenue > 0
      ? normalizeCurrencyNumber((netProfit / totalRevenue) * 100)
      : 0;
    const isLoss = netProfit < 0;

    const metrics: FinancialMetrics = {
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
    };

    // 6. Compute Daily/Period Financial Trend
    const dayMap = new Map<string, { revenue: number; cogs: number; expenses: number }>();

    filteredSales.forEach((sale) => {
      const dayKey = sale.createdAt ? sale.createdAt.split('T')[0] : 'Unknown';
      const entry = dayMap.get(dayKey) || { revenue: 0, cogs: 0, expenses: 0 };
      entry.revenue = normalizeCurrencyNumber(entry.revenue + (sale.totalAmount || 0));

      if (Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          entry.cogs = normalizeCurrencyNumber(
            entry.cogs + Number(item.quantity || 0) * Math.max(0, Number(item.costPrice || 0))
          );
        });
      }
      dayMap.set(dayKey, entry);
    });

    filteredExpenses.forEach((exp) => {
      const dayKey = exp.expenseDate
        ? exp.expenseDate.split('T')[0]
        : exp.createdAt
        ? exp.createdAt.split('T')[0]
        : 'Unknown';
      const entry = dayMap.get(dayKey) || { revenue: 0, cogs: 0, expenses: 0 };
      entry.expenses = normalizeCurrencyNumber(entry.expenses + Number(exp.amount || 0));
      dayMap.set(dayKey, entry);
    });

    const periodTrend: PeriodFinancialData[] = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([rawDate, val]) => {
        const d = new Date(rawDate);
        const dateLabel = !isNaN(d.getTime())
          ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : rawDate;
        const gp = normalizeCurrencyNumber(val.revenue - val.cogs);
        const np = normalizeCurrencyNumber(gp - val.expenses);
        return {
          dateLabel,
          rawDate,
          revenue: val.revenue,
          cogs: val.cogs,
          grossProfit: gp,
          expenses: val.expenses,
          netProfit: np,
        };
      });

    return {
      metrics,
      filteredSales,
      filteredExpenses,
      categoryBreakdown,
      periodTrend,
    };
  }

  /**
   * Fetch and generate Financial Report for a specific shop
   */
  public static async getShopReport(
    ownerId: string,
    shopId: string,
    filter: DateRangeFilter
  ): Promise<{
    metrics: FinancialMetrics;
    categoryBreakdown: ExpenseCategoryBreakdown[];
    periodTrend: PeriodFinancialData[];
    dateRangeLabel: string;
  }> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to generate shop financial report.');
    }

    const [sales, expenses] = await Promise.all([
      SalesService.getSales(ownerId, shopId),
      fetchExpenses(ownerId, shopId),
    ]);

    const bounds = getDateBounds(filter);
    const result = this.calculateMetrics(sales, expenses, filter);

    return {
      metrics: result.metrics,
      categoryBreakdown: result.categoryBreakdown,
      periodTrend: result.periodTrend,
      dateRangeLabel: bounds.label,
    };
  }

  /**
   * Fetch and generate Combined Financial Report for an Owner across all their shops
   */
  public static async getCombinedOwnerReport(
    ownerId: string,
    filter: DateRangeFilter
  ): Promise<CombinedOwnerFinancialReport> {
    if (!ownerId) {
      throw new Error('Authenticated owner ID is required for owner-level summary report.');
    }

    const shops: Shop[] = await ShopService.getShops(ownerId);
    const bounds = getDateBounds(filter);

    const shopSummaries: ShopFinancialSummary[] = [];
    let combinedSales: Sale[] = [];
    let combinedExpenses: Expense[] = [];

    // Fetch sales and expenses for all shops owned by this owner
    for (const shop of shops) {
      const [shopSales, shopExpenses] = await Promise.all([
        SalesService.getSales(ownerId, shop.id),
        fetchExpenses(ownerId, shop.id),
      ]);

      const shopMetricsResult = this.calculateMetrics(shopSales, shopExpenses, filter);

      shopSummaries.push({
        shopId: shop.id,
        shopName: shop.name,
        shopCode: shop.code,
        metrics: shopMetricsResult.metrics,
      });

      combinedSales = [...combinedSales, ...shopSales];
      combinedExpenses = [...combinedExpenses, ...shopExpenses];
    }

    const aggregatedResult = this.calculateMetrics(combinedSales, combinedExpenses, filter);

    return {
      metrics: aggregatedResult.metrics,
      shopSummaries,
      expenseCategoryBreakdown: aggregatedResult.categoryBreakdown,
      periodTrend: aggregatedResult.periodTrend,
      dateRangeLabel: bounds.label,
    };
  }
}
