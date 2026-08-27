/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  type Customer,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerPayment,
  type RecordCustomerPaymentInput,
  type PaymentAllocation,
  type CustomerDueSummary,
} from '../types/customer.ts';
import { type Sale } from '../types/sales.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { normalizeCurrencyNumber } from './productService.ts';
import { SalesService } from './salesService.ts';

const CUSTOMER_STORAGE_PREFIX = 'sms_shop_customers_';
const PAYMENT_STORAGE_PREFIX = 'sms_shop_payments_';

export class CustomerService {
  private static getCustomerStorageKey(ownerId: string, shopId: string): string {
    return `${CUSTOMER_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  private static getPaymentStorageKey(ownerId: string, shopId: string): string {
    return `${PAYMENT_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  /**
   * Fetch all customers for a specific shop
   */
  static async getCustomers(ownerId: string, shopId: string): Promise<Customer[]> {
    if (!ownerId || !shopId) return [];

    let customers: Customer[] = [];

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/customers`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'customers')
        );

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          customers.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            name: data.name || '',
            phone: data.phone || undefined,
            address: data.address || undefined,
            note: data.note || undefined,
            isActive: data.isActive !== false,
            totalSalesCount: Number(data.totalSalesCount || 0),
            totalInvoiced: normalizeCurrencyNumber(Number(data.totalInvoiced || 0)),
            totalPaid: normalizeCurrencyNumber(Number(data.totalPaid || 0)),
            currentDue: normalizeCurrencyNumber(Number(data.currentDue || 0)),
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    } else {
      const key = this.getCustomerStorageKey(ownerId, shopId);
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          customers = JSON.parse(raw);
        } catch (e) {
          console.error('[CustomerService] Error parsing cached customers:', e);
          customers = [];
        }
      }
    }

    // Sort alphabetically by name
    return customers.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Fetch all ledger payments for a specific shop
   */
  static async getPayments(ownerId: string, shopId: string): Promise<CustomerPayment[]> {
    if (!ownerId || !shopId) return [];

    let payments: CustomerPayment[] = [];

    const key = this.getPaymentStorageKey(ownerId, shopId);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        payments = JSON.parse(raw);
      } catch (e) {
        console.error('[CustomerService] Error parsing cached payments:', e);
        payments = [];
      }
    }
    return payments;
  }

  /**
   * Fetch single customer by ID
   */
  static async getCustomerById(
    ownerId: string,
    shopId: string,
    customerId: string
  ): Promise<Customer | null> {
    if (!ownerId || !shopId || !customerId) return null;

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/customers/${customerId}`;
      try {
        const docSnap = await getDoc(
          doc(db, 'owners', ownerId, 'shops', shopId, 'customers', customerId)
        );
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: data.ownerId || ownerId,
          shopId: data.shopId || shopId,
          name: data.name || '',
          phone: data.phone || undefined,
          address: data.address || undefined,
          note: data.note || undefined,
          isActive: data.isActive !== false,
          totalSalesCount: Number(data.totalSalesCount || 0),
          totalInvoiced: normalizeCurrencyNumber(Number(data.totalInvoiced || 0)),
          totalPaid: normalizeCurrencyNumber(Number(data.totalPaid || 0)),
          currentDue: normalizeCurrencyNumber(Number(data.currentDue || 0)),
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }
    } else {
      const customers = await this.getCustomers(ownerId, shopId);
      return customers.find((c) => c.id === customerId) || null;
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(
    ownerId: string,
    shopId: string,
    input: CreateCustomerInput
  ): Promise<Customer> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to register a customer.');
    }

    const trimmedName = input.name?.trim();
    if (!trimmedName) {
      throw new Error('Customer name is required.');
    }

    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newCustomer: Customer = {
      id: customerId,
      ownerId,
      shopId,
      name: trimmedName,
      phone: input.phone?.trim() || undefined,
      address: input.address?.trim() || undefined,
      note: input.note?.trim() || undefined,
      isActive: true,
      totalSalesCount: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      currentDue: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/customers/${customerId}`;
      try {
        await setDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'customers', customerId), {
          id: customerId,
          ownerId,
          shopId,
          name: newCustomer.name,
          phone: newCustomer.phone || '',
          address: newCustomer.address || '',
          note: newCustomer.note || '',
          isActive: true,
          totalSalesCount: 0,
          totalInvoiced: 0,
          totalPaid: 0,
          currentDue: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    // Update local cache
    const key = this.getCustomerStorageKey(ownerId, shopId);
    const existing = await this.getCustomers(ownerId, shopId);
    localStorage.setItem(key, JSON.stringify([...existing, newCustomer]));

    return newCustomer;
  }

  /**
   * Update existing customer profile
   */
  static async updateCustomer(
    ownerId: string,
    shopId: string,
    customerId: string,
    input: UpdateCustomerInput
  ): Promise<Customer> {
    if (!ownerId || !shopId || !customerId) {
      throw new Error('Owner ID, Shop ID, and Customer ID are required.');
    }

    const nowIso = new Date().toISOString();
    let updatedCustomer: Customer;

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/customers/${customerId}`;
      try {
        const updatePayload: Record<string, any> = {
          updatedAt: serverTimestamp(),
        };

        if (input.name !== undefined) updatePayload.name = input.name.trim();
        if (input.phone !== undefined) updatePayload.phone = input.phone.trim();
        if (input.address !== undefined) updatePayload.address = input.address.trim();
        if (input.note !== undefined) updatePayload.note = input.note.trim();
        if (input.isActive !== undefined) updatePayload.isActive = Boolean(input.isActive);

        await updateDoc(
          doc(db, 'owners', ownerId, 'shops', shopId, 'customers', customerId),
          updatePayload
        );

        const current = await this.getCustomerById(ownerId, shopId, customerId);
        if (!current) throw new Error('Customer not found after update.');
        updatedCustomer = current;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
        throw err;
      }
    } else {
      const customers = await this.getCustomers(ownerId, shopId);
      const index = customers.findIndex((c) => c.id === customerId);
      if (index === -1) {
        throw new Error(`Customer with ID "${customerId}" not found.`);
      }

      updatedCustomer = {
        ...customers[index],
        name: input.name !== undefined ? input.name.trim() : customers[index].name,
        phone: input.phone !== undefined ? input.phone.trim() : customers[index].phone,
        address: input.address !== undefined ? input.address.trim() : customers[index].address,
        note: input.note !== undefined ? input.note.trim() : customers[index].note,
        isActive: input.isActive !== undefined ? Boolean(input.isActive) : customers[index].isActive,
        updatedAt: nowIso,
      };

      customers[index] = updatedCustomer;
      localStorage.setItem(this.getCustomerStorageKey(ownerId, shopId), JSON.stringify(customers));
    }

    return updatedCustomer;
  }

  /**
   * Safe delete or deactivation:
   * If customer has sales or payments, deactivates them (isActive = false).
   * If customer has 0 sales and 0 payments, deletes the document.
   */
  static async deleteOrDeactivateCustomer(
    ownerId: string,
    shopId: string,
    customerId: string
  ): Promise<{ action: 'DEACTIVATED' | 'DELETED'; customer: Customer | null }> {
    const customer = await this.getCustomerById(ownerId, shopId, customerId);
    if (!customer) {
      throw new Error(`Customer with ID "${customerId}" not found.`);
    }

    // Check if customer has any associated sales
    const sales = await SalesService.getSales(ownerId, shopId);
    const customerSales = sales.filter((s) => s.customerId === customerId);
    const payments = await this.getCustomerPayments(ownerId, shopId, customerId);

    const hasTransactions = customerSales.length > 0 || payments.length > 0;

    if (hasTransactions) {
      // Soft-delete / deactivate
      const deactivated = await this.updateCustomer(ownerId, shopId, customerId, {
        isActive: false,
      });
      return { action: 'DEACTIVATED', customer: deactivated };
    }

    // Hard delete if completely clean
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/customers/${customerId}`;
      try {
        await deleteDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'customers', customerId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }

    const key = this.getCustomerStorageKey(ownerId, shopId);
    const existing = await this.getCustomers(ownerId, shopId);
    const filtered = existing.filter((c) => c.id !== customerId);
    localStorage.setItem(key, JSON.stringify(filtered));

    return { action: 'DELETED', customer: null };
  }

  /**
   * Fetch all payment receipts for a customer
   */
  static async getCustomerPayments(
    ownerId: string,
    shopId: string,
    customerId: string
  ): Promise<CustomerPayment[]> {
    if (!ownerId || !shopId || !customerId) return [];

    let payments: CustomerPayment[] = [];

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/customers/${customerId}/payments`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'customers', customerId, 'payments')
        );

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          payments.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            customerId: data.customerId || customerId,
            customerName: data.customerName || undefined,
            amount: normalizeCurrencyNumber(Number(data.amount || 0)),
            paymentMethod: data.paymentMethod || 'CASH',
            reference: data.reference || undefined,
            note: data.note || undefined,
            paymentDate: data.paymentDate || docSnap.id,
            allocatedSales: Array.isArray(data.allocatedSales) ? data.allocatedSales : [],
            createdBy: data.createdBy || 'Owner',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    } else {
      const key = this.getPaymentStorageKey(ownerId, shopId);
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const allPayments: CustomerPayment[] = JSON.parse(raw);
          payments = allPayments.filter((p) => p.customerId === customerId);
        } catch (e) {
          console.error('[CustomerService] Error parsing payments cache:', e);
        }
      }
    }

    return payments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Fetch all shop payments (across all customers in this shop)
   */
  static async getAllShopPayments(ownerId: string, shopId: string): Promise<CustomerPayment[]> {
    if (!ownerId || !shopId) return [];

    const customers = await this.getCustomers(ownerId, shopId);
    const allPayments: CustomerPayment[] = [];

    for (const cust of customers) {
      const custPayments = await this.getCustomerPayments(ownerId, shopId, cust.id);
      allPayments.push(...custPayments);
    }

    return allPayments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Atomic Customer Payment & Oldest-Due-First Allocation:
   * 1. Validates payment amount > 0.
   * 2. Fetches all sales for this customer with outstanding due (`dueAmount > 0`), sorted ASC by date (oldest first).
   * 3. Calculates total current due. Rejects payment if amount > total outstanding due.
   * 4. Allocates payment amount to oldest sales sequentially until amount is exhausted.
   * 5. Atomically commits sale updates and payment record in Firestore writeBatch or local store.
   * 6. Updates customer ledger stats.
   */
  static async recordCustomerPayment(
    ownerId: string,
    shopId: string,
    input: RecordCustomerPaymentInput,
    createdBy: string = 'Owner'
  ): Promise<{
    payment: CustomerPayment;
    updatedSales: Sale[];
    customer: Customer;
  }> {
    if (!ownerId || !shopId || !input.customerId) {
      throw new Error('Owner ID, Shop ID, and Customer ID are required.');
    }

    const payAmount = normalizeCurrencyNumber(Number(input.amount));
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const customer = await this.getCustomerById(ownerId, shopId, input.customerId);
    if (!customer) {
      throw new Error(`Customer with ID "${input.customerId}" not found.`);
    }

    // 1. Fetch customer's sales
    const allSales = await SalesService.getSales(ownerId, shopId);
    const customerUnpaidSales = allSales
      .filter((s) => s.customerId === customer.id && Number(s.dueAmount || 0) > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Oldest first

    const totalOutstandingDue = normalizeCurrencyNumber(
      customerUnpaidSales.reduce((sum, s) => sum + Number(s.dueAmount || 0), 0)
    );

    if (totalOutstandingDue <= 0) {
      throw new Error(`Customer "${customer.name}" has no outstanding due balance to settle.`);
    }

    if (payAmount > totalOutstandingDue) {
      throw new Error(
        `Payment amount of ৳${payAmount.toFixed(2)} exceeds customer's total outstanding due of ৳${totalOutstandingDue.toFixed(2)}.`
      );
    }

    // 2. Oldest-Due-First Allocation
    let remainingToAllocate = payAmount;
    const allocations: PaymentAllocation[] = [];
    const salesToUpdate: Array<{
      sale: Sale;
      newPaid: number;
      newDue: number;
      newStatus: 'PAID' | 'PARTIAL' | 'DUE';
    }> = [];

    for (const sale of customerUnpaidSales) {
      if (remainingToAllocate <= 0) break;

      const currentSaleDue = normalizeCurrencyNumber(Number(sale.dueAmount || 0));
      const allocatedPortion = normalizeCurrencyNumber(Math.min(remainingToAllocate, currentSaleDue));
      const newDue = normalizeCurrencyNumber(currentSaleDue - allocatedPortion);
      const newPaid = normalizeCurrencyNumber(Number(sale.paidAmount || 0) + allocatedPortion);
      const newStatus: 'PAID' | 'PARTIAL' | 'DUE' = newDue === 0 ? 'PAID' : 'PARTIAL';

      allocations.push({
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        allocatedAmount: allocatedPortion,
        previousDue: currentSaleDue,
        remainingDue: newDue,
      });

      salesToUpdate.push({
        sale: {
          ...sale,
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newStatus,
          updatedAt: new Date().toISOString(),
        },
        newPaid,
        newDue,
        newStatus,
      });

      remainingToAllocate = normalizeCurrencyNumber(remainingToAllocate - allocatedPortion);
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const paymentDate = input.paymentDate || nowIso;

    const newPayment: CustomerPayment = {
      id: paymentId,
      ownerId,
      shopId,
      customerId: customer.id,
      customerName: customer.name,
      amount: payAmount,
      paymentMethod: input.paymentMethod || 'CASH',
      reference: input.reference?.trim() || undefined,
      note: input.note?.trim() || undefined,
      paymentDate,
      allocatedSales: allocations,
      createdBy,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 3. Execution: Cloud Firestore Atomic Write Batch
    if (isCloudConnected && db) {
      const paymentPath = `owners/${ownerId}/shops/${shopId}/customers/${customer.id}/payments/${paymentId}`;
      try {
        const batch = writeBatch(db);

        // A. Set Payment Document
        const payRef = doc(
          db,
          'owners',
          ownerId,
          'shops',
          shopId,
          'customers',
          customer.id,
          'payments',
          paymentId
        );
        batch.set(payRef, {
          id: paymentId,
          ownerId,
          shopId,
          customerId: customer.id,
          customerName: customer.name,
          amount: payAmount,
          paymentMethod: newPayment.paymentMethod,
          reference: newPayment.reference || '',
          note: newPayment.note || '',
          paymentDate,
          allocatedSales: allocations,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // B. Update each affected Sale Document
        for (const item of salesToUpdate) {
          const saleRef = doc(db, 'owners', ownerId, 'shops', shopId, 'sales', item.sale.id);
          batch.update(saleRef, {
            paidAmount: item.newPaid,
            dueAmount: item.newDue,
            paymentStatus: item.newStatus,
            updatedAt: serverTimestamp(),
          });
        }

        // C. Update Customer Document
        const newCustomerDue = normalizeCurrencyNumber(totalOutstandingDue - payAmount);
        const newCustomerPaid = normalizeCurrencyNumber(Number(customer.totalPaid || 0) + payAmount);

        const custRef = doc(db, 'owners', ownerId, 'shops', shopId, 'customers', customer.id);
        batch.update(custRef, {
          totalPaid: newCustomerPaid,
          currentDue: newCustomerDue,
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, paymentPath);
      }
    }

    // 4. Update Local Caches (for fast offline support)
    // Update Sales Cache
    const salesKey = `sms_shop_sales_${ownerId}_${shopId}`;
    const allCurrentSales = await SalesService.getSales(ownerId, shopId);
    const updatedAllSales = allCurrentSales.map((s) => {
      const match = salesToUpdate.find((u) => u.sale.id === s.id);
      return match ? match.sale : s;
    });
    localStorage.setItem(salesKey, JSON.stringify(updatedAllSales));

    // Update Customer Payments Cache
    const payKey = this.getPaymentStorageKey(ownerId, shopId);
    const existingRaw = localStorage.getItem(payKey);
    let allStoredPayments: CustomerPayment[] = [];
    if (existingRaw) {
      try {
        allStoredPayments = JSON.parse(existingRaw);
      } catch (e) {
        allStoredPayments = [];
      }
    }
    localStorage.setItem(payKey, JSON.stringify([newPayment, ...allStoredPayments]));

    // Update Customer Cache
    const updatedCustomer: Customer = {
      ...customer,
      totalPaid: normalizeCurrencyNumber(Number(customer.totalPaid || 0) + payAmount),
      currentDue: normalizeCurrencyNumber(totalOutstandingDue - payAmount),
      updatedAt: nowIso,
    };
    const custKey = this.getCustomerStorageKey(ownerId, shopId);
    const existingCustomers = await this.getCustomers(ownerId, shopId);
    const updatedCustomersList = existingCustomers.map((c) =>
      c.id === customer.id ? updatedCustomer : c
    );
    localStorage.setItem(custKey, JSON.stringify(updatedCustomersList));

    return {
      payment: newPayment,
      updatedSales: salesToUpdate.map((u) => u.sale),
      customer: updatedCustomer,
    };
  }

  /**
   * Recompute customer ledger totals dynamically from actual sales and payments
   */
  static computeCustomerLedger(
    customer: Customer,
    sales: Sale[],
    payments: CustomerPayment[]
  ): {
    totalSalesCount: number;
    totalInvoiced: number;
    totalPaid: number;
    currentDue: number;
  } {
    const custSales = sales.filter((s) => s.customerId === customer.id);
    const totalSalesCount = custSales.length;

    let totalInvoiced = 0;
    let currentDue = 0;

    custSales.forEach((s) => {
      totalInvoiced = normalizeCurrencyNumber(totalInvoiced + Number(s.totalAmount || 0));
      currentDue = normalizeCurrencyNumber(currentDue + Number(s.dueAmount || 0));
    });

    const totalPaid = normalizeCurrencyNumber(Math.max(0, totalInvoiced - currentDue));

    return {
      totalSalesCount,
      totalInvoiced,
      totalPaid,
      currentDue,
    };
  }

  /**
   * Calculate top-level customer due summary across the shop
   */
  static calculateDueSummary(
    customers: Customer[],
    sales: Sale[],
    payments: CustomerPayment[]
  ): CustomerDueSummary {
    let totalCustomers = customers.length;
    let totalDueCustomers = 0;
    let totalOutstandingDue = 0;
    let totalCollectedPayments = 0;

    // Calculate dues from all sales in this shop that have a customerId
    const customerDueMap = new Map<string, number>();

    sales.forEach((s) => {
      if (s.customerId && Number(s.dueAmount || 0) > 0) {
        const current = customerDueMap.get(s.customerId) || 0;
        customerDueMap.set(s.customerId, normalizeCurrencyNumber(current + Number(s.dueAmount)));
      }
    });

    customers.forEach((c) => {
      const due = customerDueMap.get(c.id) || 0;
      if (due > 0) {
        totalDueCustomers += 1;
        totalOutstandingDue = normalizeCurrencyNumber(totalOutstandingDue + due);
      }
    });

    payments.forEach((p) => {
      totalCollectedPayments = normalizeCurrencyNumber(totalCollectedPayments + Number(p.amount || 0));
    });

    return {
      totalCustomers,
      totalDueCustomers,
      totalOutstandingDue,
      totalCollectedPayments,
    };
  }
}
