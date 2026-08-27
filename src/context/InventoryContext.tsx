import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  type Purchase,
  type InventoryMovement,
  type CreatePurchaseInput,
  type CreateStockAdjustmentInput,
  type ShopInventorySummary,
} from '../types/inventory.ts';
import { type Product } from '../types/product.ts';
import { InventoryService } from '../services/inventoryService.ts';
import { PurchaseService } from '../services/purchaseService.ts';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';
import { useProduct } from './ProductContext.tsx';

interface InventoryContextType {
  purchases: Purchase[];
  movements: InventoryMovement[];
  isLoading: boolean;
  isProcessingAction: boolean;
  summary: ShopInventorySummary;
  createPurchase: (input: CreatePurchaseInput) => Promise<Purchase>;
  adjustStock: (
    input: CreateStockAdjustmentInput
  ) => Promise<{ product: Product; movement: InventoryMovement }>;
  refreshInventory: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { owner } = useAuth();
  const { activeShopId } = useShop();
  const { products, refreshData: refreshProducts } = useProduct();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!owner?.id || !activeShopId) {
      setPurchases([]);
      setMovements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [fetchedPurchases, fetchedMovements] = await Promise.all([
        PurchaseService.getPurchases(owner.id, activeShopId),
        InventoryService.getMovements(owner.id, activeShopId),
      ]);
      setPurchases(fetchedPurchases);
      setMovements(fetchedMovements);
    } catch (err: any) {
      console.error('[InventoryContext] Error loading inventory data:', err);
      setError(err.message || 'Failed to load inventory data.');
    } finally {
      setIsLoading(false);
    }
  }, [owner?.id, activeShopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clearError = () => setError(null);

  // Compute accurate real-time inventory summary metrics
  const summary: ShopInventorySummary = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive);
    let totalStockQuantity = 0;
    let totalInventoryCostValue = 0;
    let totalInventoryRetailValue = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    activeProducts.forEach((p) => {
      const stock = Number(p.currentStock || 0);
      const minAlert = p.minStockAlert !== undefined ? Number(p.minStockAlert) : 5;

      totalStockQuantity += stock;
      totalInventoryCostValue += stock * Number(p.costPrice || 0);
      totalInventoryRetailValue += stock * Number(p.sellingPrice || 0);

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= minAlert) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalProducts: activeProducts.length,
      inStockProducts: inStockCount,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      totalStockQuantity,
      totalInventoryCostValue: Math.round(totalInventoryCostValue * 100) / 100,
      totalInventoryRetailValue: Math.round(totalInventoryRetailValue * 100) / 100,
    };
  }, [products]);

  const createPurchase = async (input: CreatePurchaseInput): Promise<Purchase> => {
    if (!owner?.id || !activeShopId) {
      throw new Error('Please select an active shop before creating a purchase.');
    }

    if (isProcessingAction) {
      throw new Error('Another transaction is currently processing. Please wait.');
    }

    setIsProcessingAction(true);
    setError(null);

    try {
      const result = await PurchaseService.createPurchase(owner.id, activeShopId, input);

      // Update state locally
      setPurchases((prev) => [result.purchase, ...prev]);
      setMovements((prev) => [result.movement, ...prev]);

      // Refresh product context so currentStock and pricing reflect immediately
      await refreshProducts();

      return result.purchase;
    } catch (err: any) {
      console.error('[InventoryContext] Purchase creation failed:', err);
      setError(err.message || 'Failed to record purchase.');
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const adjustStock = async (
    input: CreateStockAdjustmentInput
  ): Promise<{ product: Product; movement: InventoryMovement }> => {
    if (!owner?.id || !activeShopId) {
      throw new Error('Please select an active shop before adjusting stock.');
    }

    if (isProcessingAction) {
      throw new Error('Another transaction is currently processing. Please wait.');
    }

    setIsProcessingAction(true);
    setError(null);

    try {
      const result = await InventoryService.adjustStock(owner.id, activeShopId, input);

      // Update state
      setMovements((prev) => [result.movement, ...prev]);

      // Refresh product context so currentStock reflects immediately
      await refreshProducts();

      return result;
    } catch (err: any) {
      console.error('[InventoryContext] Stock adjustment failed:', err);
      setError(err.message || 'Failed to adjust stock.');
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        purchases,
        movements,
        isLoading,
        isProcessingAction,
        summary,
        createPurchase,
        adjustStock,
        refreshInventory: loadData,
        error,
        clearError,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
