/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeftRight, Send, CheckCircle2, Clock, Package, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useTransfer } from '../../../context/TransferContext.tsx';

export const AndroidTransfersView: React.FC = () => {
  const { shops, activeShop } = useShop();
  const { products } = useProduct();
  const { transfers, createTransfer } = useTransfer();

  const [destShopId, setDestShopId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [transferQty, setTransferQty] = useState('1');
  const [note, setNote] = useState('Branch Stock Replenishment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otherShops = shops.filter((s) => s.id !== activeShop?.id);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destShopId) {
      setErrorMsg('Please select a destination branch.');
      return;
    }
    if (!selectedProductId) {
      setErrorMsg('Please select a product to transfer.');
      return;
    }

    const qty = Number(transferQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Transfer quantity must be greater than zero.');
      return;
    }

    if (selectedProduct && (selectedProduct.currentStock || 0) < qty) {
      setErrorMsg(
        `Insufficient stock in source shop. Available: ${selectedProduct.currentStock} ${selectedProduct.unit}`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const destShop = shops.find((s) => s.id === destShopId);
      await createTransfer({
        sourceShopId: activeShop?.id || 'default-shop',
        sourceShopName: activeShop?.name || 'Main Branch',
        destShopId,
        destShopName: destShop?.name || 'Target Branch',
        productId: selectedProductId,
        productName: selectedProduct?.name || 'Product',
        productCode: selectedProduct?.code || 'SKU',
        unit: selectedProduct?.unit || 'pcs',
        quantity: qty,
        note,
      });

      setSuccessMsg(`Transfer dispatched to ${destShop?.name || 'Target Branch'} successfully!`);
      setSelectedProductId('');
      setTransferQty('1');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch stock transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Transfer Dispatch Form */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <ArrowLeftRight className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-sm">Shop Stock Transfer</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Source & Target Branch */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">From Source Branch</label>
              <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-900">
                {activeShop?.name || 'Current Shop'}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">To Destination Branch *</label>
              <select
                required
                value={destShopId}
                onChange={(e) => setDestShopId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select Target Shop --</option>
                {otherShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (#{s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Product *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Note */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Transfer Qty *</label>
              <input
                type="number"
                min="1"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reference Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Stock Transfer'}</span>
          </button>
        </form>
      </div>

      {/* Transfer History Feed */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
          Stock Transfer History
        </h4>
        <div className="divide-y divide-slate-100 text-xs">
          {transfers.slice(0, 5).map((t) => (
            <div key={t.id} className="py-2.5 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">{t.productName}</div>
                <div className="text-[10px] text-slate-500">
                  {t.sourceShopName} → {t.destShopName}
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900">
                  {t.quantity} {t.unit}
                </span>
                <div className="text-[9px] font-bold text-emerald-600 uppercase">
                  {t.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
