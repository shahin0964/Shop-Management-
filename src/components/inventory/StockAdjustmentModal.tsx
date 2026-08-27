import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { type Product } from '../../types/product.ts';
import { type CreateStockAdjustmentInput, type StockAdjustmentMode } from '../../types/inventory.ts';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Badge } from '../common/Badge.tsx';
import { useProduct } from '../../context/ProductContext.tsx';
import { useInventory } from '../../context/InventoryContext.tsx';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string | null;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  'Physical Inventory Audit / Count Correction',
  'Damaged / Broken Items',
  'Expired Goods Removal',
  'Surplus / Found Stock',
  'Supplier Return (RMA)',
  'Internal Store Usage',
  'Correction of Entry Error',
  'Other / Custom Reason',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
  onSuccess,
}) => {
  const { products } = useProduct();
  const { adjustStock, isProcessingAction } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [mode, setMode] = useState<StockAdjustmentMode>('SET_EXACT');
  const [amount, setAmount] = useState<string>('0');
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeProducts = useMemo(() => {
    return products.filter((p) => p.isActive);
  }, [products]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setNote('');
      setCustomReason('');
      setSelectedReasonPreset(COMMON_REASONS[0]);
      setMode('SET_EXACT');

      const targetId = initialProductId || (activeProducts.length > 0 ? activeProducts[0].id : '');
      setSelectedProductId(targetId);

      const prod = products.find((p) => p.id === targetId);
      if (prod) {
        setAmount(prod.currentStock.toString());
      } else {
        setAmount('0');
      }
    }
  }, [isOpen, initialProductId, activeProducts, products]);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setAmount(mode === 'SET_EXACT' ? prod.currentStock.toString() : '1');
    }
    setErrorMessage(null);
  };

  const handleModeChange = (newMode: StockAdjustmentMode) => {
    setMode(newMode);
    if (selectedProduct) {
      if (newMode === 'SET_EXACT') {
        setAmount(selectedProduct.currentStock.toString());
      } else {
        setAmount('1');
      }
    }
  };

  const currentStock = Number(selectedProduct?.currentStock || 0);
  const parsedAmount = parseFloat(amount) || 0;

  // Calculate resulting new stock and delta
  let calculatedNewStock = currentStock;
  let deltaQuantity = 0;

  if (mode === 'SET_EXACT') {
    calculatedNewStock = parsedAmount;
    deltaQuantity = calculatedNewStock - currentStock;
  } else if (mode === 'ADD_STOCK') {
    deltaQuantity = parsedAmount;
    calculatedNewStock = currentStock + parsedAmount;
  } else if (mode === 'REMOVE_STOCK') {
    deltaQuantity = -parsedAmount;
    calculatedNewStock = currentStock - parsedAmount;
  }

  const finalReason =
    selectedReasonPreset === 'Other / Custom Reason'
      ? customReason.trim()
      : selectedReasonPreset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Please select a product.');
      return;
    }

    if (parsedAmount < 0) {
      setErrorMessage('Adjustment amount cannot be negative.');
      return;
    }

    if (mode !== 'SET_EXACT' && parsedAmount === 0) {
      setErrorMessage('Adjustment amount must be greater than 0.');
      return;
    }

    if (mode === 'REMOVE_STOCK' && parsedAmount > currentStock) {
      setErrorMessage(
        `Cannot deduct ${parsedAmount} ${selectedProduct?.unit || 'units'}. Current stock is only ${currentStock}.`
      );
      return;
    }

    if (calculatedNewStock < 0) {
      setErrorMessage('Final stock level cannot be negative.');
      return;
    }

    if (!finalReason) {
      setErrorMessage('Please specify an adjustment reason.');
      return;
    }

    const payload: CreateStockAdjustmentInput = {
      productId: selectedProductId,
      mode,
      amount: parsedAmount,
      reason: finalReason,
      note: note.trim() || undefined,
    };

    try {
      await adjustStock(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust stock. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Stock Quantity"
      description="Correct inventory counts, account for damages, or log physical audit adjustments."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Product Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Select Product <span className="text-rose-500">*</span>
          </label>
          {activeProducts.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              No active products available.
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
                  {p.name} {p.code ? `(${p.code})` : ''} - Current: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Adjustment Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Adjustment Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('SET_EXACT')}
              className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-colors cursor-pointer ${
                mode === 'SET_EXACT'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold ring-1 ring-blue-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Set Exact Count
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('ADD_STOCK')}
              className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-colors cursor-pointer ${
                mode === 'ADD_STOCK'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-semibold ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('REMOVE_STOCK')}
              className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-colors cursor-pointer ${
                mode === 'REMOVE_STOCK'
                  ? 'bg-rose-50 border-rose-400 text-rose-700 font-semibold ring-1 ring-rose-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              - Deduct Stock
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label={
              mode === 'SET_EXACT'
                ? 'New Total Counted Stock *'
                : mode === 'ADD_STOCK'
                ? 'Quantity to Add (+)*'
                : 'Quantity to Deduct (-)*'
            }
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            helperText={
              selectedProduct ? `Product Unit: ${selectedProduct.unit}` : undefined
            }
          />
        </div>

        {/* Real-time Calculation Preview Card */}
        {selectedProduct && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Current Recorded Stock:</span>
              <span className="font-semibold text-slate-900">
                {currentStock} {selectedProduct.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Adjustment Delta:</span>
              <span
                className={`font-semibold ${
                  deltaQuantity > 0
                    ? 'text-emerald-600'
                    : deltaQuantity < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {deltaQuantity > 0 ? `+${deltaQuantity}` : deltaQuantity} {selectedProduct.unit}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">Resulting Stock Level:</span>
              <span className="font-bold text-sm text-blue-700">
                {calculatedNewStock} {selectedProduct.unit}
              </span>
            </div>
          </div>
        )}

        {/* Reason Presets */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Adjustment Reason <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedReasonPreset}
            onChange={(e) => setSelectedReasonPreset(e.target.value)}
            className="w-full h-10 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 cursor-pointer"
          >
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Reason input if "Other" selected */}
        {selectedReasonPreset === 'Other / Custom Reason' && (
          <div>
            <Input
              label="Specify Custom Reason *"
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Broken packaging during shelf rearrangement"
              required
            />
          </div>
        )}

        {/* Optional Note */}
        <div>
          <Input
            label="Additional Notes / Reference"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Approved by Store Supervisor"
          />
        </div>

        {/* Actions */}
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
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Save Stock Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
