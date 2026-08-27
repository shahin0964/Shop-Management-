import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTelecomMfs } from '../../context/TelecomMfsContext.tsx';
import { MfsProvider, MfsTransactionType } from '../../types/telecomMfs.ts';
import { validatePhoneNumber, validateAmount } from '../../services/telecomMfsService.ts';

interface RecordMfsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

const PROVIDER_OPTIONS: { id: MfsProvider; name: string; bg: string; activeBg: string; text: string; border: string }[] = [
  {
    id: 'BKASH',
    name: 'bKash',
    bg: 'bg-pink-50 hover:bg-pink-100',
    activeBg: 'bg-pink-600 text-white',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  {
    id: 'NAGAD',
    name: 'Nagad',
    bg: 'bg-orange-50 hover:bg-orange-100',
    activeBg: 'bg-orange-600 text-white',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  {
    id: 'ROCKET',
    name: 'Rocket',
    bg: 'bg-purple-50 hover:bg-purple-100',
    activeBg: 'bg-purple-600 text-white',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  {
    id: 'UPAY',
    name: 'Upay',
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    activeBg: 'bg-yellow-600 text-white',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  {
    id: 'OTHER',
    name: 'Other MFS',
    bg: 'bg-slate-50 hover:bg-slate-100',
    activeBg: 'bg-slate-700 text-white',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
];

const TYPE_OPTIONS: { id: MfsTransactionType; label: string; desc: string }[] = [
  { id: 'CASH_IN', label: 'Cash In', desc: 'Shop deposits cash to customer account' },
  { id: 'CASH_OUT', label: 'Cash Out', desc: 'Shop dispenses cash to customer' },
  { id: 'SEND_MONEY', label: 'Send Money', desc: 'Transfer money from shop account' },
  { id: 'RECEIVE_MONEY', label: 'Receive Money', desc: 'Receive money to shop account' },
  { id: 'PAYMENT', label: 'Payment', desc: 'Customer merchant payment to shop' },
];

export const RecordMfsModal: React.FC<RecordMfsModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '৳',
}) => {
  const { recordMfsTransaction, isSubmitting } = useTelecomMfs();

  const [provider, setProvider] = useState<MfsProvider>('BKASH');
  const [type, setType] = useState<MfsTransactionType>('CASH_IN');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const phoneVal = validatePhoneNumber(customerPhone);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Please enter a valid customer mobile number');
      return;
    }

    const numAmount = parseFloat(amount);
    const amtVal = validateAmount(numAmount);
    if (!amtVal.isValid) {
      setFormError(amtVal.error || 'Please enter a valid transaction amount');
      return;
    }

    try {
      await recordMfsTransaction({
        provider,
        type,
        customerPhone: phoneVal.cleaned,
        amount: numAmount,
        reference: reference.trim(),
        note: note.trim(),
      });

      // Reset on success
      setCustomerPhone('');
      setAmount('');
      setReference('');
      setNote('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to record MFS transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-600 flex items-center justify-center text-white shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Record MFS Transaction</h3>
              <p className="text-xs text-slate-400">bKash / Nagad / Rocket financial record</p>
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

          {/* Service Provider */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Provider <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROVIDER_OPTIONS.map((p) => {
                const isSelected = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`p-2.5 rounded-lg text-xs font-bold border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? `${p.activeBg} shadow-xs ring-2 ring-slate-900/20`
                        : `${p.bg} ${p.text} ${p.border}`
                    }`}
                  >
                    <span>{p.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer / Counterparty Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Customer / Counterparty Mobile <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 01812345678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount ({currencySymbol}) <span className="text-red-500">*</span>
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
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-base font-semibold focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
              />
            </div>
          </div>

          {/* External TRX ID / Reference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Transaction ID / TRX ID <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 9B8C7D6A"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono uppercase"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Customer fee 10 TK collected"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
            />
          </div>

          {/* Audit Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This app records financial business accounting entries for shop tracking. No automated money transfer or external MFS API connection is performed.
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
              className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <span>Confirm & Record MFS</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
