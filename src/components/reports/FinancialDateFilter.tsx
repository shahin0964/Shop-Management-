/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Filter, Building2, Layers, Check } from 'lucide-react';
import { useReport, ReportScope } from '../../context/ReportContext.tsx';
import { DateRangeType } from '../../types/reports.ts';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const FinancialDateFilter: React.FC = () => {
  const { dateFilter, setDateFilter, reportScope, setReportScope, dateRangeLabel } = useReport();
  const { activeShop, shops } = useShop();
  const { owner } = useAuth();

  const [customStart, setCustomStart] = useState<string>(
    dateFilter.startDate || new Date().toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState<string>(
    dateFilter.endDate || new Date().toISOString().split('T')[0]
  );
  const [showCustomInputs, setShowCustomInputs] = useState<boolean>(dateFilter.type === 'CUSTOM');

  const handleSelectType = (type: DateRangeType) => {
    if (type === 'CUSTOM') {
      setShowCustomInputs(true);
      setDateFilter({
        type: 'CUSTOM',
        startDate: customStart,
        endDate: customEnd,
      });
    } else {
      setShowCustomInputs(false);
      setDateFilter({ type });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setDateFilter({
        type: 'CUSTOM',
        startDate: customStart,
        endDate: customEnd,
      });
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Scope Selector: Single Shop vs Owner Combined Summary */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setReportScope('CURRENT_SHOP')}
            disabled={!activeShop}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              reportScope === 'CURRENT_SHOP'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            } ${!activeShop ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Building2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Branch: {activeShop ? activeShop.name : 'No Branch'}</span>
          </button>

          {owner && shops.length > 1 && (
            <button
              onClick={() => setReportScope('COMBINED_OWNER')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                reportScope === 'COMBINED_OWNER'
                  ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>All Branches ({shops.length} Shops Combined)</span>
            </button>
          )}
        </div>

        {/* Date Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
          <button
            onClick={() => handleSelectType('TODAY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              dateFilter.type === 'TODAY'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleSelectType('YESTERDAY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              dateFilter.type === 'YESTERDAY'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handleSelectType('THIS_WEEK')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              dateFilter.type === 'THIS_WEEK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handleSelectType('THIS_MONTH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              dateFilter.type === 'THIS_MONTH'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handleSelectType('CUSTOM')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              dateFilter.type === 'CUSTOM'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Form (Shown when Custom Range is active) */}
      {showCustomInputs && (
        <form onSubmit={handleApplyCustom} className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Custom Date Range</span>
          </button>
        </form>
      )}

      {/* Active Filter Period Badge */}
      <div className="text-xs text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-100">
        <Calendar className="w-3.5 h-3.5 text-rose-600" />
        <span>Active Period: <strong className="text-slate-800">{dateRangeLabel}</strong></span>
      </div>
    </div>
  );
};
