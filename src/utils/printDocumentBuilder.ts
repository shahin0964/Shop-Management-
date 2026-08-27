/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Sale } from '../types/sales.ts';
import { type CustomerPayment, type Customer } from '../types/customer.ts';
import { type Shop } from '../types/shop.ts';
import {
  PrintableDocument,
  DocumentType,
  PrintPaperFormat,
  PrintableShopInfo,
  PrintableCustomerInfo,
  PrintableLineItem,
} from '../types/print.ts';

/**
 * Builds a PrintableDocument from a real historical Sale object
 */
export function buildSalePrintDocument(
  sale: Sale,
  shop?: Shop | null,
  currencySymbol: string = '৳',
  paperFormat: PrintPaperFormat = 'THERMAL_80MM',
  docType: DocumentType = 'SALES_RECEIPT'
): PrintableDocument {
  const shopInfo: PrintableShopInfo = {
    name: shop?.name || 'Retail Branch',
    code: shop?.code || 'MAIN',
    address: shop?.address,
    phone: shop?.phone,
    email: shop?.email,
  };

  const isWalkIn = !sale.customerName && !sale.customerPhone && !sale.customerId;

  const customerInfo: PrintableCustomerInfo | undefined = isWalkIn
    ? undefined
    : {
        id: sale.customerId,
        name: sale.customerName || undefined,
        phone: sale.customerPhone || undefined,
        isWalkIn: false,
      };

  const items: PrintableLineItem[] = Array.isArray(sale.items)
    ? sale.items.map((item) => ({
        id: item.id || item.productId,
        productName: item.productName || 'Product',
        productCode: item.productCode || item.barcode,
        unit: item.unit || 'pcs',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        discount: Number(item.discount || 0),
        lineTotal: Number(item.lineTotal || 0),
      }))
    : [];

  return {
    documentType: docType,
    paperFormat,
    referenceNumber: sale.saleNumber,
    issueDate: sale.createdAt,
    shop: shopInfo,
    customer: customerInfo,
    createdBy: sale.createdBy || 'Staff',
    note: sale.note,
    platformCreated: sale.platformCreated || 'WEB',
    currencySymbol,

    items,
    subtotalAmount: Number(sale.subtotalAmount || 0),
    discountAmount: Number(sale.discountAmount || 0),
    taxAmount: Number(sale.taxAmount || 0),
    totalAmount: Number(sale.totalAmount || 0),
    paidAmount: Number(sale.paidAmount || 0),
    dueAmount: Number(sale.dueAmount || 0),
    paymentStatus: sale.paymentStatus,
    paymentMethod: sale.paymentMethod,
  };
}

/**
 * Builds a PrintableDocument from a real CustomerPayment record
 */
export function buildPaymentPrintDocument(
  payment: CustomerPayment,
  customer?: Customer | null,
  shop?: Shop | null,
  currencySymbol: string = '৳',
  paperFormat: PrintPaperFormat = 'THERMAL_80MM'
): PrintableDocument {
  const shopInfo: PrintableShopInfo = {
    name: shop?.name || 'Retail Branch',
    code: shop?.code || 'MAIN',
    address: shop?.address,
    phone: shop?.phone,
    email: shop?.email,
  };

  const customerInfo: PrintableCustomerInfo = {
    id: payment.customerId,
    name: payment.customerName || customer?.name,
    phone: customer?.phone,
    address: customer?.address,
    isWalkIn: false,
  };

  const paymentAllocation = Array.isArray(payment.allocatedSales)
    ? payment.allocatedSales.map((alloc) => ({
        saleNumber: alloc.saleNumber,
        allocatedAmount: Number(alloc.allocatedAmount || 0),
        remainingDue: Number(alloc.remainingDue || 0),
      }))
    : [];

  return {
    documentType: 'CUSTOMER_PAYMENT_RECEIPT',
    paperFormat,
    referenceNumber: payment.reference || `PAY-${payment.id.substring(0, 8).toUpperCase()}`,
    issueDate: payment.paymentDate || payment.createdAt,
    shop: shopInfo,
    customer: customerInfo,
    createdBy: payment.createdBy || 'Staff',
    note: payment.note,
    currencySymbol,

    paymentId: payment.id,
    amountCollected: Number(payment.amount || 0),
    paymentMethod: payment.paymentMethod,
    remainingCustomerDue: customer ? Number(customer.currentDue || 0) : undefined,
    paymentAllocation,
  };
}
