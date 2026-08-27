import React, { useState } from 'react';
import { X, Smartphone, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTelecomMfs } from '../../context/TelecomMfsContext.tsx';
import { TelecomOperator } from '../../types/telecomMfs.ts';
import { validatePhoneNumber, validateAmount } from '../../services/telecomMfsService.ts';

interface RecordRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

const OPERATOR_OPTIONS: { id: TelecomOperator; name: string; color: string; bg: string }[] = [
  { id: 'Grameenphone', name: 'Grameenphone (GP)', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { id: 'Robi', name: 'Robi', color: 'text-red-600', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
  { id: 'Banglalink', name: 'Banglalink', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { id: 'Airtel', name: 'Airtel', color: 'text-rose-600', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { id: 'Teletalk', name: 'Teletalk', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { id: 'Skitto', name: 'Skitto', color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { id: 'Other', name: 'Other Operator', color: 'text-slate-600', bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
];

export const RecordRechargeModal: React.FC<RecordRechargeModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '৳',
}) => {
  const { recordRecharge, isSubmitting } = useTelecomMfs();

  const [operator, setOperator] = useState<TelecomOperator>('Grameenphone');
  const [customOperator, setCustomOperator] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetOperator = operator === 'Other' ? customOperator.trim() || 'Other' : operator;
    const phoneVal = validatePhoneNumber(customerPhone);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Please enter a valid customer phone number');
      return;
    }

    const numAmount = parseFloat(amount);
    const amtVal = validateAmount(numAmount);
    if (!amtVal.isValid) {
      setFormError(amtVal.error || 'Please enter a valid recharge amount');
      return;
    }

    try {
      await recordRecharge({
        operator: targetOperator,
        customerPhone: phoneVal.cleaned,
        amount: numAmount,
        reference: reference.trim(),
        note: note.trim(),
      });

      // Reset form on success
      setCustomerPhone('');
      setAmount('');
      setReference('');
      setNote('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to record recharge transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Record Mobile Recharge</h3>
              <p className="text-xs text-slate-400">Log mobile load transaction for shop accounting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Operator Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Operator <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OPERATOR_OPTIONS.map((op) => {
                const isSelected = operator === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperator(op.id)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : `${op.bg} text-slate-700`
                    }`}
                  >
                    <span className="truncate">{op.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {operator === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom operator name..."
                value={customOperator}
                onChange={(e) => setCustomOperator(e.target.value)}
                className="mt-2.5 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            )}
          </div>

          {/* Customer Mobile Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Customer Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 01712345678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
            />
          </div>

          {/* Recharge Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Recharge Amount ({currencySymbol}) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Reference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Ref / Request ID <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. TRC-998231"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
            />
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Regular package load"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Audit Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This app logs shop financial records for manual accounting. No live connection or automatic API recharge is performed on the telecom network.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <span>Confirm & Record Recharge</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
