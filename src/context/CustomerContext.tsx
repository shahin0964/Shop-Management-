/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type Customer,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerPayment,
  type RecordCustomerPaymentInput,
  type CustomerDueSummary,
} from '../types/customer.ts';
import { type Sale } from '../types/sales.ts';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';
import { useSales } from './SalesContext.tsx';
import { CustomerService } from '../services/customerService.ts';

interface CustomerContextType {
  customers: Customer[];
  activeCustomers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  isLoadingCustomers: boolean;
  isProcessingPayment: boolean;
  customerError: string | null;
  dueSummary: CustomerDueSummary;
  payments: CustomerPayment[];
  isLoadingPayments: boolean;
  createCustomer: (input: CreateCustomerInput) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  updateCustomer: (customerId: string, input: UpdateCustomerInput) => Promise<{ success: boolean; customer?: Customer; error?: string }>;
  deleteOrDeactivateCustomer: (customerId: string) => Promise<{ success: boolean; action?: 'DEACTIVATED' | 'DELETED'; error?: string }>;
  recordPayment: (input: RecordCustomerPaymentInput) => Promise<{ success: boolean; payment?: CustomerPayment; error?: string }>;
  getCustomerLedger: (customer: Customer) => {
    totalSalesCount: number;
    totalInvoiced: number;
    totalPaid: number;
    currentDue: number;
    customerSales: Sale[];
    customerPayments: CustomerPayment[];
  };
  refreshCustomers: () => Promise<void>;
  refreshPayments: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeShop, activeShopId } = useShop();
  const { sales, refreshSales } = useSales();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const ownerId = activeShop?.ownerId || user?.uid || '';
  const shopId = activeShopId || '';

  const fetchCustomers = useCallback(async () => {
    if (!ownerId || !shopId) {
      setCustomers([]);
      return;
    }

    setIsLoadingCustomers(true);
    setCustomerError(null);

    try {
      const data = await CustomerService.getCustomers(ownerId, shopId);
      setCustomers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch customer list.';
      console.error('[CustomerContext] Error fetching customers:', err);
      setCustomerError(msg);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [ownerId, shopId]);

  const fetchPayments = useCallback(async () => {
    if (!ownerId || !shopId) {
      setPayments([]);
      return;
    }

    setIsLoadingPayments(true);
    try {
      const data = await CustomerService.getAllShopPayments(ownerId, shopId);
      setPayments(data);
    } catch (err: unknown) {
      console.error('[CustomerContext] Error fetching payments:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [ownerId, shopId]);

  useEffect(() => {
    fetchCustomers();
    fetchPayments();
    setSelectedCustomer(null);
  }, [fetchCustomers, fetchPayments]);

  const activeCustomers = useMemo(() => {
    return customers.filter((c) => c.isActive !== false);
  }, [customers]);

  const dueSummary = useMemo(() => {
    return CustomerService.calculateDueSummary(customers, sales, payments);
  }, [customers, sales, payments]);

  const handleCreateCustomer = useCallback(
    async (input: CreateCustomerInput) => {
      if (!ownerId || !shopId) {
        return { success: false, error: 'No active shop selected.' };
      }

      setCustomerError(null);
      try {
        const created = await CustomerService.createCustomer(ownerId, shopId, input);
        setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return { success: true, customer: created };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create customer.';
        setCustomerError(msg);
        return { success: false, error: msg };
      }
    },
    [ownerId, shopId]
  );

  const handleUpdateCustomer = useCallback(
    async (customerId: string, input: UpdateCustomerInput) => {
      if (!ownerId || !shopId) {
        return { success: false, error: 'No active shop selected.' };
      }

      setCustomerError(null);
      try {
        const updated = await CustomerService.updateCustomer(ownerId, shopId, customerId, input);
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(updated);
        }
        return { success: true, customer: updated };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update customer.';
        setCustomerError(msg);
        return { success: false, error: msg };
      }
    },
    [ownerId, shopId, selectedCustomer]
  );

  const handleDeleteOrDeactivate = useCallback(
    async (customerId: string) => {
      if (!ownerId || !shopId) {
        return { success: false, error: 'No active shop selected.' };
      }

      setCustomerError(null);
      try {
        const res = await CustomerService.deleteOrDeactivateCustomer(ownerId, shopId, customerId);
        if (res.action === 'DEACTIVATED' && res.customer) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === customerId ? res.customer! : c))
          );
          if (selectedCustomer?.id === customerId) {
            setSelectedCustomer(res.customer);
          }
        } else {
          setCustomers((prev) => prev.filter((c) => c.id !== customerId));
          if (selectedCustomer?.id === customerId) {
            setSelectedCustomer(null);
          }
        }
        return { success: true, action: res.action };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to remove customer.';
        setCustomerError(msg);
        return { success: false, error: msg };
      }
    },
    [ownerId, shopId, selectedCustomer]
  );

  const handleRecordPayment = useCallback(
    async (input: RecordCustomerPaymentInput) => {
      if (!ownerId || !shopId) {
        return { success: false, error: 'No active shop selected.' };
      }

      if (isProcessingPayment) {
        return {
          success: false,
          error: 'A payment transaction is already in progress.'
        };
      }

      setIsProcessingPayment(true);
      setCustomerError(null);

      try {
        const res = await CustomerService.recordCustomerPayment(
          ownerId,
          shopId,
          input,
          user?.displayName || user?.email || 'Owner'
        );

        // Update customers list in state
        setCustomers((prev) =>
          prev.map((c) => (c.id === res.customer.id ? res.customer : c))
        );

        // Update selected customer if applicable
        if (selectedCustomer?.id === res.customer.id) {
          setSelectedCustomer(res.customer);
        }

        // Add payment to payments list
        setPayments((prev) => [res.payment, ...prev]);

        // Refresh sales so updated invoice balances reflect immediately
        await refreshSales();

        return { success: true, payment: res.payment };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to record customer payment.';
        setCustomerError(msg);
        return { success: false, error: msg };
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [ownerId, shopId, user, selectedCustomer, refreshSales]
  );

  const getCustomerLedger = useCallback(
    (customer: Customer) => {
      const custSales = sales.filter((s) => s.customerId === customer.id);
      const custPayments = payments.filter((p) => p.customerId === customer.id);
      const ledger = CustomerService.computeCustomerLedger(customer, sales, payments);

      return {
        ...ledger,
        customerSales: custSales,
        customerPayments: custPayments,
      };
    },
    [sales, payments]
  );

  return (
    <CustomerContext.Provider
      value={{
        customers,
        activeCustomers,
        selectedCustomer,
        setSelectedCustomer,
        isLoadingCustomers,
        isProcessingPayment,
        customerError,
        dueSummary,
        payments,
        isLoadingPayments,
        createCustomer: handleCreateCustomer,
        updateCustomer: handleUpdateCustomer,
        deleteOrDeactivateCustomer: handleDeleteOrDeactivate,
        recordPayment: handleRecordPayment,
        getCustomerLedger,
        refreshCustomers: fetchCustomers,
        refreshPayments: fetchPayments,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
