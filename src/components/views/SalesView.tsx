/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  History,
  Search,
  Filter,
  Eye,
  Store,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  Sparkles,
  Printer,
} from 'lucide-react';
import { type Sale, type PaymentStatus, type PaymentMethod } from '../../types/sales.ts';
import { type PrintableDocument } from '../../types/print.ts';
import { buildSalePrintDocument } from '../../utils/printDocumentBuilder.ts';
import { useSales } from '../../context/SalesContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { ProductPicker } from '../sales/ProductPicker.tsx';
import { CartPanel } from '../sales/CartPanel.tsx';
import { SaleDetailsModal } from '../sales/SaleDetailsModal.tsx';
import { SaleSuccessModal } from '../sales/SaleSuccessModal.tsx';
import { PrintPreviewModal } from '../print/PrintPreviewModal.tsx';

type SalesSubTab = 'pos' | 'history';

export const SalesView: React.FC = () => {
  const {
    sales,
    isLoadingSales,
    summary,
    lastCompletedSale,
    clearLastCompletedSale,
    refreshSales,
  } = useSales();

  const { owner } = useAuth();
  const { activeShop, shops, selectShop } = useShop();
  const currency = owner?.currencySymbol || '$';

  const [currentSubTab, setCurrentSubTab] = useState<SalesSubTab>('pos');
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);

  // Printable document preview state
  const [printableDoc, setPrintableDoc] = useState<PrintableDocument | null>(null);

  const handleOpenPrintPreview = (sale: Sale) => {
    const doc = buildSalePrintDocument(sale, activeShop, currency);
    setPrintableDoc(doc);
  };

  // Sales History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  const filteredSales = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return sales.filter((sale) => {
      // Status filter
      if (statusFilter !== 'ALL' && sale.paymentStatus !== statusFilter) {
        return false;
      }
      // Method filter
      if (methodFilter !== 'ALL' && sale.paymentMethod !== methodFilter) {
        return false;
      }
      // Search query
      if (!q) return true;
      const numMatch = sale.saleNumber?.toLowerCase().includes(q);
      const custMatch = sale.customerName?.toLowerCase().includes(q);
      const phoneMatch = sale.customerPhone?.toLowerCase().includes(q);
      const noteMatch = sale.note?.toLowerCase().includes(q);
      const creatorMatch = sale.createdBy?.toLowerCase().includes(q);

      return numMatch || custMatch || phoneMatch || noteMatch || creatorMatch;
    });
  }, [sales, historySearch, statusFilter, methodFilter]);

  const paymentStatusColors: Record<PaymentStatus, string> = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
    DUE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">
              Sales & POS System
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
              Step 5 Core
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Dedicated point of sale register and immutable sales history for{' '}
            <strong className="text-slate-800 font-semibold">{activeShop?.name || 'Selected Shop'}</strong>
          </p>
        </div>

        {/* Sub-tab Pills & Shop Quick Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {shops.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeShop?.id || ''}
                onChange={(e) => selectShop(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setCurrentSubTab('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                currentSubTab === 'pos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>POS Terminal</span>
            </button>
            <button
              onClick={() => setCurrentSubTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                currentSubTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-blue-600" />
              <span>Sales History</span>
              {sales.length > 0 && (
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                  {sales.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* POS Terminal Sub-View */}
      {currentSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Catalog Picker (7 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 h-[740px]">
            <ProductPicker />
          </div>

          {/* Right Column: Register Sale Cart & Checkout Panel (5 cols on lg) */}
          <div className="lg:col-span-5 xl:col-span-4 h-[740px]">
            <CartPanel />
          </div>
        </div>
      )}

      {/* Sales History Sub-View */}
      {currentSubTab === 'history' && (
        <div className="space-y-6">
          {/* KPI Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Today's Sales
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {currency} {summary.todaySalesAmount.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {summary.todaySalesCount} orders
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Total Invoiced Volume
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {currency} {summary.totalSalesAmount.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {summary.totalSalesCount} total
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Total Paid / Collected
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  {currency} {summary.totalPaidAmount.toFixed(2)}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Total Customer Due
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-600">
                  {currency} {summary.totalDueAmount.toFixed(2)}
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
            </div>
          </div>

          {/* History Filters & Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search invoice #, customer..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status & Method Dropdowns */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PAID">PAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="DUE">DUE</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                  <span className="text-slate-400 font-medium">Method:</span>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value as any)}
                    className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">All Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="CARD">Card</option>
                    <option value="DUE_CREDIT">Due / Credit</option>
                    <option value="SPLIT">Split</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Invoice / Sale #</th>
                    <th className="px-3 py-3">Date & Time</th>
                    <th className="px-3 py-3">Customer / Note</th>
                    <th className="px-3 py-3 text-center">Items</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-right">Paid</th>
                    <th className="px-3 py-3 text-right">Due</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Method</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingSales ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Loading sale records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                        <p className="font-semibold text-slate-700">No sale transactions found</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {historySearch || statusFilter !== 'ALL' || methodFilter !== 'ALL'
                            ? 'Try clearing filters to view all sales records.'
                            : 'Perform a checkout in the POS Terminal to generate sales records.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const totalItemsCount =
                        sale.items?.reduce((sum, it) => sum + it.quantity, 0) || 0;

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Invoice # */}
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {sale.saleNumber}
                          </td>

                          {/* Date & Time */}
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                            <div>{new Date(sale.createdAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(sale.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          {/* Customer / Note */}
                          <td className="px-3 py-3 text-slate-700 max-w-[140px] truncate">
                            {sale.customerName ? (
                              <div>
                                <span className="font-medium text-slate-900 block truncate">
                                  {sale.customerName}
                                </span>
                                {sale.customerPhone && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {sale.customerPhone}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Walk-in</span>
                            )}
                          </td>

                          {/* Items Count */}
                          <td className="px-3 py-3 text-center text-slate-700">
                            <span className="font-semibold">{sale.items?.length || 0}</span>
                            <span className="text-slate-400 text-[10px] block">
                              ({totalItemsCount} pcs)
                            </span>
                          </td>

                          {/* Total */}
                          <td className="px-3 py-3 text-right font-bold text-slate-900">
                            {currency} {Number(sale.totalAmount || 0).toFixed(2)}
                          </td>

                          {/* Paid */}
                          <td className="px-3 py-3 text-right font-semibold text-emerald-600">
                            {currency} {Number(sale.paidAmount || 0).toFixed(2)}
                          </td>

                          {/* Due */}
                          <td className="px-3 py-3 text-right">
                            {sale.dueAmount > 0 ? (
                              <span className="font-bold text-rose-600">
                                {currency} {Number(sale.dueAmount || 0).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">0.00</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                paymentStatusColors[sale.paymentStatus] || 'bg-slate-100'
                              }`}
                            >
                              {sale.paymentStatus}
                            </span>
                          </td>

                          {/* Method */}
                          <td className="px-3 py-3 text-center font-semibold text-slate-600 text-[11px] uppercase">
                            {sale.paymentMethod}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenPrintPreview(sale)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Print or Reprint Sales Receipt"
                              >
                                <Printer className="w-3 h-3 text-blue-600" />
                                <span>Print</span>
                              </button>

                              <button
                                onClick={() => setSelectedSaleForDetails(sale)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      <SaleDetailsModal
        isOpen={Boolean(selectedSaleForDetails)}
        onClose={() => setSelectedSaleForDetails(null)}
        sale={selectedSaleForDetails}
        onPrintSale={handleOpenPrintPreview}
      />

      {/* Checkout Success Modal */}
      <SaleSuccessModal
        isOpen={Boolean(lastCompletedSale)}
        onClose={clearLastCompletedSale}
        sale={lastCompletedSale}
        onViewDetails={(sale) => setSelectedSaleForDetails(sale)}
        onPrintSale={handleOpenPrintPreview}
      />

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={Boolean(printableDoc)}
        onClose={() => setPrintableDoc(null)}
        document={printableDoc}
      />
    </div>
  );
};
