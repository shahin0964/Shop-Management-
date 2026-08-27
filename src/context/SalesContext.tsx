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
  type Sale,
  type CartItem,
  type CreateSaleInput,
  type SaleSummary,
} from '../types/sales.ts';
import { type Product } from '../types/product.ts';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';
import { useProduct } from './ProductContext.tsx';
import { useInventory } from './InventoryContext.tsx';
import { SalesService } from '../services/salesService.ts';
import { normalizeCurrencyNumber } from '../services/productService.ts';

interface SalesContextType {
  sales: Sale[];
  isLoadingSales: boolean;
  isSubmittingSale: boolean;
  salesError: string | null;
  summary: SaleSummary;
  // Cart state & actions
  cart: CartItem[];
  cartItemCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartPrice: (productId: string, unitPrice: number) => void;
  updateCartDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  // POS Checkout
  lastCompletedSale: Sale | null;
  clearLastCompletedSale: () => void;
  completeSale: (
    options: Omit<CreateSaleInput, 'items'>
  ) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
  refreshSales: () => Promise<void>;
  getSaleById: (saleId: string) => Promise<Sale | null>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeShop, activeShopId } = useShop();
  const { refreshProducts } = useProduct();
  const { refreshInventory } = useInventory();

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  const ownerId = activeShop?.ownerId || user?.uid || '';
  const shopId = activeShopId || '';

  // Clear cart whenever user switches active shops to prevent cross-shop corruption
  useEffect(() => {
    setCart([]);
    setLastCompletedSale(null);
  }, [shopId]);

  const fetchSales = useCallback(async () => {
    if (!ownerId || !shopId) {
      setSales([]);
      return;
    }

    setIsLoadingSales(true);
    setSalesError(null);

    try {
      const data = await SalesService.getSales(ownerId, shopId);
      setSales(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch sales.';
      console.error('[SalesContext] Error fetching sales:', err);
      setSalesError(msg);
    } finally {
      setIsLoadingSales(false);
    }
  }, [ownerId, shopId]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => normalizeCurrencyNumber(sum + item.lineTotal), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Operations
  const addToCart = useCallback((product: Product, quantity: number = 1): boolean => {
    if (!product.isActive) {
      alert(`Product "${product.name}" is marked inactive and cannot be sold.`);
      return false;
    }

    const availableStock = Number(product.currentStock || 0);
    if (availableStock <= 0) {
      alert(`Cannot add "${product.name}". Current stock is 0 ${product.unit}.`);
      return false;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + quantity;
        if (newQty > availableStock) {
          alert(
            `Cannot add more "${product.name}". Max available stock is ${availableStock} ${product.unit}.`
          );
          return prev;
        }

        const updated = [...prev];
        const lineTotal = normalizeCurrencyNumber(
          newQty * existing.unitPrice - existing.discount
        );
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal: Math.max(0, lineTotal),
        };
        return updated;
      } else {
        if (quantity > availableStock) {
          alert(
            `Cannot add ${quantity} ${product.unit}. Available stock is only ${availableStock} ${product.unit}.`
          );
          return prev;
        }

        const unitPrice = normalizeCurrencyNumber(Number(product.sellingPrice || 0));
        const lineTotal = normalizeCurrencyNumber(quantity * unitPrice);
        return [
          ...prev,
          {
            product,
            quantity,
            unitPrice,
            discount: 0,
            lineTotal,
          },
        ];
      }
    });

    return true;
  }, []);

  const updateCartQuantity = useCallback((productId: string, newQuantity: number) => {
    setCart((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      return prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = Number(item.product.currentStock || 0);
          const cappedQty = Math.min(newQuantity, maxStock);
          if (newQuantity > maxStock) {
            alert(
              `Quantity capped at ${maxStock} ${item.product.unit} (maximum available stock).`
            );
          }
          const lineTotal = normalizeCurrencyNumber(
            cappedQty * item.unitPrice - item.discount
          );
          return {
            ...item,
            quantity: cappedQty,
            lineTotal: Math.max(0, lineTotal),
          };
        }
        return item;
      });
    });
  }, []);

  const updateCartPrice = useCallback((productId: string, unitPrice: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const safePrice = normalizeCurrencyNumber(Math.max(0, unitPrice));
          const lineTotal = normalizeCurrencyNumber(
            item.quantity * safePrice - item.discount
          );
          return {
            ...item,
            unitPrice: safePrice,
            lineTotal: Math.max(0, lineTotal),
          };
        }
        return item;
      })
    );
  }, []);

  const updateCartDiscount = useCallback((productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const safeDiscount = normalizeCurrencyNumber(Math.max(0, discount));
          const lineTotal = normalizeCurrencyNumber(
            item.quantity * item.unitPrice - safeDiscount
          );
          return {
            ...item,
            discount: safeDiscount,
            lineTotal: Math.max(0, lineTotal),
          };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const clearLastCompletedSale = useCallback(() => {
    setLastCompletedSale(null);
  }, []);

  // Atomic POS Sale Submission
  const completeSale = useCallback(
    async (
      options: Omit<CreateSaleInput, 'items'>
    ): Promise<{ success: boolean; sale?: Sale; error?: string }> => {
      if (!ownerId || !shopId) {
        return { success: false, error: 'Shop not selected.' };
      }

      if (cart.length === 0) {
        return { success: false, error: 'Cart is empty. Add products before completing sale.' };
      }

      if (isSubmittingSale) {
        return { success: false, error: 'A sale transaction is already in progress.' };
      }

      setIsSubmittingSale(true);
      setSalesError(null);

      try {
        const creatorName = user?.displayName || user?.email || 'Owner';
        const salePayload: CreateSaleInput = {
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            discount: c.discount,
          })),
          discountAmount: options.discountAmount || 0,
          taxAmount: options.taxAmount || 0,
          paidAmount: options.paidAmount,
          paymentMethod: options.paymentMethod,
          customerName: options.customerName,
          customerPhone: options.customerPhone,
          note: options.note,
        };

        const result = await SalesService.createSale(
          ownerId,
          shopId,
          salePayload,
          creatorName
        );

        // Update local state smoothly
        setSales((prev) => [result.sale, ...prev]);
        setLastCompletedSale(result.sale);
        setCart([]); // Clear cart upon confirmed success

        // Synchronize product catalog stock and inventory movement audit in background
        await Promise.all([refreshProducts(), refreshInventory()]);

        return { success: true, sale: result.sale };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to complete sale transaction.';
        console.error('[SalesContext] Error completing sale:', err);
        setSalesError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSubmittingSale(false);
      }
    },
    [ownerId, shopId, cart, isSubmittingSale, user, refreshProducts, refreshInventory]
  );

  const getSaleById = useCallback(
    async (saleId: string): Promise<Sale | null> => {
      if (!ownerId || !shopId || !saleId) return null;
      return SalesService.getSaleById(ownerId, shopId, saleId);
    },
    [ownerId, shopId]
  );

  const summary = useMemo(() => {
    return SalesService.calculateSummary(sales);
  }, [sales]);

  const value: SalesContextType = {
    sales,
    isLoadingSales,
    isSubmittingSale,
    salesError,
    summary,
    cart,
    cartItemCount,
    cartSubtotal,
    addToCart,
    updateCartQuantity,
    updateCartPrice,
    updateCartDiscount,
    removeFromCart,
    clearCart,
    lastCompletedSale,
    clearLastCompletedSale,
    completeSale,
    refreshSales: fetchSales,
    getSaleById,
  };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
};

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
