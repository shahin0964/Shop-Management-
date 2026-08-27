/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Plus, Edit2, Scan, Tag, AlertTriangle, Package, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useShop } from '../../../context/ShopContext.tsx';
import { useProduct } from '../../../context/ProductContext.tsx';
import { type Product } from '../../../types/product.ts';

export const AndroidProductsView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShop } = useShop();
  const { products, createProduct, updateProduct } = useProduct();
  const currency = owner?.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [unit, setUnit] = useState('pcs');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [initialStock, setInitialStock] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = Array.from(new Set(products.map((p) => p.categoryName || 'General'))).filter(
    Boolean
  );

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory =
      selectedCategory === 'ALL' || (p.categoryName || 'General') === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCode(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode('');
    setCategoryName('General');
    setUnit('pcs');
    setCostPrice('');
    setSellPrice('');
    setMinStockAlert('5');
    setInitialStock('10');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setBarcode(p.barcode || '');
    setCategoryName(p.categoryId || 'General');
    setUnit(p.unit || 'pcs');
    setCostPrice(p.costPrice?.toString() || '');
    setSellPrice(p.sellingPrice?.toString() || '');
    setMinStockAlert(p.minStockAlert?.toString() || '5');
    setInitialStock(p.currentStock?.toString() || '0');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name,
          code,
          barcode,
          categoryId: categoryName || null,
          unit,
          costPrice: Number(costPrice) || 0,
          sellingPrice: Number(sellPrice) || 0,
          minStockAlert: Number(minStockAlert) || 5,
        });
      } else {
        await createProduct({
          name,
          code,
          barcode,
          categoryId: categoryName || null,
          unit,
          costPrice: Number(costPrice) || 0,
          sellingPrice: Number(sellPrice) || 0,
          minStockAlert: Number(minStockAlert) || 5,
          currentStock: Number(initialStock) || 0,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-3 pb-20">
      {/* Header & Search */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Product Catalog</h3>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search catalog or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto text-xs no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map((p) => {
          const isLow = (p.currentStock || 0) <= (p.minStockAlert || 5);
          return (
            <div
              key={p.id}
              className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between text-xs"
            >
              <div className="space-y-1 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                  {p.barcode && (
                    <span className="px-1.5 py-0.2 bg-slate-100 text-[10px] font-mono text-slate-600 rounded border border-slate-200">
                      {p.barcode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span>Code: #{p.code}</span>
                  <span>Category: {p.categoryName || 'General'}</span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <span className="font-black text-slate-900 text-xs">
                    {currency} {p.sellingPrice?.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Cost: {currency} {p.costPrice?.toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div
                    className={`font-bold ${
                      isLow ? 'text-rose-600 font-black' : 'text-slate-900'
                    }`}
                  >
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
                  onClick={() => handleOpenEditModal(p)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="Scan or type barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sell Price ({currency}) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0.00"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Branch Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
