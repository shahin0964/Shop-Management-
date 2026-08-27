/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertCircle, Check, Tag, Camera, CheckCircle2, X, QrCode } from 'lucide-react';
import { type Product } from '../../types/product.ts';
import { useProduct } from '../../context/ProductContext.tsx';
import { useSales } from '../../context/SalesContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal.tsx';

interface ScanResultNotice {
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  barcode?: string;
}

export const ProductPicker: React.FC = () => {
  const { products, categories, isLoadingProducts } = useProduct();
  const { cart, addToCart } = useSales();
  const { owner } = useAuth();
  const currency = owner?.currencySymbol || '$';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResultNotice, setScanResultNotice] = useState<ScanResultNotice | null>(null);

  // Fast mapping of cart quantities
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cart]);

  // Filtered active products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      // Must be active
      if (!product.isActive) return false;

      // Category filter
      if (selectedCategoryId !== 'ALL' && product.categoryId !== selectedCategoryId) {
        return false;
      }

      // Search match
      if (!q) return true;
      const nameMatch = product.name.toLowerCase().includes(q);
      const codeMatch = product.code?.toLowerCase().includes(q);
      const barcodeMatch = product.barcode?.toLowerCase().includes(q);
      const brandMatch = product.brand?.toLowerCase().includes(q);

      return nameMatch || codeMatch || barcodeMatch || brandMatch;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  /**
   * Process barcode scan / search result strictly following shop-authorized lookup rules
   */
  const handleProcessBarcodeScan = (scannedBarcode: string) => {
    const cleanBarcode = scannedBarcode.trim();
    if (!cleanBarcode) return;

    // Search active products in authorized shop for matching barcode (exact string comparison)
    const matchedProduct = products.find(
      (p) =>
        p.isActive &&
        ((p.barcode && p.barcode.toLowerCase() === cleanBarcode.toLowerCase()) ||
          (p.code && p.code.toLowerCase() === cleanBarcode.toLowerCase()))
    );

    if (!matchedProduct) {
      setScanResultNotice({
        type: 'error',
        title: 'Product Not Found',
        message: `No active product matches barcode "${cleanBarcode}" in this branch.`,
        barcode: cleanBarcode,
      });
      return;
    }

    const currentStock = Number(matchedProduct.currentStock || 0);
    if (currentStock <= 0) {
      setScanResultNotice({
        type: 'error',
        title: 'Product Out of Stock',
        message: `"${matchedProduct.name}" is out of stock (0 ${matchedProduct.unit}). Cannot add to sale cart.`,
        barcode: cleanBarcode,
      });
      return;
    }

    const inCartQty = cartQtyMap.get(matchedProduct.id) || 0;
    if (inCartQty >= currentStock) {
      setScanResultNotice({
        type: 'warning',
        title: 'Maximum Available Stock in Cart',
        message: `All available stock (${currentStock} ${matchedProduct.unit}) for "${matchedProduct.name}" is already in cart.`,
        barcode: cleanBarcode,
      });
      return;
    }

    // Add item to cart and notify user
    addToCart(matchedProduct, 1);
    setScanResultNotice({
      type: 'success',
      title: 'Added to POS Cart',
      message: `Added 1x "${matchedProduct.name}" (${currency} ${matchedProduct.sellingPrice.toFixed(2)})`,
      barcode: cleanBarcode,
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleProcessBarcodeScan(searchQuery.trim());
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Product Catalog
            </h2>
            <p className="text-xs text-slate-500">
              Select items or scan barcode to add to POS register
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScanResultNotice(null);
                setIsScannerOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Barcode</span>
            </button>

            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              {filteredProducts.length} Items
            </span>
          </div>
        </div>

        {/* Scan Result Notice Banner */}
        {scanResultNotice && (
          <div
            className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150 ${
              scanResultNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : scanResultNotice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-2">
              {scanResultNotice.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {scanResultNotice.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              {scanResultNotice.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">{scanResultNotice.title}</span>
                <span className="text-[11px] opacity-90">{scanResultNotice.message}</span>
                {scanResultNotice.barcode && (
                  <span className="block text-[10px] font-mono mt-0.5 opacity-75">
                    Barcode Value: "{scanResultNotice.barcode}"
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setScanResultNotice(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search name, code, or press Enter to scan barcode..."
            className="w-full pl-10 pr-16 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md cursor-pointer"
            >
              Clear
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <QrCode className="w-3 h-3 text-slate-300" /> Enter to search
            </span>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryId === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid / List */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
        {isLoadingProducts ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading products...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
            <Tag className="w-8 h-8 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-700">No matching products found</p>
            <p className="text-xs text-slate-500 max-w-xs">
              {searchQuery
                ? `No products matched "${searchQuery}". Try a different keyword or category.`
                : 'No active products in this shop. Add products in Product Catalog.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const currentStock = Number(product.currentStock || 0);
              const inCartQty = cartQtyMap.get(product.id) || 0;
              const isOutOfStock = currentStock <= 0;
              const isMaxInCart = inCartQty >= currentStock && !isOutOfStock;

              let stockBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (isOutOfStock) {
                stockBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
              } else if (currentStock <= (product.minStockAlert || 5)) {
                stockBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
              }

              return (
                <div
                  key={product.id}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all text-left ${
                    isOutOfStock
                      ? 'bg-slate-50/60 border-slate-200 opacity-70'
                      : inCartQty > 0
                      ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header line: Category/Code & In-Cart Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                        {product.code || 'NO-SKU'}
                      </span>
                      {inCartQty > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          {inCartQty} in cart
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>

                    {/* Barcode / Unit */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span>Per {product.unit || 'pcs'}</span>
                      {product.barcode && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{product.barcode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer: Price, Stock & Add Action */}
                  <div className="pt-2 mt-auto border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-400 block leading-none mb-0.5">Price</span>
                      <span className="text-base font-bold text-slate-900">
                        {currency} {Number(product.sellingPrice || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Stock Level Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${stockBadgeClass}`}
                      >
                        {isOutOfStock ? 'Out of Stock' : `${currentStock} ${product.unit}`}
                      </span>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock || isMaxInCart}
                        title={
                          isOutOfStock
                            ? 'Out of stock'
                            : isMaxInCart
                            ? 'Maximum available stock already in cart'
                            : 'Add to sale cart'
                        }
                        className={`p-2 rounded-lg font-medium text-xs flex items-center justify-center transition-colors cursor-pointer ${
                          isOutOfStock || isMaxInCart
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedValue) => {
          setIsScannerOpen(false);
          handleProcessBarcodeScan(scannedValue);
        }}
        title="POS Terminal Barcode Scanner"
        description="Scan product barcode to automatically add item to cart"
      />
    </div>
  );
};
