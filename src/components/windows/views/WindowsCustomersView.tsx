/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Search, Plus, DollarSign, Printer, CreditCard, History, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';
import { type Customer } from '../../../types/customer.ts';
import { type PrintableDocument } from '../../../types/print.ts';
import { buildPaymentPrintDocument } from '../../../utils/printDocumentBuilder.ts';

interface WindowsCustomersViewProps {
  onOpenPrintDoc?: (doc: PrintableDocument) => void;
}

export const WindowsCustomersView: React.FC<WindowsCustomersViewProps> = ({ onOpenPrintDoc }) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { customers, payments, createCustomer, recordPayment } = useCustomer();
  const currency = owner?.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');

  // Add Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState('0');

  // Record Payment Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'BANK_TRANSFER'>('CASH');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCustomer = async (e: React.FormEvent) => {
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
      setIsAddCustomerOpen(false);
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue('0');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await recordPayment({
        customerId: selectedCustomerId,
        amount: amt,
        paymentMethod,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record payment');
      }

      const paymentRecord = res.payment;
      const cust = customers.find((c) => c.id === selectedCustomerId);

      setSelectedCustomerId(null);
      setPaymentAmount('');

      // Trigger receipt print if handler exists
      if (onOpenPrintDoc && paymentRecord && cust) {
        const printDoc = buildPaymentPrintDocument(paymentRecord, cust, activeShop, currency);
        onOpenPrintDoc(printDoc);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record customer payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const selectedCust = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-4">
      {/* Desktop Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Customer by Name or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg('');
            setIsAddCustomerOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Customer Ledger Wide Data Table */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-3 text-right">Total Outstanding Due</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No customers registered in ledger.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {cust.phone || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{cust.address || 'N/A'}</td>
                    <td className="py-3 px-3 text-right font-black">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          (cust.currentDue || 0) > 0
                            ? 'bg-rose-50 text-rose-700 font-black border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {currency} {(cust.currentDue || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setPaymentAmount((cust.currentDue || 0) > 0 ? (cust.currentDue || 0).toString() : '');
                          setErrorMsg('');
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Collect Due</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register Customer Account</h3>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Chowdhury"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  placeholder="01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="City, area address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Due Balance ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={openingDue}
                  onChange={(e) => setOpeningDue(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg font-medium border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Payment Modal */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Record Payment for {selectedCust.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center">
                <span className="text-rose-800 font-medium">Outstanding Due Balance:</span>
                <span className="font-black text-rose-600 text-base">
                  {currency} {(selectedCust.currentDue || 0).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Collection Amount ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg font-medium border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment & Print'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
