import React, { useState, useEffect } from 'react';
import { Package, QrCode, AlertCircle, Plus, Camera } from 'lucide-react';
import {
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductCategory,
} from '../../types/product.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Modal } from '../common/Modal.tsx';
import { Input } from '../common/Input.tsx';
import { Button } from '../common/Button.tsx';
import { CategoryFormModal } from './CategoryFormModal.tsx';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal.tsx';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateProductInput | UpdateProductInput) => Promise<void>;
  editingProduct?: Product | null;
  categories: ProductCategory[];
  onQuickAddCategory?: (input: { name: string; description?: string }) => Promise<ProductCategory>;
  shopName: string;
}

const COMMON_UNITS = ['pcs', 'box', 'kg', 'meter', 'liter', 'packet', 'dozen', 'roll', 'pair', 'can'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  categories,
  onQuickAddCategory,
  shopName,
}) => {
  const { owner } = useAuth();
  const currencySymbol = owner?.currencySymbol || '৳';

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [customUnit, setCustomUnit] = useState('');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [currentStock, setCurrentStock] = useState<string>('0');
  const [minStockAlert, setMinStockAlert] = useState<string>('5');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuickCategoryModalOpen, setIsQuickCategoryModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCode(editingProduct.code);
      setBarcode(editingProduct.barcode || '');
      setCategoryId(editingProduct.categoryId || '');
      setBrand(editingProduct.brand || '');
      if (COMMON_UNITS.includes(editingProduct.unit)) {
        setUnit(editingProduct.unit);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setCustomUnit(editingProduct.unit);
      }
      setCostPrice(editingProduct.costPrice.toString());
      setSellingPrice(editingProduct.sellingPrice.toString());
      setCurrentStock(editingProduct.currentStock.toString());
      setMinStockAlert(
        editingProduct.minStockAlert !== undefined ? editingProduct.minStockAlert.toString() : ''
      );
      setImageUrl(editingProduct.imageUrl || '');
      setDescription(editingProduct.description || '');
      setIsActive(editingProduct.isActive);
    } else {
      // Reset defaults
      setName('');
      setCode('');
      setBarcode('');
      setCategoryId('');
      setBrand('');
      setUnit('pcs');
      setCustomUnit('');
      setCostPrice('0');
      setSellingPrice('0');
      setCurrentStock('0');
      setMinStockAlert('5');
      setImageUrl('');
      setDescription('');
      setIsActive(true);
    }
    setErrorMessage(null);
  }, [editingProduct, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Product name is required.');
      return;
    }

    const numCost = Number(costPrice);
    const numSelling = Number(sellingPrice);
    const numStock = Number(currentStock);

    if (isNaN(numCost) || numCost < 0) {
      setErrorMessage('Purchase/Cost price must be a valid non-negative number.');
      return;
    }
    if (isNaN(numSelling) || numSelling < 0) {
      setErrorMessage('Selling price must be a valid non-negative number.');
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      setErrorMessage('Current stock quantity must be a non-negative number.');
      return;
    }

    const resolvedUnit = unit === 'custom' ? customUnit.trim() || 'pcs' : unit;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload: CreateProductInput | UpdateProductInput = {
        name: trimmedName,
        code: code.trim() || undefined,
        barcode: barcode.trim() || undefined,
        categoryId: categoryId ? categoryId : null,
        brand: brand.trim() || undefined,
        unit: resolvedUnit,
        costPrice: Math.round((numCost + Number.EPSILON) * 100) / 100,
        sellingPrice: Math.round((numSelling + Number.EPSILON) * 100) / 100,
        currentStock: Math.max(0, numStock),
        minStockAlert: minStockAlert ? Number(minStockAlert) : undefined,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAddCategorySave = async (input: { name: string; description?: string }) => {
    if (onQuickAddCategory) {
      const newCat = await onQuickAddCategory(input);
      setCategoryId(newCat.id);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        description={`Branch: ${shopName} • Product catalog foundation`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Product Identity
            </h4>

            <Input
              label="Product Name"
              placeholder="e.g. TP-Link Archer C6 Dual-Band AC1200 Router"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Dropdown with Quick Add */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">Category</label>
                  {onQuickAddCategory && (
                    <button
                      type="button"
                      onClick={() => setIsQuickCategoryModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  )}
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <Input
                label="Brand / Manufacturer"
                placeholder="e.g. TP-Link, Samsung, Walton"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Barcode Value */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Barcode / EAN-13
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200"
                  >
                    <Camera className="w-3 h-3 text-blue-600" /> Scan Camera
                  </button>
                </div>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. 8901234567890 (unique per shop)"
                      value={barcode}
                      onChange={(e) => {
                        setBarcode(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full text-xs rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Item Code / SKU */}
              <Input
                label="Item Code / SKU"
                placeholder="Auto-generated if blank (e.g. SKU-100234)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing & Stock Section */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pricing & Base Inventory
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cost Price */}
              <Input
                label={`Cost / Purchase Price (${currencySymbol})`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
              />

              {/* Selling Price */}
              <Input
                label={`Selling Price (${currencySymbol})`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Stock Quantity */}
              <Input
                label="Current Stock Quantity"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={currentStock}
                onChange={(e) => {
                  setCurrentStock(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                required
              />

              {/* Unit Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="custom">Custom unit...</option>
                </select>
              </div>

              {/* Min Stock Alert */}
              <Input
                label="Min Stock Alert (Optional)"
                type="number"
                step="1"
                min="0"
                placeholder="e.g. 5"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
              />
            </div>

            {unit === 'custom' && (
              <Input
                label="Custom Unit Name"
                placeholder="e.g. bundle, drum, set"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                required
              />
            )}
          </div>

          {/* Optional Details Section */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Additional Details (Optional)
            </h4>

            <Input
              label="Product Image Reference URL"
              placeholder="https://example.com/images/product.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Description / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Product technical specs or supplier notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors resize-none"
              />
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Product Active Status
                </span>
                <span className="text-[11px] text-slate-500">
                  Inactive products are hidden from standard catalog lookups without breaking history.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Package className="w-4 h-4" />}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Category Creator Modal */}
      {onQuickAddCategory && (
        <CategoryFormModal
          isOpen={isQuickCategoryModalOpen}
          onClose={() => setIsQuickCategoryModalOpen(false)}
          onSave={handleQuickAddCategorySave}
          shopName={shopName}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedValue) => {
          setBarcode(scannedValue);
          setIsScannerOpen(false);
        }}
        title="Scan Product Barcode"
        description="Point Android camera at the product package barcode"
      />
    </>
  );
};
