/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Monitor,
  Minus,
  Square,
  X,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Warehouse,
  ArrowLeftRight,
  Users,
  Smartphone,
  CreditCard,
  FileText,
  Printer,
  Globe,
  HelpCircle,
  FileCode,
  Building2,
  LogOut,
  ChevronDown,
  Keyboard,
  Maximize2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { type WindowsTab, type PlatformMode } from '../../types/platform.ts';
import { type Sale } from '../../types/sales.ts';
import { type PrintableDocument } from '../../types/print.ts';
import { buildSalePrintDocument } from '../../utils/printDocumentBuilder.ts';

// Windows Views
import { WindowsDashboardView } from './views/WindowsDashboardView.tsx';
import { WindowsPosView } from './views/WindowsPosView.tsx';
import { WindowsProductsView } from './views/WindowsProductsView.tsx';
import { WindowsCategoriesView } from './views/WindowsCategoriesView.tsx';
import { WindowsInventoryView } from './views/WindowsInventoryView.tsx';
import { WindowsCustomersView } from './views/WindowsCustomersView.tsx';
import { WindowsTransfersView } from './views/WindowsTransfersView.tsx';
import { WindowsTelecomMfsView } from './views/WindowsTelecomMfsView.tsx';
import { WindowsExpensesView } from './views/WindowsExpensesView.tsx';
import { WindowsReportsView } from './views/WindowsReportsView.tsx';
import { WindowsExeBuildModal } from './views/WindowsExeBuildModal.tsx';
import { PrintPreviewModal } from '../print/PrintPreviewModal.tsx';

export const WindowsAppShell: React.FC = () => {
  const { user, signOut, owner, isCloudConnected } = useAuth();
  const { activeShop, shops, setActiveShop } = useShop();
  const currency = owner?.currencySymbol || '৳';

  const [currentTab, setCurrentTab] = useState<WindowsTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isExeModalOpen, setIsExeModalOpen] = useState(false);

  // Receipt Print Modal State
  const [activePrintDoc, setActivePrintDoc] = useState<PrintableDocument | null>(null);

  // Keyboard shortcut listener for F1-F11
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing hotkeys inside text inputs if modifier is not pressed
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F1' && !isInput) {
        e.preventDefault();
        setCurrentTab('pos');
      } else if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        setCurrentTab('products');
      } else if (e.key === 'F3' && !isInput) {
        e.preventDefault();
        setCurrentTab('inventory');
      } else if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        setCurrentTab('transfers');
      } else if (e.key === 'F5' && !isInput) {
        e.preventDefault();
        setCurrentTab('customers');
      } else if (e.key === 'F6' && !isInput) {
        e.preventDefault();
        setCurrentTab('telecom_mfs');
      } else if (e.key === 'F7' && !isInput) {
        e.preventDefault();
        setCurrentTab('expenses');
      } else if (e.key === 'F8' && !isInput) {
        e.preventDefault();
        setCurrentTab('reports');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrintSale = (sale: Sale) => {
    const doc = buildSalePrintDocument(sale, activeShop, currency);
    setActivePrintDoc(doc);
  };

  const navItems: { id: WindowsTab; label: string; icon: React.FC<{ className?: string }>; hotkey?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag, hotkey: 'F1' },
    { id: 'products', label: 'Product Catalog', icon: Package, hotkey: 'F2' },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'inventory', label: 'Inventory Hub', icon: Warehouse, hotkey: 'F3' },
    { id: 'transfers', label: 'Stock Transfers', icon: ArrowLeftRight, hotkey: 'F4' },
    { id: 'customers', label: 'Dues & Customers', icon: Users, hotkey: 'F5' },
    { id: 'telecom_mfs', label: 'Telecom & MFS', icon: Smartphone, hotkey: 'F6' },
    { id: 'expenses', label: 'Shop Expenses', icon: CreditCard, hotkey: 'F7' },
    { id: 'reports', label: 'P&L Reports', icon: FileText, hotkey: 'F8' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-900 select-none overflow-hidden">
      {/* 1. Main Windows Workstation Body */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {/* Desktop Sidebar Navigation */}
        <aside 
          className={`bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Workstation Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2 text-white">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="font-black text-sm tracking-tight uppercase">Workstation</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>

          {/* Active Branch Selector */}
          {!isSidebarCollapsed && (
            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
              <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest block mb-2">
                Active Branch Outlet
              </label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-blue-400" />
                <select
                  value={activeShop?.id || ''}
                  onChange={(e) => {
                    const s = shops.find((sh) => sh.id === e.target.value);
                    if (s) setActiveShop(s);
                  }}
                  className="w-full bg-slate-800 text-white font-bold text-[11px] pl-8 pr-2 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner appearance-none cursor-pointer"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentTab(item.id)}
                  title={isSidebarCollapsed ? item.label : ''}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-active:scale-90 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {!isSidebarCollapsed && <span className="text-xs font-bold truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.hotkey && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black ${
                        isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {item.hotkey}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Windows User Session Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-[11px] truncate">{user?.displayName || owner?.name || 'Admin'}</div>
                <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{owner?.role || 'OWNER'}</div>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => signOut()}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer"
                title="Exit Workstation"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* View Stage Workspace Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Professional Workstation Header (App-Internal) */}
          <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Building2 className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest">{activeShop?.name || 'Main Office'}</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <h2 className="font-black text-sm text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                {navItems.find(n => n.id === currentTab)?.label}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cloud Synchronized
              </div>
              <button 
                type="button"
                onClick={() => setIsExeModalOpen(true)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              {currentTab === 'dashboard' && (
                <WindowsDashboardView
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  onOpenPrintSale={handlePrintSale}
                />
              )}
              {currentTab === 'pos' && <WindowsPosView onOpenPrintSale={handlePrintSale} />}
              {currentTab === 'products' && <WindowsProductsView />}
              {currentTab === 'categories' && <WindowsCategoriesView />}
              {currentTab === 'inventory' && <WindowsInventoryView />}
              {currentTab === 'transfers' && <WindowsTransfersView />}
              {currentTab === 'customers' && (
                <WindowsCustomersView onOpenPrintDoc={(doc) => setActivePrintDoc(doc)} />
              )}
              {currentTab === 'telecom_mfs' && <WindowsTelecomMfsView />}
              {currentTab === 'expenses' && <WindowsExpensesView />}
              {currentTab === 'reports' && <WindowsReportsView />}
            </div>
          </main>
        </div>
      </div>

      {/* Real Windows Desktop Footer */}
      <footer className="h-6 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Workstation Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>F-Key Shortcuts Active</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-600">
          BUILD V1.0.10_PRO_WIN
        </div>
      </footer>

      {/* Receipt Thermal/A4 Modal */}
      {activePrintDoc && (
        <PrintPreviewModal
          isOpen={Boolean(activePrintDoc)}
          onClose={() => setActivePrintDoc(null)}
          document={activePrintDoc}
        />
      )}

      {/* EXE Specs Inspector Modal */}
      <WindowsExeBuildModal isOpen={isExeModalOpen} onClose={() => setIsExeModalOpen(false)} />
    </div>
  );
};
