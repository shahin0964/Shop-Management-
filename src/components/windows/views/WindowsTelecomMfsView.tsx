/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Send, ArrowUpRight, ArrowDownRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useTelecomMfs } from '../../../context/TelecomMfsContext.tsx';

export const WindowsTelecomMfsView: React.FC = () => {
  const { owner } = useAuth();
  const { transactions, recordTransaction } = useTelecomMfs();
  const currency = owner?.currencySymbol || '৳';

  // State
  const [txnCategory, setTxnCategory] = useState<'TELECOM_RECHARGE' | 'MFS'>('TELECOM_RECHARGE');
  const [provider, setProvider] = useState('Grameenphone');
  const [mfsProvider, setMfsProvider] = useState('bKash');
  const [mfsType, setMfsType] = useState<'CASH_IN' | 'CASH_OUT' | 'SEND_MONEY'>('CASH_IN');
  const [mobileNo, setMobileNo] = useState('');
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNo.trim()) {
      setErrorMsg('Mobile number is required.');
      return;
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await recordTransaction({
        category: txnCategory,
        provider: txnCategory === 'TELECOM_RECHARGE' ? provider : mfsProvider,
        mfsType: txnCategory === 'MFS' ? mfsType : undefined,
        mobileNo,
        amount: amt,
        commission: Number(commission) || 0,
      });

      setSuccessMsg(`Transaction of ${currency} ${amt} for ${mobileNo} logged successfully!`);
      setMobileNo('');
      setAmount('');
      setCommission('0');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Transaction Entry Form (5 cols) */}
      <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span>Telecom & Mobile Financial Transaction Workstation</span>
        </h3>

        {/* Category Switcher */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setTxnCategory('TELECOM_RECHARGE')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              txnCategory === 'TELECOM_RECHARGE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Flexiload / Recharge
          </button>
          <button
            type="button"
            onClick={() => setTxnCategory('MFS')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              txnCategory === 'MFS'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            MFS (bKash/Nagad)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {txnCategory === 'TELECOM_RECHARGE' ? (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Telecom Operator</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="Grameenphone">Grameenphone (GP)</option>
                <option value="Robi">Robi</option>
                <option value="Airtel">Airtel</option>
                <option value="Banglalink">Banglalink</option>
                <option value="Teletalk">Teletalk</option>
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">MFS Wallet Provider</label>
                <select
                  value={mfsProvider}
                  onChange={(e) => setMfsProvider(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Upay">Upay</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">MFS Transaction Type</label>
                <select
                  value={mfsType}
                  onChange={(e) => setMfsType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="CASH_IN">Cash In</option>
                  <option value="CASH_OUT">Cash Out</option>
                  <option value="SEND_MONEY">Send Money</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number *</label>
            <input
              type="text"
              required
              placeholder="01712345678"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Commission ({currency})</label>
              <input
                type="number"
                min="0"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-medium border border-emerald-200">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Logging...' : 'Execute Transaction'}</span>
          </button>
        </form>
      </div>

      {/* Transaction Feed (7 cols) */}
      <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Telecom & MFS Audit Feed ({transactions.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Provider / Type</th>
                <th className="py-2.5 px-3">Mobile No</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No telecom or MFS transactions logged.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{txn.provider}</span>
                      {txn.mfsType && (
                        <span className="ml-1 text-[10px] text-slate-500 font-mono">
                          ({txn.mfsType})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {txn.mobileNo}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                      {currency} {txn.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 font-mono">
                      +{currency} {(txn.commission || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
