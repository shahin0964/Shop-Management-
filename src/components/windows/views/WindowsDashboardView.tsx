/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Plus,
  ArrowLeftRight,
  Smartphone,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useSales } from '../../../context/SalesContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';
import { useExpense } from '../../../context/ExpenseContext.tsx';
import { type WindowsTab } from '../../../types/platform.ts';
import { type Sale } from '../../../types/sales.ts';

interface WindowsDashboardViewProps {
  onNavigateTab: (tab: WindowsTab) => void;
  onOpenPrintSale?: (sale: Sale) => void;
}

export const WindowsDashboardView: React.FC<WindowsDashboardViewProps> = ({
  onNavigateTab,
  onOpenPrintSale,
}) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { products } = useProduct();
  const { sales } = useSales();
  const { customers } = useCustomer();
  const { expenses } = useExpense();
  const currency = owner?.currencySymbol || '৳';

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockAlert && p.isActive !== false);

  const totalDueAmount = customers.reduce((acc, c) => acc + (c.currentDue || 0), 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Workstation Header */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white mt-1">
            {activeShop ? `${activeShop.name} (${activeShop.code})` : 'Main Operations Center'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-shop sales, inventory, and ledger synchronization.
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('pos')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Terminal (F1)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Product (F2)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('customers')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Dues Ledger (F5)</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {currency} {todayRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
              <span className="text-emerald-600 font-bold">{todaySales.length} invoices</span> completed today
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {lowStockProducts.length} <span className="text-xs font-medium text-slate-500">items</span>
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-1">
              Require stock replenishment
            </div>
          </div>
        </div>

        {/* Customer Dues */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Dues
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              {currency} {totalDueAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Outstanding receivable dues
            </div>
          </div>
        </div>

        {/* Operational Expenses */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {currency} {totalExpenses.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Recorded operational costs
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Split: Recent Sales & Stock Alerts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent POS Invoices</h3>
              <p className="text-[11px] text-slate-500">Latest completed sales transactions in this shop branch.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('pos')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View All Sales →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No sales recorded yet. Click POS Terminal to process your first sale.
                    </td>
                  </tr>
                ) : (
                  sales.slice(0, 6).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        #{sale.saleNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-900">
                          {sale.customerName || 'Walk-in Customer'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {currency} {sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {onOpenPrintSale && (
                          <button
                            type="button"
                            onClick={() => onOpenPrintSale(sale)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Print Thermal / A4 Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Sidebar (1 col) */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Stock Watchlist</span>
              </h3>
              <p className="text-[11px] text-slate-500">Products near or below minimum alert levels.</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                All product stock levels are healthy.
              </div>
            ) : (
              lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{prod.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">SKU: #{prod.code}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-600 block">
                      {prod.currentStock} {prod.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">Min: {prod.minStockAlert}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('inventory')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
          >
            Manage Stock & Restock →
          </button>
        </div>
      </div>
    </div>
  );
};
