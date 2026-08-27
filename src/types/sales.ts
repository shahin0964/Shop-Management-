/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Product } from './product.ts';

export type PaymentMethod =
  | 'CASH'
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'CARD'
  | 'DUE_CREDIT'
  | 'SPLIT';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'DUE';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  productCode?: string;
  barcode?: string;
  unit: string;
  quantity: number;
  unitPrice: number; // Historical unit selling price at sale time
  costPrice: number; // Historical unit cost price snapshot for future profit analytics
  discount: number; // Item-level discount
  lineTotal: number; // Net line total (quantity * unitPrice - discount)
}

export interface Sale {
  id: string;
  ownerId: string;
  shopId: string;
  saleNumber: string; // e.g., "INV-20260826-0042"
  items: SaleItem[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  platformCreated: 'WEB' | 'ANDROID' | 'WINDOWS';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  discountAmount?: number;
  taxAmount?: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  saleDate?: string;
}

export interface SaleSummary {
  totalSalesCount: number;
  totalSalesAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  todaySalesCount: number;
  todaySalesAmount: number;
}
