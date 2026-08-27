import React from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  ShoppingBag,
  ArrowLeftRight,
  Users,
  SmartphoneNfc,
  Receipt,
  TrendingUp,
  Settings,
  ShieldCheck,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useSales } from '../../context/SalesContext.tsx';
import { useCustomer } from '../../context/CustomerContext.tsx';
import { cn } from '../../lib/utils.ts';

export type NavigationTab = 'dashboard' | 'sales' | 'products' | 'inventory' | 'transfers' | 'customers' | 'telecom_mfs' | 'expenses' | 'reports' | 'shops' | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { owner, isCloudConnected } = useAuth();
  const { shops } = useShop();
  const { cartItemCount } = useSales();
  const { dueSummary } = useCustomer();

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'sales',
      label: 'POS & Sales',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: cartItemCount > 0 ? `${cartItemCount}` : undefined,
    },
    {
      id: 'products',
      label: 'Product Catalog',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'inventory',
      label: 'Inventory Hub',
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      id: 'transfers',
      label: 'Stock Transfers',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      id: 'customers',
      label: 'Customers & Dues',
      icon: <Users className="w-4 h-4" />,
      badge: dueSummary.totalDueCustomers > 0 ? `${dueSummary.totalDueCustomers}` : undefined,
    },
    {
      id: 'telecom_mfs',
      label: 'Telecom & MFS',
      icon: <SmartphoneNfc className="w-4 h-4" />,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports & P&L',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'shops',
      label: 'Branches & Shops',
      icon: <Store className="w-4 h-4" />,
      badge: shops.length > 0 ? `${shops.length}` : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-400 transition-all duration-200 border-r border-slate-800 lg:static shrink-0',
          isCollapsed ? 'w-18' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Branding */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              {owner?.businessName ? owner.businessName.charAt(0).toUpperCase() : 'S'}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-white font-semibold tracking-tight uppercase text-sm block truncate">
                  {owner?.businessName || 'Shop Manager'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Enterprise v1.0
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Core Foundation
            </div>
          )}
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors cursor-pointer group',
                  isActive
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                  )}
                >
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[11px] font-semibold bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}


        </nav>

        {/* User Identity Panel at Bottom */}
        <div className="p-6 bg-slate-950 mt-auto border-t border-slate-800">
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-white font-semibold shrink-0">
              {owner?.businessName ? owner.businessName.substring(0, 2).toUpperCase() : 'OW'}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">
                  {owner?.businessName || 'Admin User'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">
                  Owner Access
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
