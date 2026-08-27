/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { useReport } from '../../context/ReportContext.tsx';

export const FinancialTrendChart: React.FC = () => {
  const { periodTrend, isLoading } = useReport();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-80 flex items-center justify-center">
        <span className="text-sm font-semibold text-slate-400">Loading trend charts...</span>
      </div>
    );
  }

  if (!periodTrend || periodTrend.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">No Transaction Data Available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            There are no sales or expense records registered for the selected date range. Try switching your date range filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Financial Performance Breakdown</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Daily aggregation based on actual historical records</span>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={periodTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `৳${val}`}
            />
            <Tooltip
              formatter={(value: number) => [`৳ ${Number(value).toLocaleString()}`, '']}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }}
            />
            <Bar dataKey="revenue" name="Sales Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cogs" name="COGS (Cost)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netProfit" name="Net Profit / Loss" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
