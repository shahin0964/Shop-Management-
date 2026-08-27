/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Store, User, Phone, MapPin, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PrintableDocument } from '../../types/print.ts';

interface PrintableReceiptProps {
  document: PrintableDocument;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ document }) => {
  const {
    documentType,
    paperFormat,
    referenceNumber,
    issueDate,
    shop,
    customer,
    createdBy,
    note,
    currencySymbol,
    items = [],
    subtotalAmount = 0,
    discountAmount = 0,
    taxAmount = 0,
    totalAmount = 0,
    paidAmount = 0,
    dueAmount = 0,
    paymentStatus,
    paymentMethod,
    amountCollected = 0,
    remainingCustomerDue,
    paymentAllocation = [],
  } = document;

  const formattedDate = new Date(issueDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(issueDate).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // --------------------------------------------------------------------------
  // 1. THERMAL 80MM RECEIPT LAYOUT
  // --------------------------------------------------------------------------
  if (paperFormat === 'THERMAL_80MM') {
    return (
      <div className="w-[300px] mx-auto bg-white text-black p-4 font-mono text-xs leading-tight tracking-tight selection:bg-slate-200">
        {/* Shop Header */}
        <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
          <div className="text-sm font-black uppercase tracking-wider">{shop.name}</div>
          <div className="text-[10px] font-bold text-gray-700">Branch: {shop.code}</div>
          {shop.address && <div className="text-[10px]">{shop.address}</div>}
          {shop.phone && <div className="text-[10px]">Tel: {shop.phone}</div>}
        </div>

        {/* Document Title & Reference */}
        <div className="text-center py-2 border-b border-dashed border-black">
          <div className="text-xs font-black uppercase tracking-widest">
            {documentType === 'SALES_RECEIPT'
              ? 'SALES RECEIPT'
              : documentType === 'SALES_INVOICE'
              ? 'SALES INVOICE'
              : 'PAYMENT RECEIPT'}
          </div>
          <div className="text-[11px] font-bold mt-0.5">Ref: {referenceNumber}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">
            Date: {formattedDate} {formattedTime}
          </div>
          <div className="text-[10px] text-gray-600">Served By: {createdBy}</div>
        </div>

        {/* Customer Info if exists */}
        {customer && !customer.isWalkIn ? (
          <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
            <div>
              <span className="font-bold">Customer: </span>
              <span>{customer.name || 'Registered Customer'}</span>
            </div>
            {customer.phone && (
              <div>
                <span className="font-bold">Phone: </span>
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-1 border-b border-dashed border-black text-[10px] text-gray-600 text-center italic">
            Customer: Walk-in Sale
          </div>
        )}

        {/* Line Items for Sales */}
        {documentType !== 'CUSTOMER_PAYMENT_RECEIPT' && (
          <div className="py-2 border-b border-dashed border-black">
            <div className="grid grid-cols-12 font-bold text-[10px] border-b border-black pb-1 mb-1">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-4 text-right">Total</span>
            </div>

            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="text-[11px]">
                  <div className="font-bold text-black break-words">{item.productName}</div>
                  <div className="flex justify-between text-[10px] text-gray-800">
                    <span>
                      {item.quantity} {item.unit} x {currencySymbol} {item.unitPrice.toFixed(2)}
                    </span>
                    <span className="font-bold">
                      {currencySymbol} {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals Section for Sales */}
        {documentType !== 'CUSTOMER_PAYMENT_RECEIPT' ? (
          <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>
                {currencySymbol} {subtotalAmount.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>
                  - {currencySymbol} {discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax / VAT:</span>
                <span>
                  + {currencySymbol} {taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-black text-xs pt-1 border-t border-black">
              <span>TOTAL PAYABLE:</span>
              <span>
                {currencySymbol} {totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-gray-800">
              <span>Paid ({paymentMethod || 'CASH'}):</span>
              <span className="font-bold">
                {currencySymbol} {paidAmount.toFixed(2)}
              </span>
            </div>

            {dueAmount > 0 && (
              <div className="flex justify-between font-black text-black pt-0.5">
                <span>REMAINING DUE:</span>
                <span>
                  {currencySymbol} {dueAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Payment Collection Receipt Totals */
          <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[11px]">
            <div className="flex justify-between font-black text-xs">
              <span>AMOUNT PAID:</span>
              <span>
                {currencySymbol} {amountCollected.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-gray-800">
              <span>Payment Method:</span>
              <span className="font-bold uppercase">{paymentMethod}</span>
            </div>

            {remainingCustomerDue !== undefined && (
              <div className="flex justify-between font-bold border-t border-black pt-1">
                <span>Current Total Due:</span>
                <span>
                  {currencySymbol} {remainingCustomerDue.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Note if available */}
        {note && (
          <div className="py-1.5 border-b border-dashed border-black text-[10px] italic text-gray-700">
            Note: {note}
          </div>
        )}

        {/* Receipt Footer */}
        <div className="text-center pt-3 space-y-1 text-[10px] text-gray-800">
          <div className="font-bold uppercase">*** Thank You Very Much ***</div>
          <div>Please preserve this receipt for returns/warranty</div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. STANDARD A4 / LETTER INVOICE LAYOUT
  // --------------------------------------------------------------------------
  return (
    <div className="w-full max-w-3xl mx-auto bg-white text-slate-900 p-8 font-sans leading-normal border border-slate-200 rounded-xl shadow-xs print:shadow-none print:border-none print:p-0">
      {/* Top Invoice Header */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-900 text-white font-black text-lg flex items-center justify-center rounded-lg">
              {shop.code.substring(0, 2) || 'SP'}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{shop.name}</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Branch Code: #{shop.code}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-0.5 pt-1">
            {shop.address && <p>{shop.address}</p>}
            <p>
              {shop.phone && <span>Tel: {shop.phone}</span>}
              {shop.email && <span className="ml-3">Email: {shop.email}</span>}
            </p>
          </div>
        </div>

        {/* Document Meta Box */}
        <div className="text-right space-y-1">
          <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-md inline-block">
            {documentType === 'SALES_RECEIPT'
              ? 'TAX INVOICE / RECEIPT'
              : documentType === 'SALES_INVOICE'
              ? 'OFFICIAL INVOICE'
              : 'PAYMENT RECEIPT'}
          </span>
          <div className="text-sm font-black font-mono text-slate-900 pt-1">#{referenceNumber}</div>
          <div className="text-xs text-slate-500">Date: {formattedDate}</div>
          <div className="text-xs text-slate-500">Time: {formattedTime}</div>
          <div className="text-xs text-slate-500">Cashier: {createdBy}</div>
        </div>
      </div>

      {/* Bill To & Payment Meta Section */}
      <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
        <div>
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">
            Billed To
          </span>
          {customer && !customer.isWalkIn ? (
            <div className="space-y-1 font-medium">
              <div className="text-sm font-bold text-slate-900">{customer.name || 'Valued Customer'}</div>
              {customer.phone && <p className="text-slate-600">Phone: {customer.phone}</p>}
              {customer.address && <p className="text-slate-600">Address: {customer.address}</p>}
            </div>
          ) : (
            <div className="text-slate-500 italic font-medium">
              Walk-in Customer (Over-the-counter Cash Sale)
            </div>
          )}
        </div>

        <div className="text-right space-y-1">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-1">
            Payment Summary
          </span>
          {paymentStatus && (
            <div className="flex justify-end gap-2 items-center">
              <span className="text-slate-500">Status:</span>
              <span
                className={`px-2 py-0.5 font-bold rounded text-[11px] ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : paymentStatus === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {paymentStatus}
              </span>
            </div>
          )}
          {paymentMethod && (
            <div className="text-slate-700">
              <span className="text-slate-500">Payment Method: </span>
              <strong className="uppercase">{paymentMethod}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Sales Items Table */}
      {documentType !== 'CUSTOMER_PAYMENT_RECEIPT' ? (
        <div className="my-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 rounded-l-lg">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">Unit</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-mono text-slate-400">{index + 1}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>{item.productName}</div>
                    {item.productCode && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Code: {item.productCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {currencySymbol} {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {currencySymbol} {item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Customer Payment Receipt Table */
        <div className="my-6 p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
          <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
            Payment Transaction Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Collected Amount:</span>
              <div className="text-lg font-black text-emerald-700">
                {currencySymbol} {amountCollected.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Payment Method:</span>
              <div className="text-sm font-bold uppercase text-slate-900">{paymentMethod}</div>
            </div>
          </div>

          {paymentAllocation.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-700 block mb-1">
                Allocated to Outstanding Sales:
              </span>
              <div className="space-y-1 text-[11px]">
                {paymentAllocation.map((alloc, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Invoice #{alloc.saleNumber}</span>
                    <span className="font-semibold text-slate-900">
                      Cleared: {currencySymbol} {alloc.allocatedAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial Calculations Box */}
      {documentType !== 'CUSTOMER_PAYMENT_RECEIPT' && (
        <div className="flex justify-end my-6">
          <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {currencySymbol} {subtotalAmount.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="font-semibold text-rose-600">
                  - {currencySymbol} {discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / VAT</span>
                <span className="font-semibold text-slate-900">
                  + {currencySymbol} {taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-slate-900 text-sm">
              <span>Total Payable</span>
              <span className="text-base text-blue-600">
                {currencySymbol} {totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 pt-1">
              <span>Paid Amount</span>
              <span className="font-bold text-emerald-600">
                {currencySymbol} {paidAmount.toFixed(2)}
              </span>
            </div>

            {dueAmount > 0 && (
              <div className="flex justify-between font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <span>Remaining Due</span>
                <span>
                  {currencySymbol} {dueAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {note && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 my-4">
          <strong>Note:</strong> {note}
        </div>
      )}

      {/* Footer Authorization Signatures */}
      <div className="pt-12 mt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-700">Customer Signature</p>
          <div className="w-36 border-b border-slate-300 mt-8" />
        </div>

        <div className="text-center text-[10px] text-slate-400">
          <p>This document is generated by Shop Management System.</p>
          <p>Thank you for doing business with us!</p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-700">Authorized Officer / Cashier</p>
          <div className="w-36 border-b border-slate-300 mt-8 ml-auto" />
        </div>
      </div>
    </div>
  );
};
