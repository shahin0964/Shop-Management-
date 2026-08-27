import React from 'react';
import { X, Send, Calendar, User, Hash, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { MfsTransaction } from '../../types/telecomMfs.ts';

interface MfsDetailModalProps {
  mfsTransaction: MfsTransaction | null;
  onClose: () => void;
  currencySymbol?: string;
  shopName?: string;
}

const PROVIDER_THEMES: Record<string, { name: string; bg: string; border: string; text: string; headerBg: string }> = {
  BKASH: { name: 'bKash', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', headerBg: 'bg-pink-600' },
  NAGAD: { name: 'Nagad', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', headerBg: 'bg-orange-600' },
  ROCKET: { name: 'Rocket', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', headerBg: 'bg-purple-600' },
  UPAY: { name: 'Upay', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', headerBg: 'bg-yellow-600' },
  OTHER: { name: 'Other MFS', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', headerBg: 'bg-slate-800' },
};

const TYPE_LABELS: Record<string, string> = {
  CASH_IN: 'Cash In',
  CASH_OUT: 'Cash Out',
  SEND_MONEY: 'Send Money',
  RECEIVE_MONEY: 'Receive Money',
  PAYMENT: 'Payment',
};

export const MfsDetailModal: React.FC<MfsDetailModalProps> = ({
  mfsTransaction,
  onClose,
  currencySymbol = '৳',
  shopName,
}) => {
  if (!mfsTransaction) return null;

  const theme = PROVIDER_THEMES[mfsTransaction.provider] || PROVIDER_THEMES.OTHER;
  const typeLabel = TYPE_LABELS[mfsTransaction.type] || mfsTransaction.type;

  const formattedDate = new Date(mfsTransaction.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className={`px-6 py-4 ${theme.headerBg} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 font-bold text-sm">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">{theme.name} Transaction</h3>
              <p className="text-xs text-white/80 font-mono">{mfsTransaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className={`p-4 ${theme.bg} border ${theme.border} rounded-xl text-center`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {typeLabel} Amount
            </p>
            <p className={`text-3xl font-extrabold ${theme.text} mt-1`}>
              {currencySymbol} {mfsTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 text-[11px] font-bold mt-2 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{typeLabel}</span>
            </div>
          </div>

          {/* Key Grid */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-400" /> Provider
              </span>
              <span className={`font-bold text-xs px-2.5 py-0.5 rounded border ${theme.bg} ${theme.border} ${theme.text}`}>
                {theme.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-400" /> Type
              </span>
              <span className="font-bold text-slate-900 text-xs px-2 py-0.5 bg-white rounded border border-slate-200">
                {typeLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-400" /> Customer Mobile
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {mfsTransaction.customerPhone}
              </span>
            </div>

            {mfsTransaction.reference && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-slate-400" /> TRX ID / Ref
                </span>
                <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {mfsTransaction.reference}
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
                {mfsTransaction.createdBy}
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
          {mfsTransaction.note && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" /> Note
              </p>
              <p className="text-xs text-slate-800">{mfsTransaction.note}</p>
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
