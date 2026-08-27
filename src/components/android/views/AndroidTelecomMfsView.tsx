/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useTelecomMfs } from '../../../context/TelecomMfsContext.tsx';
import {
  type TelecomOperator,
  type MfsProvider,
  type MfsTransactionType,
} from '../../../types/telecomMfs.ts';

export const AndroidTelecomMfsView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { recharges, mfsTransactions, recordRecharge, recordMfsTransaction } = useTelecomMfs();
  const currency = owner?.currencySymbol || '৳';

  const [activeTab, setActiveTab] = useState<'FLEXILOAD' | 'MFS'>('FLEXILOAD');

  // Flexiload Form
  const [operator, setOperator] = useState<TelecomOperator>('Grameenphone');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [refNote, setRefNote] = useState('');

  // MFS Form
  const [mfsProvider, setMfsProvider] = useState<MfsProvider>('BKASH');
  const [mfsType, setMfsType] = useState<MfsTransactionType>('CASH_IN');
  const [mfsPhone, setMfsPhone] = useState('');
  const [mfsAmount, setMfsAmount] = useState('');
  const [trxId, setTrxId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFlexiloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMsg('Enter a valid mobile phone number.');
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
      await recordRecharge({
        operator,
        customerPhone: phone,
        amount: amt,
        reference: refNote || `REF-${Date.now().toString().slice(-4)}`,
        note: `Mobile Recharge (${operator})`,
      });

      setSuccessMsg(`Flexiload of ${currency} ${amt} recorded successfully!`);
      setPhone('');
      setAmount('');
      setRefNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record Flexiload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfsPhone || mfsPhone.length < 10) {
      setErrorMsg('Enter a valid customer mobile number.');
      return;
    }
    const amt = Number(mfsAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await recordMfsTransaction({
        provider: mfsProvider,
        type: mfsType,
        customerPhone: mfsPhone,
        amount: amt,
        reference: trxId || `TRX-${Date.now().toString().slice(-6)}`,
        note: `MFS ${mfsType === 'CASH_IN' ? 'Cash In' : 'Cash Out'} (${mfsProvider})`,
      });

      setSuccessMsg(`MFS transaction of ${currency} ${amt} recorded successfully!`);
      setMfsPhone('');
      setMfsAmount('');
      setTrxId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record MFS transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Subtab Switcher */}
      <div className="p-1 bg-slate-200 rounded-2xl flex text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('FLEXILOAD');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
            activeTab === 'FLEXILOAD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Flexiload / Recharge
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('MFS');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
            activeTab === 'MFS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          MFS (bKash / Nagad / Rocket)
        </button>
      </div>

      {/* Form Container */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        {activeTab === 'FLEXILOAD' ? (
          <form onSubmit={handleFlexiloadSubmit} className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-teal-600" />
              <span>Record Mobile Recharge (Flexiload)</span>
            </h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Operator *</label>
              <div className="grid grid-cols-4 gap-1 text-center">
                {(['Grameenphone', 'Banglalink', 'Robi', 'Airtel', 'Teletalk', 'Skitto'] as TelecomOperator[]).map(
                  (op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                        operator === op
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {op}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Phone Number *</label>
              <input
                type="text"
                required
                placeholder="01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Recharge Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference / Note</label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={refNote}
                  onChange={(e) => setRefNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record Flexiload'}</span>
            </button>
          </form>
        ) : (
          /* MFS FORM */
          <form onSubmit={handleMfsSubmit} className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-rose-600" />
              <span>Record Mobile Financial Service (MFS)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">MFS Provider *</label>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {(['BKASH', 'NAGAD', 'ROCKET'] as MfsProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMfsProvider(p)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                        mfsProvider === p
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Type *</label>
                <div className="grid grid-cols-2 gap-1 text-center">
                  <button
                    type="button"
                    onClick={() => setMfsType('CASH_IN')}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                      mfsType === 'CASH_IN'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cash In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMfsType('CASH_OUT')}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                      mfsType === 'CASH_OUT'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cash Out
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Account Phone *</label>
              <input
                type="text"
                required
                placeholder="01712345678"
                value={mfsPhone}
                onChange={(e) => setMfsPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  value={mfsAmount}
                  onChange={(e) => setMfsAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">TrxID / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. 9H7X..."
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record MFS Transaction'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Transaction History Log */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
          Recent Recharge & MFS Records
        </h4>
        <div className="divide-y divide-slate-100 text-xs">
          {recharges.slice(0, 3).map((r) => (
            <div key={r.id} className="py-2.5 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span>Recharge ({r.operator})</span>
                  <span className="text-[10px] font-mono text-slate-500">({r.customerPhone})</span>
                </div>
                <div className="text-[10px] text-slate-400">Ref: {r.reference || 'N/A'}</div>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900">
                  {currency} {r.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          {mfsTransactions.slice(0, 3).map((m) => (
            <div key={m.id} className="py-2.5 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span>
                    MFS {m.provider} ({m.type})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">({m.customerPhone})</span>
                </div>
                <div className="text-[10px] text-slate-400">TrxID: {m.reference || 'N/A'}</div>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900">
                  {currency} {m.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
