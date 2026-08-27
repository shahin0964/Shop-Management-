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
  const [isMaximized, setIsMaximized] = useState(false);
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
    { id: 'pos', label: 'POS Sales Terminal', icon: ShoppingBag, hotkey: 'F1' },
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
      <div className="flex-1 flex overflow-hidden bg-slate-100">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
          {/* Active Branch Selector */}
          <div className="p-3 border-b border-slate-800">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Active Branch Outlet
            </label>
            <select
              value={activeShop?.id || ''}
              onChange={(e) => {
                const s = shops.find((sh) => sh.id === e.target.value);
                if (s) setActiveShop(s);
              }}
              className="w-full bg-slate-800 text-white font-bold text-xs p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.hotkey && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
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
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="font-bold text-white text-xs truncate">{user?.displayName || 'Workstation Admin'}</div>
              <div className="text-[10px] text-slate-400 font-mono">{owner?.role || 'OWNER'}</div>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Sign Out Workstation"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* View Stage Workspace Container */}
        <main className="flex-1 overflow-y-auto p-6 min-w-0">
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
        </main>
      </div>

      {/* 4. Windows Desktop Status Bar - Removed fake info */}
      <footer className="h-4 bg-slate-900 shrink-0" />

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
