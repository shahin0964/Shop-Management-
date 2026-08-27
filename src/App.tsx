/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ShopProvider } from './context/ShopContext.tsx';
import { ProductProvider } from './context/ProductContext.tsx';
import { InventoryProvider } from './context/InventoryContext.tsx';
import { SalesProvider } from './context/SalesContext.tsx';
import { CustomerProvider } from './context/CustomerContext.tsx';
import { TransferProvider } from './context/TransferContext.tsx';
import { TelecomMfsProvider } from './context/TelecomMfsContext.tsx';
import { ExpenseProvider } from './context/ExpenseContext.tsx';
import { ReportProvider } from './context/ReportContext.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { AndroidAppShell } from './components/android/AndroidAppShell.tsx';
import { WindowsAppShell } from './components/windows/WindowsAppShell.tsx';
import { type NavigationTab } from './components/layout/Sidebar.tsx';
import { type PlatformMode } from './types/platform.ts';
import { AuthView } from './components/views/AuthView.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { SalesView } from './components/views/SalesView.tsx';
import { ShopsView } from './components/views/ShopsView.tsx';
import { ProductsView } from './components/views/ProductsView.tsx';
import { InventoryView } from './components/views/InventoryView.tsx';
import { TransfersView } from './components/views/TransfersView.tsx';
import { CustomersView } from './components/customers/CustomersView.tsx';
import { TelecomMfsView } from './components/views/TelecomMfsView.tsx';
import { ExpenseView } from './components/views/ExpenseView.tsx';
import { FinancialReportView } from './components/views/FinancialReportView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [platformMode, setPlatformMode] = useState<PlatformMode>(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      
      // 1. Android/Capacitor Detection
      // @ts-ignore
      if (window.Capacitor?.isNativePlatform || 
          // @ts-ignore
          window.Capacitor?.platform === 'android' || 
          ua.includes('capacitor') ||
          ua.includes('android-capacitor')) {
        return 'ANDROID_APK';
      }
      
      // 2. Windows/Tauri Detection
      // @ts-ignore
      if (window.__TAURI__ || 
          // @ts-ignore
          window.__TAURI_INTERNALS__ || 
          ua.includes('tauri')) {
        return 'WINDOWS_EXE';
      }
    }
    return 'WEB';
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            Initializing Shop Management System...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  if (platformMode === 'ANDROID_APK') {
    return <AndroidAppShell />;
  }

  if (platformMode === 'WINDOWS_EXE') {
    return <WindowsAppShell />;
  }

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
    >
      {currentTab === 'dashboard' && <DashboardView onNavigateToShops={() => setCurrentTab('shops')} />}
      {currentTab === 'sales' && <SalesView />}
      {currentTab === 'shops' && <ShopsView />}
      {currentTab === 'products' && <ProductsView />}
      {currentTab === 'inventory' && <InventoryView />}
      {currentTab === 'transfers' && <TransfersView />}
      {currentTab === 'customers' && <CustomersView />}
      {currentTab === 'telecom_mfs' && <TelecomMfsView />}
      {currentTab === 'expenses' && <ExpenseView />}
      {currentTab === 'reports' && <FinancialReportView />}
      {currentTab === 'settings' && <SettingsView />}
    </AppShell>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <ProductProvider>
          <InventoryProvider>
            <SalesProvider>
              <CustomerProvider>
                <TransferProvider>
                  <TelecomMfsProvider>
                    <ExpenseProvider>
                      <ReportProvider>
                        <MainApp />
                      </ReportProvider>
                    </ExpenseProvider>
                  </TelecomMfsProvider>
                </TransferProvider>
              </CustomerProvider>
            </SalesProvider>
          </InventoryProvider>
        </ProductProvider>
      </ShopProvider>
    </AuthProvider>
  );
}

