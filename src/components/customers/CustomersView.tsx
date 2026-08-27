/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Search,
  Filter,
  DollarSign,
  Phone,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import { type Customer, type CustomerPayment } from '../../types/customer.ts';
import { type PrintableDocument } from '../../types/print.ts';
import { buildPaymentPrintDocument } from '../../utils/printDocumentBuilder.ts';
import { useCustomer } from '../../context/CustomerContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { CustomerModal } from './CustomerModal.tsx';
import { CustomerPaymentModal } from './CustomerPaymentModal.tsx';
import { CustomerDetailsModal } from './CustomerDetailsModal.tsx';
import { PrintPreviewModal } from '../print/PrintPreviewModal.tsx';

export const CustomersView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const currency = owner?.currencySymbol || '$';

  const {
    customers,
    activeCustomers,
    dueSummary,
    payments,
    isLoadingCustomers,
    customerError,
    createCustomer,
    updateCustomer,
    deleteOrDeactivateCustomer,
  } = useCustomer();

  // Print Preview state
  const [printableDoc, setPrintableDoc] = useState<PrintableDocument | null>(null);

  const handlePrintPaymentReceipt = (payment: CustomerPayment) => {
    const cust = customers.find((c) => c.id === payment.customerId) || null;
    const doc = buildPaymentPrintDocument(payment, cust, activeShop, currency);
    setPrintableDoc(doc);
  };

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'DUE_ONLY' | 'PAYMENTS'>('ALL');

  // Modal Control States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (filterMode === 'DUE_ONLY') {
      result = result.filter((c) => Number(c.currentDue || 0) > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    return result;
  }, [customers, filterMode, searchQuery]);

  // Handle Save Customer (Create or Update)
  const handleSaveCustomer = async (input: any): Promise<boolean> => {
    setIsSubmitting(true);
    let res;
    if (selectedCustomerForEdit) {
      res = await updateCustomer(selectedCustomerForEdit.id, input);
    } else {
      res = await createCustomer(input);
    }
    setIsSubmitting(false);
    return res.success;
  };

  // Handle Remove or Deactivate Customer
  const handleDeleteCustomer = async (customer: Customer) => {
    const hasDue = Number(customer.currentDue || 0) > 0;
    const confirmMsg = hasDue
      ? `Customer "${customer.name}" has an outstanding due of ${currency}${Number(customer.currentDue).toFixed(2)}. Are you sure you want to deactivate this customer account?`
      : `Are you sure you want to remove or deactivate customer "${customer.name}"?`;

    if (window.confirm(confirmMsg)) {
      const res = await deleteOrDeactivateCustomer(customer.id);
      if (res.success) {
        if (res.action === 'DEACTIVATED') {
          alert(`Customer "${customer.name}" has existing transaction records and was deactivated.`);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customer & Due Ledger Management
          </h1>
          <p className="text-sm text-slate-500">
            Track customer accounts, outstanding invoice dues, and record payment collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedCustomerForEdit(null);
              setIsCustomerModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Add New Customer
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Customers</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {dueSummary.totalCustomers}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Customers with Due</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {dueSummary.totalDueCustomers}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-900 block">Total Outstanding Dues</span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {currency} {dueSummary.totalOutstandingDue.toFixed(2)}
            </span>
          </div>
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-900 block">Collected Payments</span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {currency} {dueSummary.totalCollectedPayments.toFixed(2)}
            </span>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {customerError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{customerError}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Customers ({customers.length})
            </button>
            <button
              onClick={() => setFilterMode('DUE_ONLY')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'DUE_ONLY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Due Customers ({dueSummary.totalDueCustomers})
            </button>
            <button
              onClick={() => setFilterMode('PAYMENTS')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'PAYMENTS'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Payment History ({payments.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Content Body */}
        {filterMode === 'PAYMENTS' ? (
          /* Payment Receipts Log View */
          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700">No Payment Receipts Found</p>
                <p className="text-xs text-slate-500">
                  Payments collected from customers will appear here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount Collected</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {new Date(pay.paymentDate).toLocaleDateString()} {new Date(pay.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {pay.customerName || 'Customer'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        {currency} {Number(pay.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md text-[10px] uppercase">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {pay.reference || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {pay.createdBy}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handlePrintPaymentReceipt(pay)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          title="Print Customer Payment Collection Receipt"
                        >
                          <Printer className="w-3 h-3 text-blue-600" />
                          <span>Print Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Customers List View */
          <div className="overflow-x-auto">
            {isLoadingCustomers ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-medium">Loading customer directory...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700">No Customers Found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No customers matched your search "${searchQuery}".`
                    : filterMode === 'DUE_ONLY'
                    ? 'Great! There are currently no customers with outstanding due balances.'
                    : 'Get started by creating your first customer profile.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4 text-right">Outstanding Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.map((cust) => {
                    const due = Number(cust.currentDue || 0);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center shrink-0 border border-slate-200">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedCustomerForDetails(cust);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer"
                              >
                                {cust.name}
                              </button>
                              {cust.note && (
                                <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {cust.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {cust.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cust.phone}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {cust.address || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {due > 0 ? (
                            <span className="inline-flex items-center gap-1 font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                              {currency} {due.toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                              Paid / Clean
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              cust.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {cust.isActive !== false ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {due > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedCustomerForPayment(cust);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Record payment collection"
                              >
                                <Receipt className="w-3 h-3" />
                                Collect Pay
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedCustomerForDetails(cust);
                                setIsDetailsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="View Customer Ledger & Sales History"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCustomerForEdit(cust);
                                setIsCustomerModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Customer Profile"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteCustomer(cust)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete / Deactivate Customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleSaveCustomer}
        customer={selectedCustomerForEdit}
        isSubmitting={isSubmitting}
      />

      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={selectedCustomerForPayment}
      />

      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        customer={selectedCustomerForDetails}
        onOpenPaymentModal={(cust) => {
          setSelectedCustomerForPayment(cust);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={Boolean(printableDoc)}
        onClose={() => setPrintableDoc(null)}
        document={printableDoc}
      />
    </div>
  );
};
