import React, { useState } from 'react';
import { Sidebar, type NavigationTab } from './Sidebar.tsx';
import { Header } from './Header.tsx';
import { Modal } from '../common/Modal.tsx';
import { Input } from '../common/Input.tsx';
import { Button } from '../common/Button.tsx';
import { useShop } from '../../context/ShopContext.tsx';

interface AppShellProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

const TAB_TITLES: Record<NavigationTab, string> = {
  dashboard: 'Executive Overview',
  sales: 'POS Terminal & Sales',
  shops: 'Branches & Shops',
  products: 'Product Catalog',
  inventory: 'Inventory Hub',
  transfers: 'Stock Transfers',
  customers: 'Customer & Due Ledger Management',
  telecom_mfs: 'Telecom Recharge & Mobile Financial Services',
  expenses: 'Shop Operational Expenses',
  reports: 'Profit & Loss & Financial Reports',
  settings: 'System Architecture & Settings',
};

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);

  // Form State for creating a real branch
  const { createShop } = useShop();
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      setErrorMsg('Branch name is required.');
      return;
    }
    if (!branchCode.trim()) {
      setErrorMsg('Branch code is required (e.g. DHK-01).');
      return;
    }

    setIsSubmittingBranch(true);
    setErrorMsg('');
    try {
      await createShop({
        name: branchName,
        code: branchCode,
        address: branchAddress,
        phone: branchPhone,
      });
      setBranchName('');
      setBranchCode('');
      setBranchAddress('');
      setBranchPhone('');
      setIsCreateShopOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create branch');
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row font-sans antialiased text-slate-900 overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          viewTitle={TAB_TITLES[currentTab]}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenCreateShopModal={() => setIsCreateShopOpen(true)}
        />


        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Create Real Branch Modal */}
      <Modal
        isOpen={isCreateShopOpen}
        onClose={() => setIsCreateShopOpen(false)}
        title="Register New Branch / Shop"
        description="Add a physical shop or warehouse under this Owner account."
        maxWidth="md"
      >
        <form onSubmit={handleCreateBranchSubmit} className="space-y-4">
          <Input
            label="Branch / Shop Name"
            placeholder="e.g. Main Outlet, Gulshan Branch"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
          />
          <Input
            label="Branch Code / Identifier"
            placeholder="e.g. DHK-01, CTG-MAIN"
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
            required
            helperText="Unique uppercase identifier for receipts and inventory tracking."
          />
          <Input
            label="Physical Address (Optional)"
            placeholder="e.g. Road 11, Banani, Dhaka"
            value={branchAddress}
            onChange={(e) => setBranchAddress(e.target.value)}
          />
          <Input
            label="Contact Phone (Optional)"
            placeholder="e.g. +880 1712 345678"
            value={branchPhone}
            onChange={(e) => setBranchPhone(e.target.value)}
          />

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCreateShopOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmittingBranch}
            >
              Register Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
