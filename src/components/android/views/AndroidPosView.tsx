/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Scan,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CheckCircle2,
  X,
  CreditCard,
  Printer,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useSales } from '../../../context/SalesContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';
import { type Product } from '../../../types/product.ts';
import { type PaymentMethod, type Sale } from '../../../types/sales.ts';

interface AndroidPosViewProps {
  onOpenPrintSale?: (sale: Sale) => void;
}

export const AndroidPosView: React.FC<AndroidPosViewProps> = ({ onOpenPrintSale }) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { products } = useProduct();
  const {
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    cartSubtotal,
  } = useSales();
  const { customers } = useCustomer();
  const currency = owner?.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Cart Sheet Drawer & Form State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [paidInput, setPaidInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && p.isActive !== false;
  });

  const handleSelectProduct = (product: Product) => {
    addToCart(product);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const current = cart.find((i) => i.product.id === productId);
    if (current) {
      updateCartQuantity(productId, current.quantity + delta);
    }
  };

  // Financial Calculations
  const subtotal = cartSubtotal || cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountVal = Math.max(0, Number(discountInput) || 0);
  const totalAmount = Math.max(0, subtotal - discountVal);
  const paidVal = paidInput === '' ? totalAmount : Number(paidInput) || 0;
  const dueVal = Math.max(0, totalAmount - paidVal);

  const totalItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg('Cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const selectedCust = customers.find((c) => c.id === selectedCustomerId);

      const res = await completeSale({
        customerId: selectedCust?.id || undefined,
        customerName: selectedCust?.name || undefined,
        customerPhone: selectedCust?.phone || undefined,
        discountAmount: discountVal,
        taxAmount: 0,
        paidAmount: paidVal,
        paymentMethod,
        note: noteInput,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to complete sale');
      }

      const createdSale = res.sale;

      // Clear checkout state
      setIsCartOpen(false);
      setDiscountInput('0');
      setPaidInput('');
      setSelectedCustomerId('');
      setNoteInput('');

      // Trigger print preview if handler exists
      if (onOpenPrintSale && createdSale) {
        onOpenPrintSale(createdSale);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete Android POS sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative pb-20 overflow-hidden">
      {/* Search & Camera Barcode Scanner Bar */}
      <div className="p-3 bg-white border-b border-slate-200 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {scanMessage && (
          <div className="p-2 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200 animate-pulse">
            {scanMessage}
          </div>
        )}
      </div>

      {/* Grid of Selectable Products */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5">
        {filteredProducts.map((p) => {
          const inCart = cart.find((item) => item.product.id === p.id);
          return (
            <div
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className={`p-3 bg-white border rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer flex flex-col justify-between relative ${
                inCart ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200'
              }`}
            >
              {inCart && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {inCart.quantity}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">#{p.code}</span>
                <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                  {p.name}
                </h4>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs">
                  {currency} {(p.sellingPrice || 0).toFixed(2)}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    p.currentStock <= 5 ? 'text-rose-600 font-black' : 'text-slate-500'
                  }`}
                >
                  {p.currentStock} {p.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistent Bottom Bar showing Cart Total */}
      <div className="p-3 bg-slate-900 text-white shrink-0 border-t border-slate-800 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Current Checkout ({totalItemsCount} items)
          </span>
          <div className="text-lg font-black text-white">
            {currency} {subtotal.toFixed(2)}
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => setIsCartOpen(true)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
            cart.length > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Checkout Sheet</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Cart & Checkout Sheet (Bottom Drawer) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cart Checkout ({totalItemsCount} items)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Feed */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 max-h-48">
              {cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{item.product.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {currency} {item.unitPrice.toFixed(2)} x {item.quantity} {item.product.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckoutSubmit} className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">Customer Selection</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Cash / Walk-in Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    placeholder={totalAmount.toString()}
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Net Payable:</span>
                  <span className="font-black text-slate-900">{currency} {totalAmount.toFixed(2)}</span>
                </div>
                {dueVal > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Due Balance:</span>
                    <span>{currency} {dueVal.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing...' : 'Complete & Print Receipt'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
