/**
 * Product & Category Domain Models
 * Structured for multi-shop scoping, barcode indexing, and multi-platform compatibility.
 */

export interface Product {
  id: string;
  ownerId: string; // Tenant reference
  shopId: string; // Shop/Branch reference
  name: string;
  code: string; // SKU or item reference
  barcode?: string; // Barcode value for manual entry or phone camera lookup
  categoryId?: string | null; // Stable reference to Category ID
  brand?: string;
  unit: string; // 'pcs', 'kg', 'box', 'meter', 'liter', 'packet', etc.
  costPrice: number; // Base purchase / cost price
  sellingPrice: number; // Base selling price
  currentStock: number; // Base stock count
  minStockAlert?: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean; // For active status & safe deactivation
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  code?: string;
  barcode?: string;
  categoryId?: string | null;
  brand?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert?: number;
  description?: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  code?: string;
  barcode?: string;
  categoryId?: string | null;
  brand?: string;
  unit?: string;
  costPrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  minStockAlert?: number;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductCategory {
  id: string;
  ownerId: string;
  shopId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name: string;
  description?: string;
}
