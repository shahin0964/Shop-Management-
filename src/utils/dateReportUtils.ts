/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DateRangeFilter } from '../types/reports.ts';

export interface DateBounds {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Computes exact local start and end Date objects for a given DateRangeFilter
 */
export function getDateBounds(filter: DateRangeFilter): DateBounds {
  const now = new Date();
  
  // Local start of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  // Local end of today
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter.type) {
    case 'TODAY': {
      const label = `Today (${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      return { start: startOfToday, end: endOfToday, label };
    }

    case 'YESTERDAY': {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      const label = `Yesterday (${startOfYesterday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      return { start: startOfYesterday, end: endOfYesterday, label };
    }

    case 'THIS_WEEK': {
      // Current week starting Monday (or Sunday if day === 0)
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);
      const label = `This Week (${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${endOfToday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      return { start: startOfWeek, end: endOfToday, label };
    }

    case 'THIS_MONTH': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = `This Month (${now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
      return { start: startOfMonth, end: endOfMonth, label };
    }

    case 'CUSTOM': {
      let start = startOfToday;
      let end = endOfToday;

      if (filter.startDate) {
        const [y, m, d] = filter.startDate.split('-').map(Number);
        if (y && m && d) {
          start = new Date(y, m - 1, d, 0, 0, 0, 0);
        }
      }

      if (filter.endDate) {
        const [y, m, d] = filter.endDate.split('-').map(Number);
        if (y && m && d) {
          end = new Date(y, m - 1, d, 23, 59, 59, 999);
        }
      }

      const label = `Custom Period (${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      return { start, end, label };
    }

    default:
      return { start: startOfToday, end: endOfToday, label: 'Today' };
  }
}

/**
 * Checks if a date ISO string falls within specified start and end Date objects
 */
export function isDateInRange(dateIsoString: string, bounds: DateBounds): boolean {
  if (!dateIsoString) return false;
  const d = new Date(dateIsoString);
  const time = d.getTime();
  return !isNaN(time) && time >= bounds.start.getTime() && time <= bounds.end.getTime();
}

/**
 * Format currency with 2 decimal places and rounding guard
 */
export function formatCurrency(amount: number, symbol: string = '৳'): string {
  const normalized = Math.round((Number(amount) || 0) * 100) / 100;
  return `${symbol} ${normalized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
