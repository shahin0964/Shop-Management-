/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Search, Plus, CreditCard, Phone, MapPin, Printer, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';
import { type Customer, type CustomerPayment } from '../../../types/customer.ts';
import { buildPaymentPrintDocument } from '../../../utils/printDocumentBuilder.ts';
import { type PrintableDocument } from '../../../types/print.ts';

interface AndroidCustomersViewProps {
  onOpenPrintDoc?: (doc: PrintableDocument) => void;
}

export const AndroidCustomersView: React.FC<AndroidCustomersViewProps> = ({ onOpenPrintDoc }) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { customers, payments, createCustomer, recordPayment } = useCustomer();
  const currency = owner?.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState('0');

  // Collect Payment Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MFS' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [paymentNote, setPaymentNote] = useState('Due Collection');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));
    const isDue = (c.currentDue || 0) > 0;
    return matchSearch && (!filterDueOnly || isDue);
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createCustomer({
        name,
        phone,
        address,
        note: openingDue !== '0' ? `Initial Due: ${openingDue}` : undefined,
      });
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue('0');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await recordPayment({
        customerId: selectedCustomerId,
        amount: amt,
        paymentMethod,
        note: paymentNote,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record payment');
      }

      const paymentRecord = res.payment;

      setSelectedCustomerId(null);
      setPaymentAmount('');

      if (onOpenPrintDoc && paymentRecord) {
        const printDoc = buildPaymentPrintDocument(
          paymentRecord,
          selectedCustomer,
          activeShop,
          currency
        );
        onOpenPrintDoc(printDoc);
      }
    } catch (err: any) {

      setErrorMsg(err.message || 'Failed to record customer payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Header Controls */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Customer & Due Ledger</h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterDueOnly(!filterDueOnly)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterDueOnly
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Due Only
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-2">
        {filteredCustomers.map((c) => {
          const hasDue = (c.currentDue || 0) > 0;
          return (
            <div
              key={c.id}
              className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                {c.phone && <div className="text-[11px] text-slate-500 font-mono">Phone: {c.phone}</div>}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <div
                    className={`font-black text-sm ${
                      hasDue ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {currency} {(c.currentDue || 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {hasDue ? 'Outstanding Due' : 'Cleared'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setPaymentAmount(c.currentDue?.toString() || '');
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collect Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Collect Customer Payment</h3>
                <p className="text-[10px] text-slate-400">{selectedCustomer.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center">
                <span className="text-rose-800 font-semibold">Current Balance Due:</span>
                <span className="font-black text-sm text-rose-700">
                  {currency} {(selectedCustomer.currentDue || 0).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Collected Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">CASH</option>
                  <option value="MFS">MFS (bKash / Nagad / Rocket)</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Recording...' : 'Record & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Register New Customer</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Uddin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +880 1712 345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Banani, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Due Balance ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={openingDue}
                  onChange={(e) => setOpeningDue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Registering...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
