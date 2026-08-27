/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentType = 'SALES_RECEIPT' | 'SALES_INVOICE' | 'CUSTOMER_PAYMENT_RECEIPT';

export type PrintPaperFormat = 'THERMAL_80MM' | 'STANDARD_A4';

export interface PrintableShopInfo {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface PrintableCustomerInfo {
  id?: string;
  name?: string;
  phone?: string;
  address?: string;
  isWalkIn: boolean;
}

export interface PrintableLineItem {
  id: string;
  productName: string;
  productCode?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface PrintablePaymentAllocation {
  saleNumber: string;
  allocatedAmount: number;
  remainingDue: number;
}

export interface PrintableDocument {
  documentType: DocumentType;
  paperFormat: PrintPaperFormat;
  referenceNumber: string; // e.g., INV-20260826-0042 or PAY-20260826-0001
  issueDate: string;
  shop: PrintableShopInfo;
  customer?: PrintableCustomerInfo;
  createdBy: string;
  note?: string;
  platformCreated?: string;
  currencySymbol: string;

  // Sales specific fields
  items?: PrintableLineItem[];
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'DUE';
  paymentMethod?: string;

  // Customer Payment specific fields
  paymentId?: string;
  amountCollected?: number;
  remainingCustomerDue?: number;
  paymentAllocation?: PrintablePaymentAllocation[];
}
