import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { type Product } from '../../types/product.ts';
import { type CreatePurchaseInput } from '../../types/inventory.ts';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Badge } from '../common/Badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProduct } from '../../context/ProductContext.tsx';
import { useInventory } from '../../context/InventoryContext.tsx';

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string | null;
  onSuccess?: () => void;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
  onSuccess,
}) => {
  const { owner } = useAuth();
  const { products } = useProduct();
  const { createPurchase, isProcessingAction } = useInventory();

  const currencySymbol = owner?.currencySymbol || '$';

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unitCost, setUnitCost] = useState<string>('0');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [updateProductCostPrice, setUpdateProductCostPrice] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter only active products
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.isActive);
  }, [products]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Reset or populate fields when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setPurchaseDate(today);
      setErrorMessage(null);
      setSupplierName('');
      setInvoiceNumber('');
      setNote('');
      setUpdateProductCostPrice(true);

      const targetId = initialProductId || (activeProducts.length > 0 ? activeProducts[0].id : '');
      setSelectedProductId(targetId);

      const prod = products.find((p) => p.id === targetId);
      if (prod) {
        setUnitCost(prod.costPrice.toString());
      } else {
        setUnitCost('0');
      }
      setQuantity('1');
    }
  }, [isOpen, initialProductId, activeProducts, products]);

  // When selected product changes in dropdown, update default unitCost if not modified
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setUnitCost(prod.costPrice.toString());
    }
    setErrorMessage(null);
  };

  const parsedQty = parseFloat(quantity) || 0;
  const parsedCost = parseFloat(unitCost) || 0;
  const calculatedTotal = Math.round((parsedQty * parsedCost + Number.EPSILON) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Please select a product for this purchase.');
      return;
    }

    if (parsedQty <= 0) {
      setErrorMessage('Purchase quantity must be greater than 0.');
      return;
    }

    if (parsedCost < 0) {
      setErrorMessage('Unit purchase cost must be 0 or higher.');
      return;
    }

    const payload: CreatePurchaseInput = {
      productId: selectedProductId,
      quantity: parsedQty,
      unitCost: parsedCost,
      purchaseDate: purchaseDate || undefined,
      supplierName: supplierName.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      note: note.trim() || undefined,
      updateProductCostPrice,
    };

    try {
      await createPurchase(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record purchase. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Purchase / Stock In"
      description="Add incoming inventory, record historical purchase cost, and update stock."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Product Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Select Product <span className="text-rose-500">*</span>
          </label>
          {activeProducts.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              No active products found in this branch. Please create a product first.
            </div>
          ) : (
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full h-10 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 cursor-pointer"
              required
            >
              <option value="" disabled>
                -- Select a product --
              </option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''} - Current Stock: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Product Context Banner */}
        {selectedProduct && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-900">{selectedProduct.name}</span>
              <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                <span>SKU: {selectedProduct.code || 'N/A'}</span>
                {selectedProduct.barcode && <span>• Barcode: {selectedProduct.barcode}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[11px]">Current In-Hand Stock</div>
              <span className="font-bold text-slate-900 text-sm">
                {selectedProduct.currentStock} {selectedProduct.unit}
              </span>
            </div>
          </div>
        )}

        {/* Quantity & Unit Cost Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Purchase Quantity *"
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              required
              helperText={selectedProduct ? `Unit: ${selectedProduct.unit}` : undefined}
            />
          </div>

          <div>
            <Input
              label={`Purchase Unit Cost (${currencySymbol}) *`}
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
              required
              helperText="Cost per single unit in this batch"
            />
          </div>
        </div>

        {/* Calculated Total Cost Summary */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-blue-900">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Total Purchase Valuation:</span>
          </div>
          <div className="text-right">
            <span className="text-base font-bold text-blue-900">
              {currencySymbol}
              {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Supplier & Invoice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Supplier / Vendor Name"
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Square Distributors Ltd."
            />
          </div>

          <div>
            <Input
              label="Invoice / Challan Number"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-0881"
            />
          </div>
        </div>

        {/* Purchase Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Note / Remarks"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Batch #4, Summer restock"
            />
          </div>
        </div>

        {/* Cost Price Synchronization Option */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={updateProductCostPrice}
              onChange={(e) => setUpdateProductCostPrice(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-slate-300"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block">
                Update product base catalog cost price to {currencySymbol}{parsedCost.toFixed(2)}
              </span>
              <span className="text-slate-500 block mt-0.5">
                If checked, sets the product's catalog standard cost price to this new purchase price for future reference.
              </span>
            </div>
          </label>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isProcessingAction}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isProcessingAction}
            disabled={!selectedProductId || activeProducts.length === 0}
            leftIcon={<ShoppingBag className="w-4 h-4" />}
          >
            Confirm & Add Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
