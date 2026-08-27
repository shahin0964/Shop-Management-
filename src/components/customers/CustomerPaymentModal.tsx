/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { type Customer, type RecordCustomerPaymentInput } from '../../types/customer.ts';
import { type PaymentMethod } from '../../types/sales.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCustomer } from '../../context/CustomerContext.tsx';
import { normalizeCurrencyNumber } from '../../services/productService.ts';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { owner } = useAuth();
  const currency = owner?.currencySymbol || '$';
  const { recordPayment, isProcessingPayment, getCustomerLedger } = useCustomer();

  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const ledger = customer ? getCustomerLedger(customer) : null;
  const currentDue = ledger ? ledger.currentDue : Number(customer?.currentDue || 0);
  const dueSales = ledger ? ledger.customerSales.filter((s) => Number(s.dueAmount || 0) > 0) : [];

  useEffect(() => {
    if (isOpen) {
      setAmountInput(currentDue > 0 ? currentDue.toFixed(2) : '');
      setPaymentMethod('CASH');
      setReference('');
      setNote('');
      setError(null);
    }
  }, [isOpen, customer, currentDue]);

  if (!isOpen || !customer) return null;

  const parsedAmount = Number(amountInput) || 0;
  const isOverpaying = parsedAmount > currentDue;
  const isInvalidAmount = parsedAmount <= 0 || isNaN(parsedAmount);

  // Allocation preview calculation
  let tempRemaining = parsedAmount;
  const previewAllocations = dueSales.map((s) => {
    const saleDue = Number(s.dueAmount || 0);
    const allocated = Math.min(tempRemaining, saleDue);
    tempRemaining = Math.max(0, tempRemaining - allocated);
    return {
      saleNumber: s.saleNumber,
      totalAmount: s.totalAmount,
      previousDue: saleDue,
      allocated,
      remainingDue: saleDue - allocated,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isInvalidAmount) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (isOverpaying) {
      setError(`Payment cannot exceed customer's total outstanding due of ${currency}${currentDue.toFixed(2)}.`);
      return;
    }

    const payload: RecordCustomerPaymentInput = {
      customerId: customer.id,
      amount: parsedAmount,
      paymentMethod,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
    };

    const res = await recordPayment(payload);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to record customer payment.');
    }
  };

  const paymentMethodsList: { id: PaymentMethod; label: string }[] = [
    { id: 'CASH', label: 'Cash' },
    { id: 'BKASH', label: 'bKash' },
    { id: 'NAGAD', label: 'Nagad' },
    { id: 'ROCKET', label: 'Rocket' },
    { id: 'CARD', label: 'Card / POS' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Collect Customer Due Payment</h3>
              <p className="text-xs text-emerald-100 font-medium">
                Customer: <span className="underline">{customer.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Outstanding Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Total Outstanding Due
              </span>
              <span className="text-2xl font-black text-amber-900">
                {currency} {currentDue.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAmountInput(currentDue.toFixed(2))}
              className="text-xs font-bold px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors cursor-pointer"
            >
              Set Full Pay
            </button>
          </div>

          {/* Payment Amount Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Payment Collection Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentDue}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2.5 text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
              {paymentMethodsList.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-2 px-2 rounded-xl font-bold text-center transition-all cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Transaction Ref / TrxID (Optional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Trx98765432"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Receipt Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Partial due settlement"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Automatic Oldest-Due-First Allocation Preview */}
          {dueSales.length > 0 && parsedAmount > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                Automatic FIFO Due Allocation Preview:
              </span>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5 space-y-1.5 text-xs max-h-40 overflow-y-auto divide-y divide-slate-100">
                {previewAllocations.map((alloc) => (
                  <div key={alloc.saleNumber} className="pt-1.5 first:pt-0 flex justify-between items-center text-slate-600">
                    <div>
                      <span className="font-bold text-slate-900">{alloc.saleNumber}</span>
                      <span className="ml-2 text-[11px] text-slate-500">
                        Due: {currency}{alloc.previousDue.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      {alloc.allocated > 0 ? (
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          -{currency}{alloc.allocated.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unchanged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessingPayment}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingPayment || isInvalidAmount || isOverpaying}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                isProcessingPayment || isInvalidAmount || isOverpaying
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Payment ({currency} {parsedAmount.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
