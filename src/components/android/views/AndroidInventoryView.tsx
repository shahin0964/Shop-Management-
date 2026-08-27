/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowUpRight, Search, RefreshCw, Plus, Minus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useInventory } from '../../../context/InventoryContext.tsx';

export const AndroidInventoryView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { products } = useProduct();
  const { adjustStock } = useInventory();
  const currency = owner?.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowOnly, setFilterLowOnly] = useState(false);

  // Stock Adjust Modal State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Count Adjustment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const isLow = (p.currentStock || 0) <= (p.minStockAlert || 5);
    return matchSearch && (!filterLowOnly || isLow);
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const qtyNum = Number(adjustQty);
    if (isNaN(qtyNum) || qtyNum === 0) {
      setErrorMsg('Please enter a non-zero quantity.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await adjustStock({
        productId: selectedProductId,
        quantityChange: qtyNum,
        reason: adjustReason,
        shopId: activeShop?.id || 'default-shop',
      });
      setSelectedProductId(null);
      setAdjustQty('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Header Controls */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Inventory Hub</h3>
          <button
            type="button"
            onClick={() => setFilterLowOnly(!filterLowOnly)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterLowOnly
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Low Stock Only
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search inventory by product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Product Stock List */}
      <div className="space-y-2">
        {filteredProducts.map((p) => {
          const isLow = (p.currentStock || 0) <= (p.minStockAlert || 5);
          return (
            <div
              key={p.id}
              className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Code: #{p.code} • Min Alert: {p.minStockAlert} {p.unit}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`font-black text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                    {p.currentStock} {p.unit}
                  </div>
                  {isLow && (
                    <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 text-[9px] font-bold rounded">
                      Low Stock
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setAdjustQty('');
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Adjust Sheet / Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Stock Adjustment</h3>
                <p className="text-[10px] text-slate-400">{selectedProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Current Stock Level:</span>
                <span className="font-black text-sm text-slate-900">
                  {selectedProduct.currentStock} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quantity Change (+ to Add, - to Deduct)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. +10 or -5"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
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
                  onClick={() => setSelectedProductId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
