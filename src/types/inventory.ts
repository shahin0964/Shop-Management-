/**
 * Multi-Shop Inventory & Purchase Domain Models
 * Structured for shop-scoped isolation, atomic movements, and multi-platform compatibility.
 */

export type InventoryMovementType =
  | 'OPENING_STOCK'
  | 'PURCHASE'
  | 'ADJUSTMENT'
  | 'SALE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface InventoryMovement {
  id: string;
  ownerId: string;
  shopId: string;
  productId: string;
  productName: string;
  productCode?: string;
  type: InventoryMovementType;
  quantity: number; // Positive for additions, negative for deductions
  previousStock: number;
  newStock: number;
  referenceId?: string; // e.g. purchaseId, invoice number, or transfer order ID
  reason?: string;
  note?: string;
  createdBy: string;
  createdAt: string; // ISO 8601
}

export interface Purchase {
  id: string;
  ownerId: string;
  shopId: string;
  productId: string;
  productName: string;
  productCode?: string;
  barcode?: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchaseDate: string; // YYYY-MM-DD or ISO
  supplierName?: string;
  invoiceNumber?: string;
  note?: string;
  createdBy: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface CreatePurchaseInput {
  productId: string;
  quantity: number;
  unitCost: number;
  purchaseDate?: string;
  supplierName?: string;
  invoiceNumber?: string;
  note?: string;
  updateProductCostPrice?: boolean;
}

export type StockAdjustmentMode = 'SET_EXACT' | 'ADD_STOCK' | 'REMOVE_STOCK';

export interface CreateStockAdjustmentInput {
  productId: string;
  mode: StockAdjustmentMode;
  amount: number; // If SET_EXACT -> new exact stock; If ADD_STOCK -> delta to add; If REMOVE_STOCK -> delta to remove
  reason: string;
  note?: string;
}

export interface ShopInventorySummary {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockQuantity: number;
  totalInventoryCostValue: number;
  totalInventoryRetailValue: number;
}
