/**
 * Inter-Shop Stock Transfer Domain Models
 * Designed for Shop A -> Transfer -> Shop B under the same Owner tenant.
 */

export type TransferStatus = 'COMPLETED' | 'FAILED' | 'DRAFT' | 'PENDING_APPROVAL' | 'DISPATCHED' | 'RECEIVED' | 'REJECTED' | 'CANCELLED';

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string; // Source product ID
  productCode?: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  destinationProductId?: string;
}

export interface StockTransferAuditEntry {
  status: TransferStatus;
  changedBy: string;
  userRole: string;
  timestamp: string;
  notes?: string;
}

export interface StockTransfer {
  id: string;
  ownerId: string; // Tenant reference
  transferNumber: string; // e.g. "TRF-2026-0001"
  sourceShopId: string;
  sourceShopName: string;
  destinationShopId: string;
  destinationShopName: string;
  status: TransferStatus;
  items: StockTransferItem[];
  totalItemCount: number;
  totalQuantity: number;
  totalEstimatedValue: number;
  notes?: string;
  initiatedBy: string;
  createdBy?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  auditTrail?: StockTransferAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferItemInput {
  productId: string;
  quantity: number;
}

export interface CreateStockTransferInput {
  sourceShopId: string;
  destinationShopId: string;
  items: CreateTransferItemInput[];
  notes?: string;
}
