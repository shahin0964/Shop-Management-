import React from 'react';
import { X, Smartphone, Calendar, User, Hash, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { TelecomRecharge } from '../../types/telecomMfs.ts';

interface RechargeDetailModalProps {
  recharge: TelecomRecharge | null;
  onClose: () => void;
  currencySymbol?: string;
  shopName?: string;
}

export const RechargeDetailModal: React.FC<RechargeDetailModalProps> = ({
  recharge,
  onClose,
  currencySymbol = '৳',
  shopName,
}) => {
  if (!recharge) return null;

  const formattedDate = new Date(recharge.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Recharge Transaction Details</h3>
              <p className="text-xs text-slate-400 font-mono">{recharge.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Recharge Amount</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-1">
              {currencySymbol} {recharge.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-200/60 text-blue-800 text-[11px] font-semibold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Recorded Financial Record</span>
            </div>
          </div>

          {/* Key Grid */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-400" /> Operator
              </span>
              <span className="font-bold text-slate-900 px-2 py-0.5 bg-white rounded border border-slate-200 text-xs">
                {recharge.operator}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-400" /> Mobile Number
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {recharge.customerPhone}
              </span>
            </div>

            {recharge.reference && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-slate-400" /> Ref / Request ID
                </span>
                <span className="font-mono font-medium text-slate-900 text-xs">
                  {recharge.reference}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Date & Time
              </span>
              <span className="text-slate-800 text-xs">
                {formattedDate}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Recorded By
              </span>
              <span className="text-slate-800 text-xs font-medium">
                {recharge.createdBy}
              </span>
            </div>

            {shopName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" /> Branch
                </span>
                <span className="text-slate-800 text-xs font-medium">
                  {shopName}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {recharge.note && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" /> Note
              </p>
              <p className="text-xs text-slate-800">{recharge.note}</p>
            </div>
          )}

          {/* Action */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
