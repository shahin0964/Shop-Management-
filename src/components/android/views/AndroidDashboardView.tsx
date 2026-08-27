/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Users,
  PlusCircle,
  Scan,
  CreditCard,
  Receipt,
  ArrowRight,
  Store,
  Printer,
  Sparkles,
  Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useSales } from '../../../context/SalesContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';
import { type AndroidTab } from '../../../types/platform.ts';
import { type Sale } from '../../../types/sales.ts';

interface AndroidDashboardViewProps {
  onNavigateTab: (tab: AndroidTab) => void;
  onOpenPrintSale?: (sale: Sale) => void;
}

export const AndroidDashboardView: React.FC<AndroidDashboardViewProps> = ({
  onNavigateTab,
  onOpenPrintSale,
}) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { sales } = useSales();
  const { products } = useProduct();
  const { customers } = useCustomer();
  const currency = owner?.currencySymbol || '৳';

  // Calculate today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const todayCount = todaySales.length;

  // Low stock items
  const lowStockProducts = products.filter(
    (p) => (p.currentStock || 0) <= (p.minStockAlert || 5)
  );

  // Total customer due
  const totalCustomerDue = customers.reduce((acc, c) => acc + (c.currentDue || 0), 0);

  // Recent 5 sales
  const recentSales = [...sales].slice(0, 5);

  return (
    <div className="space-y-4 pb-20">
      {/* Active Branch Banner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
            {activeShop?.code?.substring(0, 3) || 'MAIN'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">{activeShop?.name || 'Main Branch'}</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Code: #{activeShop?.code || 'MAIN'} • Realtime Cloud Sync
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('settings')}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          Switch
        </button>
      </div>

      {/* Touch KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Sales */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {currency} {todayRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
            <span>{todayCount} Completed Sales</span>
          </div>
        </div>

        {/* Total Customer Due */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1 cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customer Due</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {currency} {totalCustomerDue.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-rose-600">
            {customers.filter((c) => (c.currentDue || 0) > 0).length} Due Customers
          </div>
        </div>
      </div>

      {/* Quick Mobile Action Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          Quick Shop Actions
        </h3>

        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            type="button"
            onClick={() => onNavigateTab('pos')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-blue-50 text-slate-700 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-active:scale-95 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-900">POS Sale</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-active:scale-95 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-900">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('customers')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-active:scale-95 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-900">Collect</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('telecom_mfs')}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-active:scale-95 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-900">MFS / Load</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low Stock Alerts ({lowStockProducts.length})</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-amber-200/60 text-xs">
            {lowStockProducts.slice(0, 3).map((item) => (
              <div key={item.id} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <span className="text-[10px] font-mono text-slate-500">SKU: {item.code}</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                    Stock: {item.currentStock} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Recent Branch Sales
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('pos')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            View All
          </button>
        </div>

        {recentSales.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No sales recorded yet today. Tap POS Sale to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>#{sale.saleNumber}</span>
                    <span
                      className={`px-1.5 py-0.2 bg-slate-100 text-[9px] font-bold rounded ${
                        sale.paymentStatus === 'PAID'
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sale.customerName || 'Walk-in'} • {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right font-black text-slate-900">
                    {currency} {sale.totalAmount.toFixed(2)}
                  </div>
                  {onOpenPrintSale && (
                    <button
                      type="button"
                      onClick={() => onOpenPrintSale(sale)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Print Sales Receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
