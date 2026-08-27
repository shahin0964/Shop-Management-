import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShopSelector } from './ShopSelector.tsx';
import { Badge } from '../common/Badge.tsx';

interface HeaderProps {
  viewTitle: string;
  onOpenMobileMenu: () => void;
  onOpenCreateShopModal?: () => void;
  onSwitchToAndroidPlatform?: () => void;
  onSwitchToWindowsPlatform?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewTitle,
  onOpenMobileMenu,
  onOpenCreateShopModal,
  onSwitchToAndroidPlatform,
  onSwitchToWindowsPlatform,
}) => {
  const { user, signOut, isCloudConnected } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left Section: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-normal">Foundation</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium">{viewTitle}</span>
        </div>
      </div>

      {/* Right Section: Shop Selector & User Session */}
      <div className="flex items-center gap-2">
        <ShopSelector onOpenCreateShopModal={onOpenCreateShopModal} />
 
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* User Sign Out Action */}
        <button
          onClick={() => signOut()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Sign out session"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

