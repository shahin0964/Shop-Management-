import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, Check, Plus, Layers } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/auth.ts';

interface ShopSelectorProps {
  onOpenCreateShopModal?: () => void;
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({ onOpenCreateShopModal }) => {
  const { shops, activeShopId, activeShop, setActiveShopId } = useShop();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.role === UserRole.OWNER;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (shopId: string | null) => {
    setActiveShopId(shopId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
      >
        <div className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
          {activeShopId ? <Store className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Active Context
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
            {activeShopId ? activeShop?.name || 'Selected Shop' : 'All Branches (Combined)'}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Branch Selector
          </div>

          {/* Combined Option for Owners */}
          {isOwner && (
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                activeShopId === null ? 'bg-slate-100/80 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>All Branches (Combined)</span>
              </div>
              {activeShopId === null && <Check className="w-3.5 h-3.5 text-slate-900" />}
            </button>
          )}

          {/* Shop List */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
            {shops.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No branches created yet
              </div>
            ) : (
              shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => handleSelect(shop.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                    activeShopId === shop.id
                      ? 'bg-slate-100/80 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <div className="truncate font-medium">{shop.name}</div>
                      <div className="text-[10px] text-slate-400">{shop.code}</div>
                    </div>
                  </div>
                  {activeShopId === shop.id && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Quick Create Action for Owners */}
          {isOwner && onOpenCreateShopModal && (
            <div className="p-1.5 border-t border-slate-100 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateShopModal();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 font-medium hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Create New Branch</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
