/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type PaymentMethod } from './sales.ts';

export interface Customer {
  id: string;
  ownerId: string;
  shopId: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  isActive: boolean;
  totalSalesCount?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  currentDue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  address?: string;
  note?: string;
  isActive?: boolean;
}

export interface PaymentAllocation {
  saleId: string;
  saleNumber: string;
  allocatedAmount: number;
  previousDue: number;
  remainingDue: number;
}

export interface CustomerPayment {
  id: string;
  ownerId: string;
  shopId: string;
  customerId: string;
  customerName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
  paymentDate: string;
  allocatedSales: PaymentAllocation[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordCustomerPaymentInput {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
  paymentDate?: string;
}

export interface CustomerDueSummary {
  totalCustomers: number;
  totalDueCustomers: number;
  totalOutstandingDue: number;
  totalCollectedPayments: number;
}
