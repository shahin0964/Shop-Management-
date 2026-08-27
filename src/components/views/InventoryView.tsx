import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ShoppingBag,
  SlidersHorizontal,
  History,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  FileSpreadsheet,
  Building,
  Store,
} from 'lucide-react';
import { type Product } from '../../types/product.ts';
import { type Purchase, type InventoryMovement } from '../../types/inventory.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useProduct } from '../../context/ProductContext.tsx';
import { useInventory } from '../../context/InventoryContext.tsx';
import { Card } from '../common/Card.tsx';
import { Badge } from '../common/Badge.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { PurchaseFormModal } from '../inventory/PurchaseFormModal.tsx';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal.tsx';
import { StockMovementHistoryModal } from '../inventory/StockMovementHistoryModal.tsx';

type InventoryTab = 'stock' | 'purchases' | 'movements';

export const InventoryView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShopId, activeShop, shops } = useShop();
  const { products, categories, isLoading: isProductsLoading } = useProduct();
  const {
    purchases,
    movements,
    summary,
    isLoading: isInventoryLoading,
    refreshInventory,
    error,
    clearError,
  } = useInventory();

  const currencySymbol = owner?.currencySymbol || '$';

  // Sub-tab selection
  const [activeTab, setActiveTab] = useState<InventoryTab>('stock');

  // Search & Filter States for Stock View
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Search & Filter States for Purchases View
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState<string>('');

  // Search & Filter States for Movements View
  const [movementSearchQuery, setMovementSearchQuery] = useState<string>('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);

  // Filtered Products for Inventory Table
  const filteredProducts = useMemo(() => {
    const query = stockSearchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.isActive) return false;

      // Category Filter
      if (selectedCategoryId !== 'ALL') {
        if (selectedCategoryId === 'uncategorized') {
          if (p.categoryId) return false;
        } else if (p.categoryId !== selectedCategoryId) {
          return false;
        }
      }

      // Stock Status Filter
      const stock = Number(p.currentStock || 0);
      const minAlert = p.minStockAlert !== undefined ? Number(p.minStockAlert) : 5;

      if (stockStatusFilter === 'OUT_OF_STOCK' && stock > 0) return false;
      if (stockStatusFilter === 'LOW_STOCK' && (stock === 0 || stock > minAlert)) return false;
      if (stockStatusFilter === 'IN_STOCK' && stock <= minAlert) return false;

      // Search Query
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesBarcode = p.barcode?.toLowerCase().includes(query) ?? false;
        const matchesCode = p.code?.toLowerCase().includes(query) ?? false;
        const matchesBrand = p.brand?.toLowerCase().includes(query) ?? false;
        return matchesName || matchesBarcode || matchesCode || matchesBrand;
      }

      return true;
    });
  }, [products, stockSearchQuery, selectedCategoryId, stockStatusFilter]);

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    const query = purchaseSearchQuery.trim().toLowerCase();
    if (!query) return purchases;
    return purchases.filter(
      (p) =>
        p.productName.toLowerCase().includes(query) ||
        p.supplierName?.toLowerCase().includes(query) ||
        p.invoiceNumber?.toLowerCase().includes(query) ||
        p.productCode?.toLowerCase().includes(query) ||
        p.note?.toLowerCase().includes(query)
    );
  }, [purchases, purchaseSearchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    let list = movements;
    if (movementTypeFilter !== 'ALL') {
      list = list.filter((m) => m.type === movementTypeFilter);
    }
    const query = movementSearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (m) =>
          m.productName.toLowerCase().includes(query) ||
          m.reason?.toLowerCase().includes(query) ||
          m.note?.toLowerCase().includes(query) ||
          m.referenceId?.toLowerCase().includes(query) ||
          m.productCode?.toLowerCase().includes(query)
      );
    }
    return list;
  }, [movements, movementTypeFilter, movementSearchQuery]);

  const openPurchaseModal = (product?: Product) => {
    setTargetProduct(product || null);
    setIsPurchaseModalOpen(true);
  };

  const openAdjustmentModal = (product?: Product) => {
    setTargetProduct(product || null);
    setIsAdjustmentModalOpen(true);
  };

  const openHistoryModal = (product?: Product) => {
    setTargetProduct(product || null);
    setIsHistoryModalOpen(true);
  };

  const getStockStatusBadge = (product: Product) => {
    const stock = Number(product.currentStock || 0);
    const minAlert = product.minStockAlert !== undefined ? Number(product.minStockAlert) : 5;

    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
          <AlertCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (stock <= minAlert) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3 h-3" />
          Low Stock ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
        <CheckCircle2 className="w-3 h-3" />
        In Stock
      </span>
    );
  };

  if (!activeShopId) {
    return (
      <Card padding="lg" className="border-slate-200">
        <EmptyState
          icon={<Store className="w-6 h-6 text-slate-400" />}
          badgeText="Branch Selection Required"
          title="No Active Branch Selected"
          description="Please select a branch from the top navigation bar to view and manage inventory records."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header with Branch Info and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Inventory & Purchase Management
            </h2>
            <Badge variant="neutral">{activeShop?.name || 'Active Branch'}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain shop-level stock quantities, record purchases with historical costs, and track movement audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshInventory()}
            isLoading={isInventoryLoading || isProductsLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openHistoryModal()}
            leftIcon={<History className="w-3.5 h-3.5" />}
          >
            Audit Log
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAdjustmentModal()}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Adjust Stock
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openPurchaseModal()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Record Purchase
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs font-semibold underline hover:text-rose-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real-time Inventory Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Units */}
        <div
          onClick={() => {
            setActiveTab('stock');
            setStockStatusFilter('ALL');
          }}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Stock Quantity</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {summary.totalStockQuantity.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">
              across {summary.totalProducts} items
            </span>
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div
          onClick={() => {
            setActiveTab('stock');
            setStockStatusFilter('LOW_STOCK');
          }}
          className={`p-4 rounded-xl border shadow-2xs transition-colors cursor-pointer ${
            stockStatusFilter === 'LOW_STOCK'
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Low Stock Alert</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-900">
              {summary.lowStockProducts}
            </span>
            <span className="text-[11px] text-amber-700">Needs restock</span>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div
          onClick={() => {
            setActiveTab('stock');
            setStockStatusFilter('OUT_OF_STOCK');
          }}
          className={`p-4 rounded-xl border shadow-2xs transition-colors cursor-pointer ${
            stockStatusFilter === 'OUT_OF_STOCK'
              ? 'bg-rose-50/70 border-rose-300'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Out of Stock</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-900">
              {summary.outOfStockProducts}
            </span>
            <span className="text-[11px] text-rose-700">0 stock available</span>
          </div>
        </div>

        {/* Inventory Total Cost Valuation */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inventory Cost Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {currencySymbol}
              {summary.totalInventoryCostValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400">
              Retail: {currencySymbol}
              {summary.totalInventoryRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Inventory Stock</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">
            {products.filter((p) => p.isActive).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'purchases'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Purchase Records</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">
            {purchases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Movement Audit Trail</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">
            {movements.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVENTORY STOCK VIEW                                              */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex-1">
              <Input
                type="text"
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, barcode, or brand..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock (Good)</option>
                <option value="LOW_STOCK">Low Stock (Alert)</option>
                <option value="OUT_OF_STOCK">Out of Stock (Zero)</option>
              </select>
            </div>
          </div>

          {/* Product Stock Table */}
          {filteredProducts.length === 0 ? (
            <Card padding="lg" className="border-slate-200">
              <EmptyState
                icon={<Package className="w-6 h-6 text-slate-400" />}
                badgeText="Zero Inventory Items"
                title="No Products Found"
                description={
                  stockSearchQuery || selectedCategoryId !== 'ALL' || stockStatusFilter !== 'ALL'
                    ? 'No products match the selected search or filter criteria. Try clearing your filters.'
                    : `No products have been registered for ${activeShop?.name || 'this branch'} yet.`
                }
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openPurchaseModal()}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      + Record Purchase
                    </Button>
                  </div>
                }
              />
            </Card>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product & SKU</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">In-Hand Stock</th>
                      <th className="px-4 py-3 font-semibold text-right">Cost Price</th>
                      <th className="px-4 py-3 font-semibold text-right">Stock Valuation</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => {
                      const category = categories.find((c) => c.id === prod.categoryId);
                      const currentStock = Number(prod.currentStock || 0);
                      const costValuation = Math.round(currentStock * Number(prod.costPrice || 0) * 100) / 100;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Product Info */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 text-sm">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>SKU: {prod.code || 'N/A'}</span>
                              {prod.barcode && <span>• Barcode: {prod.barcode}</span>}
                              {prod.brand && <span>• Brand: {prod.brand}</span>}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant="neutral" size="sm">
                              {category?.name || 'Uncategorized'}
                            </Badge>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStockStatusBadge(prod)}
                          </td>

                          {/* In-Hand Stock */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {currentStock}
                            </span>
                            <span className="text-slate-500 ml-1">{prod.unit}</span>
                          </td>

                          {/* Unit Cost Price */}
                          <td className="px-4 py-3 text-right whitespace-nowrap text-slate-700">
                            {currencySymbol}
                            {prod.costPrice.toFixed(2)}
                          </td>

                          {/* Total Valuation */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="font-semibold text-slate-900">
                              {currencySymbol}
                              {costValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Row Quick Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openPurchaseModal(prod)}
                                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                title="Record Purchase / Stock In"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Stock In</span>
                              </button>

                              <button
                                onClick={() => openAdjustmentModal(prod)}
                                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                title="Adjust Stock Quantity"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Adjust</span>
                              </button>

                              <button
                                onClick={() => openHistoryModal(prod)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="View Movement Audit History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PURCHASE RECORDS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {/* Purchase Search Bar & Quick Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex-1">
              <Input
                type="text"
                value={purchaseSearchQuery}
                onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                placeholder="Search purchases by product, invoice number, supplier..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => openPurchaseModal()}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              + Record Purchase
            </Button>
          </div>

          {filteredPurchases.length === 0 ? (
            <Card padding="lg" className="border-slate-200">
              <EmptyState
                icon={<ShoppingBag className="w-6 h-6 text-slate-400" />}
                badgeText="Zero Purchases"
                title="No Purchase Records"
                description={
                  purchaseSearchQuery
                    ? 'No purchases match your search query.'
                    : `No purchase transactions have been recorded for ${activeShop?.name || 'this branch'} yet. Click "+ Record Purchase" to stock in your first batch.`
                }
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openPurchaseModal()}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    + Record Purchase
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Purchase Date</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                      <th className="px-4 py-3 font-semibold text-right">Unit Cost</th>
                      <th className="px-4 py-3 font-semibold text-right">Total Cost</th>
                      <th className="px-4 py-3 font-semibold">Supplier / Invoice</th>
                      <th className="px-4 py-3 font-semibold">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {p.purchaseDate}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{p.productName}</div>
                          {p.productCode && (
                            <span className="text-[11px] text-slate-400">{p.productCode}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-sm">+{p.quantity}</span>
                          <span className="text-slate-500 ml-1">{p.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-slate-700">
                          {currencySymbol}
                          {p.unitCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-slate-900">
                          {currencySymbol}
                          {p.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          {p.supplierName ? (
                            <div className="text-slate-900 font-medium">{p.supplierName}</div>
                          ) : (
                            <span className="text-slate-400 italic">No supplier</span>
                          )}
                          {p.invoiceNumber && (
                            <div className="text-[11px] text-blue-600 font-mono">
                              Inv: {p.invoiceNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          {p.createdBy || 'Owner'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MOVEMENT AUDIT TRAIL                                              */}
      {/* ========================================================================= */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          {/* Movement Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex-1">
              <Input
                type="text"
                value={movementSearchQuery}
                onChange={(e) => setMovementSearchQuery(e.target.value)}
                placeholder="Search reasons, notes, reference numbers..."
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Movement Types</option>
                <option value="PURCHASE">Purchases / Stock In</option>
                <option value="ADJUSTMENT">Stock Adjustments</option>
                <option value="OPENING_STOCK">Opening Stock</option>
              </select>
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <Card padding="lg" className="border-slate-200">
              <EmptyState
                icon={<History className="w-6 h-6 text-slate-400" />}
                badgeText="Zero Movements"
                title="No Movement Logs"
                description={
                  movementSearchQuery || movementTypeFilter !== 'ALL'
                    ? 'No inventory movements match the active filters.'
                    : 'No stock movements recorded yet. Movements are generated automatically on purchases, adjustments, and initial stock entries.'
                }
              />
            </Card>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Timestamp</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Movement Type</th>
                      <th className="px-4 py-3 font-semibold text-right">Delta Change</th>
                      <th className="px-4 py-3 font-semibold text-right">Stock Level</th>
                      <th className="px-4 py-3 font-semibold">Reason & Audit Note</th>
                      <th className="px-4 py-3 font-semibold">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMovements.map((mov) => {
                      const isPositive = mov.quantity > 0;
                      const isNegative = mov.quantity < 0;
                      const dateFormatted = new Date(mov.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                            {dateFormatted}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{mov.productName}</div>
                            {mov.productCode && (
                              <span className="text-[11px] text-slate-400">{mov.productCode}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {mov.type === 'PURCHASE' && (
                              <Badge variant="success" size="sm">Purchase / Stock In</Badge>
                            )}
                            {mov.type === 'ADJUSTMENT' && (
                              <Badge variant="warning" size="sm">Stock Adjustment</Badge>
                            )}
                            {mov.type === 'OPENING_STOCK' && (
                              <Badge variant="info" size="sm">Opening Stock</Badge>
                            )}
                            {mov.type === 'SALE' && (
                              <Badge variant="neutral" size="sm">POS Sale</Badge>
                            )}
                            {mov.type === 'TRANSFER_IN' && (
                              <Badge variant="info" size="sm">Transfer In</Badge>
                            )}
                            {mov.type === 'TRANSFER_OUT' && (
                              <Badge variant="danger" size="sm">Transfer Out</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span
                              className={`font-bold inline-flex items-center gap-1 ${
                                isPositive
                                  ? 'text-emerald-600'
                                  : isNegative
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : isNegative ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : null}
                              {isPositive ? `+${mov.quantity}` : mov.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-slate-400">{mov.previousStock}</span>
                            <span className="text-slate-300 mx-1.5">→</span>
                            <span className="font-semibold text-slate-900">{mov.newStock}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-900 font-medium">{mov.reason || '—'}</div>
                            {mov.note && (
                              <div className="text-slate-500 text-[11px]">{mov.note}</div>
                            )}
                            {mov.referenceId && (
                              <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                                Ref: {mov.referenceId}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                            {mov.createdBy || 'Owner'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Purchase / Stock In Modal */}
      <PurchaseFormModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setTargetProduct(null);
        }}
        initialProductId={targetProduct?.id}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setTargetProduct(null);
        }}
        initialProductId={targetProduct?.id}
      />

      {/* Stock Movement History Modal */}
      <StockMovementHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setTargetProduct(null);
        }}
        product={targetProduct}
      />
    </div>
  );
};
