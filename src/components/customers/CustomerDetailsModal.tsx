/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Receipt,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { type Customer, type CustomerPayment } from '../../types/customer.ts';
import { type Sale } from '../../types/sales.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCustomer } from '../../context/CustomerContext.tsx';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onOpenPaymentModal: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onOpenPaymentModal,
}) => {
  const { owner } = useAuth();
  const currency = owner?.currencySymbol || '$';
  const { getCustomerLedger } = useCustomer();

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');

  if (!isOpen || !customer) return null;

  const ledger = getCustomerLedger(customer);
  const currentDue = ledger.currentDue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-xs">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{customer.name}</h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    customer.isActive !== false
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {customer.isActive !== false ? 'Active Account' : 'Deactivated'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1 truncate max-w-xs">
                    <MapPin className="w-3 h-3" />
                    {customer.address}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentDue > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(customer);
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                Collect Payment
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ledger Summary Cards */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Total Sales Count</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {ledger.totalSalesCount}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Total Invoiced</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {currency} {ledger.totalInvoiced.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Total Settled</span>
            <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
              {currency} {ledger.totalPaid.toFixed(2)}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${currentDue > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-200'}`}>
            <span className="font-medium block text-slate-600">Current Outstanding Due</span>
            <span className={`text-lg font-black mt-0.5 block ${currentDue > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {currency} {currentDue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 bg-white text-xs font-bold">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`pb-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INVOICES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Sales / Invoices ({ledger.customerSales.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`pb-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PAYMENTS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Payment Receipts ({ledger.customerPayments.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'INVOICES' && (
            <div>
              {ledger.customerSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-1">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-600">No Sales History</p>
                  <p className="text-xs text-slate-500">
                    This customer has no registered sales invoices in this shop.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.customerSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{sale.saleNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              sale.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sale.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Invoice Total</span>
                          <span className="font-bold text-slate-900">{currency} {Number(sale.totalAmount).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Amount Settled</span>
                          <span className="font-bold text-emerald-700">{currency} {Number(sale.paidAmount).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Balance Due</span>
                          <span className={`font-bold ${Number(sale.dueAmount) > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                            {currency} {Number(sale.dueAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="text-[11px] text-slate-600 pt-1">
                        <span className="font-semibold text-slate-700">Items ({sale.items?.length || 0}): </span>
                        <span>
                          {sale.items?.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'PAYMENTS' && (
            <div>
              {ledger.customerPayments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-1">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-600">No Payment Receipts</p>
                  <p className="text-xs text-slate-500">
                    No payment collections have been recorded for this customer yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.customerPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700 text-sm">
                            +{currency} {Number(pay.amount).toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md text-[10px] uppercase">
                            {pay.paymentMethod}
                          </span>
                          {pay.reference && (
                            <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                              Ref: {pay.reference}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(pay.paymentDate).toLocaleDateString()} {new Date(pay.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {pay.allocatedSales && pay.allocatedSales.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Settlement Allocations:
                          </span>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                            {pay.allocatedSales.map((alloc) => (
                              <div key={alloc.saleNumber} className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-800">
                                  Sale #{alloc.saleNumber}
                                </span>
                                <span className="font-bold text-emerald-700">
                                  Applied {currency}{Number(alloc.allocatedAmount).toFixed(2)} (Remaining Due: {currency}{Number(alloc.remainingDue).toFixed(2)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
