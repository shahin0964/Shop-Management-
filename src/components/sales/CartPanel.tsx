/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  User,
  CreditCard,
  Banknote,
  FileText,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { type PaymentMethod } from '../../types/sales.ts';
import { useSales } from '../../context/SalesContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCustomer } from '../../context/CustomerContext.tsx';
import { normalizeCurrencyNumber } from '../../services/productService.ts';

export const CartPanel: React.FC = () => {
  const {
    cart,
    cartItemCount,
    cartSubtotal,
    updateCartQuantity,
    updateCartPrice,
    removeFromCart,
    clearCart,
    completeSale,
    isSubmittingSale,
    salesError,
  } = useSales();

  const { activeCustomers } = useCustomer();
  const { owner } = useAuth();
  const currency = owner?.currencySymbol || '$';

  // Checkout Form State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [saleNote, setSaleNote] = useState<string>('');
  const [showCustomerFields, setShowCustomerFields] = useState<boolean>(false);

  const selectedCustomerObj = activeCustomers.find((c) => c.id === selectedCustomerId);

  // Derived financial values
  const totalPayable = normalizeCurrencyNumber(
    Math.max(0, cartSubtotal - (discountAmount || 0) + (taxAmount || 0))
  );

  // If user hasn't typed a paid amount, default to totalPayable
  const parsedPaidAmount =
    paidAmountInput === '' ? totalPayable : Number(paidAmountInput) || 0;
  const isUnderpaid = parsedPaidAmount < totalPayable;
  const isOverpaid = parsedPaidAmount > totalPayable;
  const dueAmount = isUnderpaid ? normalizeCurrencyNumber(totalPayable - parsedPaidAmount) : 0;
  const changeReturn = isOverpaid ? normalizeCurrencyNumber(parsedPaidAmount - totalPayable) : 0;

  const handleSetExactPaid = () => {
    setPaidAmountInput(totalPayable.toString());
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const actualPaid = paidAmountInput === '' ? totalPayable : Number(paidAmountInput);
    if (isNaN(actualPaid) || actualPaid < 0) {
      alert('Please enter a valid paid amount.');
      return;
    }

    const res = await completeSale({
      discountAmount,
      taxAmount,
      paidAmount: actualPaid,
      paymentMethod,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomerObj
        ? selectedCustomerObj.name
        : customerName.trim() || undefined,
      customerPhone: selectedCustomerObj
        ? selectedCustomerObj.phone
        : customerPhone.trim() || undefined,
      note: saleNote.trim() || undefined,
    });

    if (res.success) {
      // Reset form fields
      setDiscountAmount(0);
      setTaxAmount(0);
      setPaidAmountInput('');
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setSaleNote('');
      setShowCustomerFields(false);
    }
  };

  const paymentMethodsList: { id: PaymentMethod; label: string; icon?: React.ReactNode }[] = [
    { id: 'CASH', label: 'Cash', icon: <Banknote className="w-3.5 h-3.5" /> },
    { id: 'BKASH', label: 'bKash' },
    { id: 'NAGAD', label: 'Nagad' },
    { id: 'ROCKET', label: 'Rocket' },
    { id: 'CARD', label: 'Card / POS', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'DUE_CREDIT', label: 'Due / Credit' },
    { id: 'SPLIT', label: 'Split' },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Cart Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Register Sale
            </h2>
            <span className="text-xs text-slate-500">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[180px] max-h-[340px] space-y-2.5 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-700">Sale Cart is Empty</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Select products from the catalog to add them to this sale invoice.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const maxStock = Number(item.product.currentStock || 0);

            return (
              <div key={item.product.id} className="pt-2.5 first:pt-0 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {currency} {item.unitPrice.toFixed(2)} / {item.product.unit}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-slate-900">
                      {currency} {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Controls Line */}
                <div className="flex items-center justify-between pt-1">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxStock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartQuantity(item.product.id, parseInt(e.target.value) || 0)
                      }
                      className="w-12 text-center text-xs font-bold bg-transparent text-slate-900 border-none focus:outline-hidden py-0.5"
                    />
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= maxStock}
                      className={`p-1 text-slate-600 transition-colors ${
                        item.quantity >= maxStock
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-slate-200 cursor-pointer'
                      }`}
                      title={
                        item.quantity >= maxStock
                          ? 'Max stock reached'
                          : 'Increase quantity'
                      }
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Unit Price Custom Edit & Remove */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Max:</span>
                      <span className="font-semibold text-slate-700">{maxStock}</span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Financial Summary & Checkout */}
      {cart.length > 0 && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Subtotal, Discount, and Tax Adjustments */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">
                {currency} {cartSubtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500">Order Discount (-)</span>
              <div className="flex items-center gap-1 w-24">
                <span className="text-slate-400">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-right font-medium text-slate-800 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500">Tax / VAT (+)</span>
              <div className="flex items-center gap-1 w-24">
                <span className="text-slate-400">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount || ''}
                  onChange={(e) => setTaxAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-right font-medium text-slate-800 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total Payable Banner */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Total Payable
              </span>
              <span className="text-lg font-black text-blue-600">
                {currency} {totalPayable.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {paymentMethodsList.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-1.5 px-2 rounded-lg font-medium text-center transition-all cursor-pointer truncate ${
                    paymentMethod === pm.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid Amount & Due/Change Calculation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Amount Paid
              </label>
              <button
                type="button"
                onClick={handleSetExactPaid}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Exact ({currency} {totalPayable.toFixed(2)})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                placeholder={totalPayable.toFixed(2)}
                className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Payment Status / Due / Change Preview */}
            <div className="pt-1 flex items-center justify-between text-xs">
              {isUnderpaid ? (
                <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 w-full justify-between font-semibold">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Customer Due:
                  </span>
                  <span>
                    {currency} {dueAmount.toFixed(2)}
                  </span>
                </div>
              ) : isOverpaid ? (
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-full justify-between font-semibold">
                  <span>Change Return:</span>
                  <span>
                    {currency} {changeReturn.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-md border border-emerald-200 w-full justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Status:
                  </span>
                  <span className="font-bold">Fully Paid</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Customer Details Collapsible */}
          <div className="border-t border-slate-200 pt-2">
            <button
              type="button"
              onClick={() => setShowCustomerFields(!showCustomerFields)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-between w-full cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {selectedCustomerObj ? (
                  <span className="text-blue-600 font-bold">
                    Customer: {selectedCustomerObj.name}
                  </span>
                ) : (
                  'Customer Info / Account'
                )}
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                {showCustomerFields ? 'Hide' : selectedCustomerObj ? 'Change' : '+ Select / Add'}
              </span>
            </button>

            {showCustomerFields && (
              <div className="mt-2 space-y-2 pt-1 animate-in fade-in duration-100 text-xs">
                {/* Registered Customer Selector */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Select Customer Account
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedCustomerId(cid);
                      if (cid) {
                        const found = activeCustomers.find((c) => c.id === cid);
                        if (found) {
                          setCustomerName(found.name);
                          setCustomerPhone(found.phone || '');
                        }
                      } else {
                        setCustomerName('');
                        setCustomerPhone('');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">-- Walk-in Customer --</option>
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} {Number(c.currentDue || 0) > 0 ? `• Due: ${currency}${Number(c.currentDue).toFixed(2)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomerObj && Number(selectedCustomerObj.currentDue || 0) > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center justify-between font-medium">
                    <span>Previous Outstanding Due:</span>
                    <span className="font-bold text-amber-900">
                      {currency} {Number(selectedCustomerObj.currentDue).toFixed(2)}
                    </span>
                  </div>
                )}

                {!selectedCustomerId && (
                  <>
                    <div>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name (Optional for Walk-in)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Customer Phone (Optional)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <input
                    type="text"
                    value={saleNote}
                    onChange={(e) => setSaleNote(e.target.value)}
                    placeholder="Invoice note or reference..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {salesError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{salesError}</span>
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmittingSale || cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSubmittingSale || cart.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]'
            }`}
          >
            {isSubmittingSale ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Sale & Stock...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale ({currency} {totalPayable.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
