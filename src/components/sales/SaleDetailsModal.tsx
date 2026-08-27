/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  Calendar,
  User,
  Store,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Package,
  Printer,
} from 'lucide-react';
import { type Sale } from '../../types/sales.ts';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';

interface SaleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onPrintSale?: (sale: Sale) => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  isOpen,
  onClose,
  sale,
  onPrintSale,
}) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const currency = owner?.currencySymbol || '$';

  if (!sale) return null;

  const statusColors = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
    DUE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sale Invoice Details: ${sale.saleNumber}`}
      description="Historical transaction snapshot and item breakdown"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-slate-800">
        {/* Top Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Branch / Shop</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeShop?.name || 'Selected Shop'}</span>
            </div>
            <span className="text-[11px] text-slate-500">{activeShop?.code}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Transaction Date</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{new Date(sale.createdAt).toLocaleString()}</span>
            </div>
            <span className="text-[11px] text-slate-500">Processed by: {sale.createdBy}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium block">Payment Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                  statusColors[sale.paymentStatus] || 'bg-slate-100'
                }`}
              >
                {sale.paymentStatus}
              </span>
              <span className="font-semibold text-slate-700 uppercase text-[11px]">
                {sale.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Customer Information */}
        {(sale.customerName || sale.customerPhone || sale.note) && (
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
              {sale.customerName && (
                <div>
                  <span className="text-slate-400">Name: </span>
                  <span className="font-medium">{sale.customerName}</span>
                </div>
              )}
              {sale.customerPhone && (
                <div>
                  <span className="text-slate-400">Phone: </span>
                  <span className="font-medium">{sale.customerPhone}</span>
                </div>
              )}
              {sale.note && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Note: </span>
                  <span className="italic">{sale.note}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sold Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              Line Items ({sale.items?.length || 0})
            </h4>
            <span className="text-[11px] text-slate-400">
              Snapshots captured at time of sale
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Product & SKU</th>
                  <th className="px-3 py-2.5 text-center">Unit</th>
                  <th className="px-3 py-2.5 text-right">Selling Price</th>
                  <th className="px-3 py-2.5 text-center">Qty Sold</th>
                  <th className="px-3 py-2.5 text-right">Cost Ref</th>
                  <th className="px-4 py-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        {item.productCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.productCode}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600">
                        {item.unit || 'pcs'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                        {currency} {Number(item.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-400 font-mono text-[11px]">
                        {currency} {Number(item.costPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                        {currency} {Number(item.lineTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-slate-400">
                      No items recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {currency} {Number(sale.subtotalAmount || 0).toFixed(2)}
              </span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="font-semibold text-rose-600">
                  - {currency} {Number(sale.discountAmount || 0).toFixed(2)}
                </span>
              </div>
            )}

            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / VAT</span>
                <span className="font-semibold text-slate-900">
                  + {currency} {Number(sale.taxAmount || 0).toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
              <span>Total Amount</span>
              <span className="text-base font-black text-blue-600">
                {currency} {Number(sale.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 pt-1">
              <span>Paid Amount</span>
              <span className="font-bold text-emerald-600">
                {currency} {Number(sale.paidAmount || 0).toFixed(2)}
              </span>
            </div>

            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 font-semibold">
                <span>Due Amount</span>
                <span>
                  {currency} {Number(sale.dueAmount || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div>
            {onPrintSale && (
              <button
                type="button"
                onClick={() => onPrintSale(sale)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Reprint Receipt</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
