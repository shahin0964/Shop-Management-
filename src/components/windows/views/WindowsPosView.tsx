/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CheckCircle2,
  Printer,
  CreditCard,
  Keyboard,
  X,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useSales } from '../../../context/SalesContext.tsx';
import { useCustomer } from '../../../context/CustomerContext.tsx';
import { type Product } from '../../../types/product.ts';
import { type PaymentMethod, type Sale } from '../../../types/sales.ts';

interface WindowsPosViewProps {
  onOpenPrintSale?: (sale: Sale) => void;
}

export const WindowsPosView: React.FC<WindowsPosViewProps> = ({ onOpenPrintSale }) => {
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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Checkout inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [paidInput, setPaidInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // USB Barcode Scanner keystroke detector
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkeys
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        clearCart();
        return;
      }

      // Barcode Buffer Processing
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 60) {
        buffer = ''; // Reset buffer if typing slow (human typing)
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const matched = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === buffer.toLowerCase()) ||
              p.code.toLowerCase() === buffer.toLowerCase()
          );
          if (matched) {
            addToCart(matched);
            setScanMessage(`Scanned & Added: ${matched.name}`);
            setTimeout(() => setScanMessage(null), 3000);
            buffer = '';
            e.preventDefault();
          }
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addToCart, clearCart]);

  // Categories extraction
  const categories = Array.from(new Set(products.map((p) => p.categoryId).filter(Boolean)));

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
      setDiscountInput('0');
      setPaidInput('');
      setSelectedCustomerId('');
      setNoteInput('');

      // Trigger print preview if handler exists
      if (onOpenPrintSale && createdSale) {
        onOpenPrintSale(createdSale);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">
      {/* Left / Center Panel: Product Search & Grid (7 cols) */}
      <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by Product Name, SKU, or Scan Barcode (Press F1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
            <div className="px-3 py-2 bg-slate-900 text-slate-300 rounded-xl text-[11px] font-mono flex items-center gap-1.5 shrink-0">
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>USB Scanner Active</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {scanMessage && (
            <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 animate-pulse flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{scanMessage}</span>
            </div>
          )}
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const inCart = cart.find((item) => item.product.id === p.id);
            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`p-3 bg-white border rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between relative group ${
                  inCart ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {inCart && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                    {inCart.quantity}
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">#{p.code}</span>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
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
      </div>

      {/* Right Panel: Cart & Fast Checkout Workstation (5 cols) */}
      <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Cart Terminal</h3>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full">
              {totalItemsCount} items
            </span>
          </div>

          <button
            type="button"
            onClick={() => clearCart()}
            disabled={cart.length === 0}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
            title="Clear Cart (F10)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear (F10)</span>
          </button>
        </div>

        {/* Cart Items Scroll Table */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-medium">Cart is empty.</p>
              <p className="text-[11px] text-slate-400">Scan barcode or click items to add to checkout.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{item.product.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currency} {item.unitPrice.toFixed(2)} x {item.quantity} ={' '}
                    <span className="font-bold text-slate-900">
                      {currency} {(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-black text-slate-900 w-6 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Calculation & Checkout Form */}
        <form onSubmit={handleCheckoutSubmit} className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
          {/* Customer & Payment Method Selector */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Walk-in / Cash --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="CARD">Bank Card</option>
                <option value="DUE">Full Due Ledger</option>
              </select>
            </div>
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
              <label className="font-bold text-slate-700 block mb-1">Paid Amount ({currency})</label>
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

          {/* Subtotal & Net Summary */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal:</span>
              <span>{currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-100">
              <span>Net Payable:</span>
              <span className="text-blue-600">{currency} {totalAmount.toFixed(2)}</span>
            </div>
            {dueVal > 0 && (
              <div className="flex justify-between font-bold text-rose-600">
                <span>Due Receivable:</span>
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
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing Invoice...' : 'Complete & Print Receipt'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
