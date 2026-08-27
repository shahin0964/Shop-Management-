import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  QrCode,
  Edit2,
  Trash2,
  Store,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Archive,
  RotateCcw,
  Camera,
} from 'lucide-react';
import { type Product, type CreateProductInput, type UpdateProductInput } from '../../types/product.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useProduct } from '../../context/ProductContext.tsx';
import { Card } from '../common/Card.tsx';
import { Button } from '../common/Button.tsx';
import { Badge } from '../common/Badge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { ProductFormModal } from '../products/ProductFormModal.tsx';
import { CategoryManagerModal } from '../products/CategoryManagerModal.tsx';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal.tsx';

export const ProductsView: React.FC = () => {
  const { owner } = useAuth();
  const { shops, activeShop, activeShopId, setActiveShopId } = useShop();
  const {
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    showInactive,
    setShowInactive,
    filteredProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
  } = useProduct();

  const currencySymbol = owner?.currencySymbol || '৳';

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Deletion Modal / Action State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Fallback: If no branch is selected, prompt user to pick one
  if (!activeShopId || !activeShop) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product & Category Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a specific branch to view, create, and manage its inventory catalog.
            </p>
          </div>
        </div>

        {shops.length === 0 ? (
          <Card padding="lg" className="border-slate-200">
            <EmptyState
              icon={<Store className="w-6 h-6" />}
              badgeText="Branch Required"
              title="No Branches Available"
              description="To manage products and categories, please register at least one physical branch in the Branches & Shops module first."
            />
          </Card>
        ) : (
          <Card padding="lg" className="border-slate-200">
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Select a Branch to Manage Products</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Product catalogs and barcodes are strictly scoped per physical location. Choose a branch below:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => setActiveShopId(shop.id)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-700">
                      {shop.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                      Code: {shop.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (input: CreateProductInput | UpdateProductInput) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, input);
      setActionAlert({ type: 'success', message: `Product "${input.name || editingProduct.name}" updated successfully.` });
    } else {
      const created = await createProduct(input as CreateProductInput);
      setActionAlert({ type: 'success', message: `Product "${created.name}" created under ${activeShop.name}.` });
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      setActionAlert({
        type: 'success',
        message: `Product "${product.name}" ${product.isActive ? 'deactivated (archived)' : 'reactivated'}.`,
      });
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Failed to toggle product status.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      // Soft-delete to preserve history integrity
      await deleteProduct(deletingProduct.id, false);
      setActionAlert({
        type: 'success',
        message: `Product "${deletingProduct.name}" has been safely archived/deactivated.`,
      });
      setDeletingProduct(null);
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Failed to archive product.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return 'Uncategorized';
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : 'Uncategorized';
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog</h2>
            <Badge variant="platform" size="sm">
              📍 {activeShop.name} ({activeShop.code})
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage products, categories, base pricing, and barcodes for this branch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<Camera className="w-4 h-4 text-blue-600" />}
          >
            Scan Lookup
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCategoryManagerOpen(true)}
            leftIcon={<Tag className="w-4 h-4 text-blue-600" />}
          >
            <span>Categories</span>
            <span className="ml-1 text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
              {categories.length}
            </span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAddProduct}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Success / Error Action Alerts */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-sm px-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Deletion Dialog */}
      {deletingProduct && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-900">
              <p className="font-bold">
                Archive Product &ldquo;{deletingProduct.name}&rdquo;?
              </p>
              <p className="leading-relaxed">
                To protect audit and future transactional history, this product will be deactivated
                and hidden from standard active lookups. You can reactivate it at any time.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingProduct(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Confirm Safe Deactivation
            </Button>
          </div>
        </div>
      )}

      {/* Barcode & Cross-Platform Specification Architecture Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Barcode Architecture Foundation
              </span>
              <Badge variant="platform" size="sm">
                Phone Camera &amp; Scanner Ready
              </Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every product supports a unique barcode value for manual entry or hardware scanner lookups. In future steps, the Android APK will use the smartphone camera directly as the barcode scanner to lookup items instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, barcode, SKU, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Inactive Products Toggle */}
          <button
            type="button"
            onClick={() => setShowInactive(!showInactive)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              showInactive
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Show Inactive ({filteredProducts.filter((p) => !p.isActive).length})</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedCategoryId('uncategorized')}
            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategoryId === 'uncategorized'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Uncategorized
          </button>
        </div>
      </div>

      {/* Product List Content */}
      {isLoading ? (
        <Card padding="lg" className="border-slate-200">
          <div className="text-center py-12 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading catalog for {activeShop.name}...</p>
          </div>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card padding="lg" className="border-slate-200">
          <EmptyState
            icon={<Package className="w-6 h-6" />}
            badgeText={searchQuery ? 'No Results' : 'Catalog Empty'}
            title={searchQuery ? `No products match "${searchQuery}"` : 'No Products Registered'}
            description={
              searchQuery
                ? 'Try adjusting your search keywords, barcode, or category filter.'
                : `This branch (${activeShop.name}) has zero products registered. Click "Add Product" above to create the first catalog entry.`
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop & Tablet Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isLowStock =
                    product.minStockAlert !== undefined && product.currentStock <= product.minStockAlert;
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !product.isActive ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Product Name & Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{product.name}</span>
                            {product.brand && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({product.brand})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {product.code}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" size="sm">
                          {getCategoryName(product.categoryId)}
                        </Badge>
                      </td>

                      {/* Barcode */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {product.barcode ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            <QrCode className="w-3 h-3 text-slate-500" />
                            {product.barcode}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {currencySymbol} {product.costPrice.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {currencySymbol} {product.sellingPrice.toFixed(2)}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
                            isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'text-slate-800'
                          }`}
                        >
                          {product.currentStock} {product.unit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={product.isActive ? 'success' : 'neutral'} size="sm">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleProductStatus(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={product.isActive ? 'Deactivate' : 'Reactivate'}
                          >
                            {product.isActive ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Archive / Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Responsive Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs ${
                  !product.isActive ? 'bg-slate-50 opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">{product.name}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono">{product.code}</span>
                      <span>&bull;</span>
                      <Badge variant="neutral" size="sm">
                        {getCategoryName(product.categoryId)}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={product.isActive ? 'success' : 'neutral'} size="sm">
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {product.barcode && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-100 p-2 rounded-lg">
                    <QrCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>{product.barcode}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Cost
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {currencySymbol} {product.costPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Selling
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {currencySymbol} {product.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Stock
                    </span>
                    <span className="text-xs font-bold text-blue-700">
                      {product.currentStock} {product.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditProduct(product)}
                    leftIcon={<Edit2 className="w-3 h-3" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleProductStatus(product)}
                  >
                    {product.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingProduct(product)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        categories={categories}
        onQuickAddCategory={createCategory}
        shopName={activeShop.name}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        shopName={activeShop.name}
      />

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedValue) => {
          setIsScannerOpen(false);
          setSearchQuery(scannedValue);
          const found = filteredProducts.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === scannedValue.toLowerCase()) ||
              (p.code && p.code.toLowerCase() === scannedValue.toLowerCase())
          );
          if (found) {
            setActionAlert({
              type: 'success',
              message: `Found product "${found.name}" (${currencySymbol} ${found.sellingPrice.toFixed(2)}) for barcode "${scannedValue}".`,
            });
          } else {
            setActionAlert({
              type: 'error',
              message: `Product Not Found: No active product with barcode "${scannedValue}" exists in branch "${activeShop.name}".`,
            });
          }
        }}
        title="Product Lookup Camera Scanner"
        description="Scan product barcode to search catalog records"
      />
    </div>
  );
};
