/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building2, Layers } from 'lucide-react';
import { useReport } from '../../context/ReportContext.tsx';
import { formatCurrency } from '../../utils/dateReportUtils.ts';

export const MultiShopBreakdownTable: React.FC = () => {
  const { shopSummaries, reportScope, isLoading } = useReport();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-48" />
    );
  }

  if (!shopSummaries || shopSummaries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            {reportScope === 'COMBINED_OWNER' ? (
              <Layers className="w-4 h-4" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {reportScope === 'COMBINED_OWNER'
                ? 'Multi-Branch Comparative Financial Summary'
                : 'Current Branch Overview'}
            </h3>
            <p className="text-xs text-slate-500">
              Per-shop performance metrics breakdown for the active date range
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-3">Shop Branch</th>
              <th className="py-3 px-3 text-right">Sales Revenue</th>
              <th className="py-3 px-3 text-right">COGS (Cost)</th>
              <th className="py-3 px-3 text-right">Gross Profit</th>
              <th className="py-3 px-3 text-right">Expenses</th>
              <th className="py-3 px-3 text-right">Net Profit / Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shopSummaries.map((shop) => {
              const m = shop.metrics;
              return (
                <tr key={shop.shopId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <div>{shop.shopName}</div>
                        <div className="text-[10px] font-mono text-slate-400">#{shop.shopCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900">
                    {formatCurrency(m.totalRevenue)}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {m.totalSalesCount} sales
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700">
                    {formatCurrency(m.totalCogs)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-indigo-950">
                    {formatCurrency(m.grossProfit)}
                    <div className="text-[10px] text-indigo-600 font-bold">
                      {m.grossProfitMargin.toFixed(1)}% margin
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-purple-900">
                    {formatCurrency(m.totalExpenses)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block font-black px-2 py-1 rounded text-xs ${
                        m.isLoss
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {m.isLoss
                        ? `- ${formatCurrency(Math.abs(m.netProfit))}`
                        : formatCurrency(m.netProfit)}
                    </span>
                    <div
                      className={`text-[10px] font-bold mt-0.5 ${
                        m.isLoss ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {m.netProfitMargin.toFixed(1)}% net
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
