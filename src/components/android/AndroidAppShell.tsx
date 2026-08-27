/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Menu,
  X,
  Store,
  Home,
  ShoppingBag,
  Package,
  Users,
  ArrowLeftRight,
  Smartphone as PhoneIcon,
  DollarSign,
  PieChart,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Scan,
  Printer,
  ChevronRight,
  Monitor,
  Wifi,
  Battery,
} from 'lucide-react';
import { type AndroidTab, type PlatformMode } from '../../types/platform.ts';
import { type PrintableDocument } from '../../types/print.ts';
import { type Sale } from '../../types/sales.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { buildSalePrintDocument } from '../../utils/printDocumentBuilder.ts';
import { PrintPreviewModal } from '../print/PrintPreviewModal.tsx';
import { AndroidDashboardView } from './views/AndroidDashboardView.tsx';
import { AndroidPosView } from './views/AndroidPosView.tsx';
import { AndroidProductsView } from './views/AndroidProductsView.tsx';
import { AndroidInventoryView } from './views/AndroidInventoryView.tsx';
import { AndroidCustomersView } from './views/AndroidCustomersView.tsx';
import { AndroidTransfersView } from './views/AndroidTransfersView.tsx';
import { AndroidTelecomMfsView } from './views/AndroidTelecomMfsView.tsx';
import { AndroidExpensesView } from './views/AndroidExpensesView.tsx';
import { AndroidReportsView } from './views/AndroidReportsView.tsx';
import { AndroidApkBuildModal } from './views/AndroidApkBuildModal.tsx';

export const AndroidAppShell: React.FC = () => {
  const { user, owner, signOut, isCloudConnected } = useAuth();
  const { shops, activeShop, setActiveShop } = useShop();
  const currency = owner?.currencySymbol || '৳';

  const [currentTab, setCurrentTab] = useState<AndroidTab>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Print Modal State
  const [printableDoc, setPrintableDoc] = useState<PrintableDocument | null>(null);

  const handleOpenPrintSale = (sale: Sale) => {
    const doc = buildSalePrintDocument(sale, activeShop, currency);
    setPrintableDoc(doc);
  };

  const handleOpenPrintDoc = (doc: PrintableDocument) => {
    setPrintableDoc(doc);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Main Android Production Wrapper */}
      <div className="flex-1 h-screen bg-slate-950 overflow-hidden relative flex flex-col">
        {/* Android Top App Bar */}
        <header className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                <span>ShopManager</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Branch: {activeShop?.name || 'Main Branch'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Optional profile or search button could go here */}
          </div>
        </header>

        {/* Scrollable Viewport Stage */}
        <main className="min-h-[580px] bg-slate-100 p-3 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <AndroidDashboardView
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenPrintSale={handleOpenPrintSale}
            />
          )}

          {currentTab === 'pos' && (
            <AndroidPosView onOpenPrintSale={handleOpenPrintSale} />
          )}

          {currentTab === 'products' && <AndroidProductsView />}

          {currentTab === 'inventory' && <AndroidInventoryView />}

          {currentTab === 'customers' && (
            <AndroidCustomersView onOpenPrintDoc={handleOpenPrintDoc} />
          )}

          {currentTab === 'transfers' && <AndroidTransfersView />}

          {currentTab === 'telecom_mfs' && <AndroidTelecomMfsView />}

          {currentTab === 'expenses' && <AndroidExpensesView />}

          {currentTab === 'reports' && <AndroidReportsView />}
        </main>

        {/* Android Bottom Navigation Bar */}
        <nav className="h-16 bg-slate-900 border-t border-slate-800 px-3 flex items-center justify-around text-slate-400 shrink-0 sticky bottom-0 z-30">
          <button
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('pos')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'pos' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">POS</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('products')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'products' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px]">Products</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('customers')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              currentTab === 'customers' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Customers</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center gap-1 cursor-pointer hover:text-slate-200"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </nav>
      </div>

      {/* Slide-out Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex">
          <div className="w-80 max-w-[85vw] bg-slate-900 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  {owner?.name?.substring(0, 2).toUpperCase() || 'SH'}
                </div>
                <div>
                  <div className="font-bold text-sm">{owner?.name || user?.email || 'Store Owner'}</div>
                  <div className="text-[10px] text-slate-400">Owner Account</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authorized Shop Selector in Drawer */}
            <div className="p-4 border-b border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Branch / Shop
              </label>
              <select
                value={activeShop?.id || ''}
                onChange={(e) => {
                  const s = shops.find((item) => item.id === e.target.value);
                  if (s) setActiveShop(s);
                }}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (#{s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('dashboard');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('pos');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'pos' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Android POS Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('products');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'products' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Product Catalog</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('inventory');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'inventory' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Inventory Hub</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('transfers');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'transfers' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Stock Transfers</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('customers');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'customers' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Customer Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('telecom_mfs');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'telecom_mfs' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PhoneIcon className="w-4 h-4" />
                <span>Flexiload & MFS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('expenses');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'expenses' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Operational Expenses</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('reports');
                  setIsDrawerOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 cursor-pointer ${
                  currentTab === 'reports' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>P&L Financial Reports</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsApkModalOpen(true);
                  setIsDrawerOpen(false);
                }}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-emerald-400 hover:bg-slate-800 cursor-pointer font-bold"
              >
                <Smartphone className="w-4 h-4" />
                <span>Android APK Architecture</span>
              </button>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK Spec Inspector Modal */}
      <AndroidApkBuildModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
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
