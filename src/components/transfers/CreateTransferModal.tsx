import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Camera,
  CheckCircle2,
  Package,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTransfer } from '../../context/TransferContext.tsx';
import { ProductService } from '../../services/productService.ts';
import { type Product } from '../../types/product.ts';
import { type CreateTransferItemInput } from '../../types/transfer.ts';

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TransferCartItem {
  product: Product;
  quantity: number;
}

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { owner } = useAuth();
  const { shops, activeShopId, currencySymbol } = useShop();
  const { createTransfer, isProcessingAction } = useTransfer();

  // Active shops owned by this owner
  const activeShops = useMemo(() => shops.filter((s) => s.isActive), [shops]);

  // Form State
  const [sourceShopId, setSourceShopId] = useState<string>('');
  const [destinationShopId, setDestinationShopId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Source Shop Products State
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');

  // Cart / Items Selected for Transfer
  const [cartItems, setCartItems] = useState<TransferCartItem[]>([]);

  // UI / Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Source & Destination Shops when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultSource = activeShopId && activeShops.some((s) => s.id === activeShopId)
        ? activeShopId
        : activeShops[0]?.id || '';
      
      setSourceShopId(defaultSource);

      const defaultDest = activeShops.find((s) => s.id !== defaultSource)?.id || '';
      setDestinationShopId(defaultDest);

      setNotes('');
      setCartItems([]);
      setErrorMessage(null);
      setProductSearchQuery('');
    }
  }, [isOpen, activeShopId, activeShops]);

  // Auto-update Destination shop if it matches Source shop
  const handleSourceShopChange = (newSourceId: string) => {
    setSourceShopId(newSourceId);
    setCartItems([]); // Clear cart items since product catalog changes
    setErrorMessage(null);

    if (destinationShopId === newSourceId) {
      const nextDest = activeShops.find((s) => s.id !== newSourceId)?.id || '';
      setDestinationShopId(nextDest);
    }
  };

  // Fetch products for selected Source Shop
  useEffect(() => {
    if (!owner?.id || !sourceShopId) {
      setSourceProducts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingProducts(true);

    ProductService.getProducts(owner.id, sourceShopId)
      .then((prods) => {
        if (isMounted) {
          setSourceProducts(prods.filter((p) => p.isActive));
        }
      })
      .catch((err) => {
        console.error('[CreateTransferModal] Error fetching source products:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [owner?.id, sourceShopId]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return sourceProducts;

    return sourceProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.code && p.code.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }, [sourceProducts, productSearchQuery]);

  // Add item to transfer cart
  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    setErrorMessage(null);

    const currentStock = Number(product.currentStock || 0);
    if (currentStock <= 0) {
      setErrorMessage(`Cannot add "${product.name}". Available stock in source shop is 0 ${product.unit}.`);
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const existingItem = prev[existingIndex];
        const newQty = existingItem.quantity + quantityToAdd;

        if (newQty > currentStock) {
          setErrorMessage(
            `Cannot transfer ${newQty} ${product.unit} of "${product.name}". Maximum available stock is ${currentStock} ${product.unit}.`
          );
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = { ...existingItem, quantity: newQty };
        return updated;
      } else {
        if (quantityToAdd > currentStock) {
          setErrorMessage(
            `Cannot transfer ${quantityToAdd} ${product.unit} of "${product.name}". Maximum available stock is ${currentStock} ${product.unit}.`
          );
          return prev;
        }
        return [...prev, { product, quantity: quantityToAdd }];
      }
    });
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setErrorMessage(null);

    if (isNaN(newQuantity) || newQuantity <= 0) {
      // Remove item if 0
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    const item = cartItems.find((ci) => ci.product.id === productId);
    if (!item) return;

    const maxStock = Number(item.product.currentStock || 0);
    if (newQuantity > maxStock) {
      setErrorMessage(
        `Quantity for "${item.product.name}" cannot exceed available stock of ${maxStock} ${item.product.unit}.`
      );
      return;
    }

    setCartItems((prev) =>
      prev.map((ci) => (ci.product.id === productId ? { ...ci, quantity: newQuantity } : ci))
    );
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Handle barcode scanner result
  const handleBarcodeScan = (barcode: string) => {
    setIsScannerOpen(false);
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;

    const matched = sourceProducts.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanBarcode.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === cleanBarcode.toLowerCase())
    );

    if (matched) {
      handleAddToCart(matched, 1);
    } else {
      setErrorMessage(`No product in Source Shop matches barcode "${cleanBarcode}".`);
    }
  };

  // Totals
  const totalItemCount = cartItems.length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalEstimatedValue = cartItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.product.costPrice || 0),
    0
  );

  // Source & Destination Shop Objects
  const sourceShopObj = activeShops.find((s) => s.id === sourceShopId);
  const destShopObj = activeShops.find((s) => s.id === destinationShopId);

  // Execute Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sourceShopId || !destinationShopId) {
      setErrorMessage('Please select both Source and Destination shops.');
      return;
    }

    if (sourceShopId === destinationShopId) {
      setErrorMessage('Source and Destination shops cannot be identical.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one product item to the transfer order.');
      return;
    }

    const transferItems: CreateTransferItemInput[] = cartItems.map((ci) => ({
      productId: ci.product.id,
      quantity: ci.quantity,
    }));

    try {
      await createTransfer({
        sourceShopId,
        destinationShopId,
        items: transferItems,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[CreateTransferModal] Submit error:', err);
      setErrorMessage(err.message || 'Failed to complete stock transfer.');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Inter-Shop Stock Transfer"
        description="Transfer inventory items atomically between authorized owner branches"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Section 1: Shop Selection */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Transfer Branches</span>
            </h4>

            {activeShops.length < 2 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <b>Branch Restriction:</b> You currently have only {activeShops.length} active branch. Inter-shop stock transfer requires at least 2 active shops under your ownership. Please add another shop in Shop Management first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Shop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source Branch (Stock Out <span className="text-rose-500">*</span>)
                  </label>
                  <select
                    value={sourceShopId}
                    onChange={(e) => handleSourceShopChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={isProcessingAction}
                  >
                    {activeShops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name} ({shop.code}) {shop.isMainBranch ? '• Main' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Shop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Branch (Stock In <span className="text-rose-500">*</span>)
                  </label>
                  <select
                    value={destinationShopId}
                    onChange={(e) => {
                      setDestinationShopId(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={isProcessingAction}
                  >
                    {activeShops
                      .filter((s) => s.id !== sourceShopId)
                      .map((shop) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} ({shop.code}) {shop.isMainBranch ? '• Main' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Product Picker from Source Shop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Source Branch Product Catalog</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Barcode</span>
              </button>
            </div>

            {/* Product Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder={`Search product name, code, or barcode in ${sourceShopObj?.name || 'source shop'}...`}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Products Selection Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white divide-y divide-slate-100">
              {isLoadingProducts ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading branch catalog...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active products match search query in source branch.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const stock = Number(product.currentStock || 0);
                  const inCartItem = cartItems.find((ci) => ci.product.id === product.id);
                  const inCartQty = inCartItem?.quantity || 0;
                  const availableRem = stock - inCartQty;

                  return (
                    <div
                      key={product.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {product.name}
                          </span>
                          {product.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {product.code}
                            </span>
                          )}
                          {product.barcode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                              {product.barcode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>
                            Stock: <strong className={stock > 0 ? 'text-slate-800' : 'text-rose-600'}>{stock} {product.unit}</strong>
                          </span>
                          <span>•</span>
                          <span>Unit Cost: {currencySymbol} {Number(product.costPrice || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inCartQty > 0 && (
                          <span className="text-[11px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md">
                            {inCartQty} in cart
                          </span>
                        )}
                        <Button
                          type="button"
                          variant={inCartQty > 0 ? 'outline' : 'primary'}
                          size="xs"
                          onClick={() => handleAddToCart(product, 1)}
                          disabled={availableRem <= 0 || isProcessingAction}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Transfer Requisition Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Transfer Items Requisition ({cartItems.length} Products)</span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </h4>

            {cartItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
                No items added to transfer order yet. Select products from the catalog above.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-right">Unit Cost</div>
                  <div className="col-span-3 text-center">Transfer Qty</div>
                  <div className="col-span-2 text-right">Est. Value</div>
                </div>

                {cartItems.map((item) => {
                  const maxStock = Number(item.product.currentStock || 0);
                  const lineTotal = item.quantity * Number(item.product.costPrice || 0);

                  return (
                    <div key={item.product.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 text-xs">
                      <div className="col-span-5 min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Avail: {maxStock} {item.product.unit}
                        </div>
                      </div>

                      <div className="col-span-2 text-right text-slate-700 font-medium">
                        {currencySymbol} {Number(item.product.costPrice || 0).toFixed(2)}
                      </div>

                      <div className="col-span-3 flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max={maxStock}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="text-[11px] text-slate-500">{item.product.unit}</span>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-900">
                          {currencySymbol} {lineTotal.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Notes & Summary Bar */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <Input
              label="Transfer Notes / Reason (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Branch stock re-balancing requisition..."
            />

            {/* Total Valuation Summary */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                  Transfer Requisition Summary
                </div>
                <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>{sourceShopObj?.name || 'Source'}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span>{destShopObj?.name || 'Destination'}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">
                  {totalItemCount} Items • Total {totalQuantity} Units
                </div>
                <div className="text-base font-bold text-emerald-400">
                  {currencySymbol} {totalEstimatedValue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isProcessingAction}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isProcessingAction}
              disabled={isProcessingAction || cartItems.length === 0 || activeShops.length < 2}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Execute Stock Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Barcode Camera Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScan}
        title="Source Branch Barcode Scanner"
        description="Scan product barcode to automatically select item for transfer"
      />
    </>
  );
};
