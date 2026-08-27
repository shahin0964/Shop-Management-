/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, Receipt, ArrowRight, Eye, Store, Printer } from 'lucide-react';
import { type Sale } from '../../types/sales.ts';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onViewDetails: (sale: Sale) => void;
  onPrintSale?: (sale: Sale) => void;
}

export const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({
  isOpen,
  onClose,
  sale,
  onViewDetails,
  onPrintSale,
}) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const currency = owner?.currencySymbol || '$';

  if (!sale) return null;

  const totalQtySold = sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Completed"
      description="Transaction processed & inventory deducted"
      maxWidth="md"
    >
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        {/* Success Icon */}
        <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Invoice Number & Branch */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Invoice Number
          </span>
          <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">
            {sale.saleNumber}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            <Store className="w-3 h-3 text-blue-600" />
            <span>{activeShop?.name || 'Current Branch'}</span>
          </p>
        </div>

        {/* Financial Highlights */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex justify-between items-center text-slate-600">
            <span>Items & Quantity Sold</span>
            <span className="font-semibold text-slate-900">
              {sale.items?.length || 0} items ({totalQtySold} pcs)
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Total Payable</span>
            <span className="text-base font-bold text-slate-900">
              {currency} {Number(sale.totalAmount || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Paid via {sale.paymentMethod}</span>
            <span className="font-bold text-emerald-600">
              {currency} {Number(sale.paidAmount || 0).toFixed(2)}
            </span>
          </div>

          {sale.dueAmount > 0 && (
            <div className="flex justify-between items-center text-rose-700 font-bold pt-1 border-t border-slate-200">
              <span>Customer Due</span>
              <span>
                {currency} {Number(sale.dueAmount || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          {onPrintSale && (
            <button
              type="button"
              onClick={() => onPrintSale(sale)}
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Print Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onViewDetails(sale);
            }}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Breakdown</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>Next Sale</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
