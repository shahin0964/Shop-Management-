import React from 'react';
import {
  Store,
  Layers,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { Badge } from '../common/Badge.tsx';
import { Button } from '../common/Button.tsx';

interface DashboardViewProps {
  onNavigateToShops: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToShops }) => {
  const { owner } = useAuth();
  const { shops, activeShopId, activeShop } = useShop();

  return (
    <div className="space-y-6">
      {/* Top Welcome Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Welcome back! Here is an overview of your retail network and branch operations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={onNavigateToShops}
            leftIcon={<Store className="w-4 h-4" />}
          >
            Manage Branches ({shops.length})
          </Button>
          {shops.length === 0 && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onNavigateToShops}
            >
              Add First Branch
            </Button>
          )}
        </div>
      </div>

      {/* Active Branch Context Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
            {activeShopId ? <Store className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Branch Context
              </span>
              <Badge variant="platform" size="sm">
                {activeShopId ? 'Single Branch View' : 'Combined Owner View'}
              </Badge>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {activeShopId ? activeShop?.name || 'Selected Branch' : 'All Branches (Combined Hierarchy)'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          Registered Branches: <span className="font-semibold text-slate-900">{shops.length}</span>
        </div>
      </div>


    </div>
  );
};
