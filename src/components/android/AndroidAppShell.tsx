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
        <header className="h-16 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-90 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <div className="font-black text-sm tracking-tight flex items-center gap-1.5 uppercase">
                <span>ShopManager</span>
                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-bold rounded border border-blue-500/30">MOBILE</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Store className="w-2.5 h-2.5" />
                <span>{activeShop?.name || 'Main Branch'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-blue-400">
              {owner?.name?.substring(0, 1).toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        {/* Scrollable Viewport Stage */}
        <main className="flex-1 bg-slate-50 overflow-y-auto overflow-x-hidden">
          <div className="p-4 max-w-md mx-auto">
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
          </div>
        </main>

        {/* Android Bottom Navigation Bar */}
        <nav className="h-16 bg-slate-900 border-t border-slate-800 px-2 flex items-center justify-around text-slate-400 shrink-0 sticky bottom-0 z-30 shadow-2xl">
          <button
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${
              currentTab === 'dashboard' ? 'text-blue-400' : 'hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentTab === 'dashboard' ? 'bg-blue-500/10' : ''}`}>
              <Home className={`w-5 h-5 ${currentTab === 'dashboard' ? 'fill-blue-400/20' : ''}`} />
            </div>
            <span className={`text-[9px] font-bold ${currentTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500'}`}>Home</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('pos')}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${
              currentTab === 'pos' ? 'text-blue-400' : 'hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentTab === 'pos' ? 'bg-blue-500/10' : ''}`}>
              <ShoppingBag className={`w-5 h-5 ${currentTab === 'pos' ? 'fill-blue-400/20' : ''}`} />
            </div>
            <span className={`text-[9px] font-bold ${currentTab === 'pos' ? 'text-blue-400' : 'text-slate-500'}`}>Checkout</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('products')}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${
              currentTab === 'products' ? 'text-blue-400' : 'hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentTab === 'products' ? 'bg-blue-500/10' : ''}`}>
              <Package className={`w-5 h-5 ${currentTab === 'products' ? 'fill-blue-400/20' : ''}`} />
            </div>
            <span className={`text-[9px] font-bold ${currentTab === 'products' ? 'text-blue-400' : 'text-slate-500'}`}>Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('customers')}
            className={`flex-1 flex flex-col items-center gap-1 cursor-pointer transition-all ${
              currentTab === 'customers' ? 'text-blue-400' : 'hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentTab === 'customers' ? 'bg-blue-500/10' : ''}`}>
              <Users className={`w-5 h-5 ${currentTab === 'customers' ? 'fill-blue-400/20' : ''}`} />
            </div>
            <span className={`text-[9px] font-bold ${currentTab === 'customers' ? 'text-blue-400' : 'text-slate-500'}`}>Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 cursor-pointer hover:text-slate-200 transition-all"
          >
            <div className="p-1 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold text-slate-500">More</span>
          </button>
        </nav>
      </div>

      {/* Slide-out Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex transition-all">
          <div className="w-[85%] max-w-sm bg-slate-900 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-lg">
                  {owner?.name?.substring(0, 2).toUpperCase() || 'SH'}
                </div>
                <div>
                  <div className="font-black text-base tracking-tight">{owner?.name || user?.email || 'Store Owner'}</div>
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Admin Account</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authorized Shop Selector in Drawer */}
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                Switch Branch Outlet
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 w-4 h-4 text-blue-400" />
                <select
                  value={activeShop?.id || ''}
                  onChange={(e) => {
                    const s = shops.find((item) => item.id === e.target.value);
                    if (s) setActiveShop(s);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (#{s.code})
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 rotate-90" />
              </div>
            </div>

            {/* Drawer Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary Ops Section */}
              <section>
                <h4 className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Operations</h4>
                <div className="space-y-1">
                  {[
                    { id: 'inventory', label: 'Inventory Hub', icon: Package },
                    { id: 'transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
                    { id: 'telecom_mfs', label: 'Flexiload & MFS', icon: PhoneIcon },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentTab(item.id as AndroidTab);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        currentTab === item.id ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${currentTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Management Section */}
              <section>
                <h4 className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Management</h4>
                <div className="space-y-1">
                  {[
                    { id: 'expenses', label: 'Operational Expenses', icon: DollarSign },
                    { id: 'reports', label: 'P&L Financial Reports', icon: PieChart },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentTab(item.id as AndroidTab);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                        currentTab === item.id ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${currentTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Architecture Section */}
              <section>
                <h4 className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">System</h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsApkModalOpen(true);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full p-3 rounded-xl flex items-center gap-3 text-emerald-400 hover:bg-slate-800/50 transition-colors"
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-bold">Build Architecture</span>
                </button>
              </section>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/30">
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>SIGN OUT WORKSTATION</span>
              </button>
              <div className="text-center mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
                Version 1.0.10 Build #2408
              </div>
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
