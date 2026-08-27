/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeftRight, Search, Plus, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { useTransfer } from '../../../context/TransferContext.tsx';
import { type Product } from '../../../types/product.ts';

export const WindowsTransfersView: React.FC = () => {
  const { owner } = useAuth();
  const { shops, activeShop } = useShop();
  const { products } = useProduct();
  const { transfers, createTransfer } = useTransfer();
  const currency = owner?.currencySymbol || '৳';

  const [toShopId, setToShopId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [transferQty, setTransferQty] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otherShops = shops.filter((s) => s.id !== activeShop?.id);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toShopId) {
      setErrorMsg('Select a target shop branch.');
      return;
    }
    if (!selectedProductId) {
      setErrorMsg('Select a product to transfer.');
      return;
    }
    const qty = Number(transferQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    const targetProduct = products.find((p) => p.id === selectedProductId);
    if (!targetProduct || targetProduct.currentStock < qty) {
      setErrorMsg(`Insufficient stock. Current stock is ${targetProduct?.currentStock || 0}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const destShop = shops.find((s) => s.id === toShopId);

      await createTransfer({
        toShopId,
        toShopName: destShop?.name || 'Target Branch',
        items: [
          {
            productId: targetProduct.id,
            productName: targetProduct.name,
            quantity: qty,
            unit: targetProduct.unit,
          },
        ],
        note: note || `Stock Transfer to ${destShop?.name}`,
      });

      setSuccessMsg(`Stock transfer of ${qty} ${targetProduct.unit} of "${targetProduct.name}" initiated!`);
      setSelectedProductId('');
      setTransferQty('');
      setNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute stock transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Transfer Wizard (5 cols) */}
      <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          <span>Shop-to-Shop Stock Transfer Wizard</span>
        </h3>

        <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 font-medium block">Source Branch:</span>
            <span className="font-bold text-slate-900 text-sm">
              {activeShop?.name || 'Main Shop'} (#{activeShop?.code})
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Destination Branch *</label>
            <select
              value={toShopId}
              onChange={(e) => setToShopId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Target Branch --</option>
              {otherShops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (#{s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Catalog Item --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Available: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Transfer Quantity *</label>
            <input
              type="number"
              min="1"
              required
              placeholder="0"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Transfer Note / Memo</label>
            <input
              type="text"
              placeholder="Driver / Waybill memo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
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
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Transferring...' : 'Execute Stock Transfer'}</span>
          </button>
        </form>
      </div>

      {/* Transfer History Table (7 cols) */}
      <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Stock Transfer Log History ({transfers.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Items Transferred</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No transfers executed yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">
                        {t.fromShopName} → {t.toShopName}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {t.items.map((i, idx) => (
                        <div key={idx} className="font-medium text-slate-800">
                          {i.productName} x {i.quantity} {i.unit}
                        </div>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 text-[10px]">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
