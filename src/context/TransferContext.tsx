import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  type StockTransfer,
  type CreateStockTransferInput,
} from '../types/transfer.ts';
import { TransferService } from '../services/transferService.ts';
import { useAuth } from './AuthContext.tsx';
import { useProduct } from './ProductContext.tsx';
import { useInventory } from './InventoryContext.tsx';

interface TransferContextType {
  transfers: StockTransfer[];
  isLoading: boolean;
  isProcessingAction: boolean;
  error: string | null;
  createTransfer: (input: CreateStockTransferInput) => Promise<StockTransfer>;
  refreshTransfers: () => Promise<void>;
  clearError: () => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export const TransferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { owner, userProfile } = useAuth();
  const { refreshData: refreshProducts } = useProduct();
  const { refreshInventory } = useInventory();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!owner?.id) {
      setTransfers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedTransfers = await TransferService.getTransfers(owner.id);
      setTransfers(fetchedTransfers);
    } catch (err: any) {
      console.error('[TransferContext] Failed to load transfers:', err);
      setError(err.message || 'Failed to load stock transfers.');
    } finally {
      setIsLoading(false);
    }
  }, [owner?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clearError = () => setError(null);

  const createTransfer = async (input: CreateStockTransferInput): Promise<StockTransfer> => {
    if (!owner?.id) {
      throw new Error('Owner session is required to execute a stock transfer.');
    }

    if (isProcessingAction) {
      throw new Error('Another transaction is currently processing. Please wait.');
    }

    setIsProcessingAction(true);
    setError(null);

    const createdBy = userProfile?.displayName || owner.businessName || 'Owner';

    try {
      const newTransfer = await TransferService.createTransfer(owner.id, createdBy, input);

      // Refresh transfers list
      setTransfers((prev) => [newTransfer, ...prev]);

      // Refresh products and inventory context so current stock updates instantly across views
      await Promise.all([refreshProducts(), refreshInventory()]);

      return newTransfer;
    } catch (err: any) {
      console.error('[TransferContext] Stock transfer failed:', err);
      setError(err.message || 'Failed to process stock transfer.');
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <TransferContext.Provider
      value={{
        transfers,
        isLoading,
        isProcessingAction,
        error,
        createTransfer,
        refreshTransfers: loadData,
        clearError,
      }}
    >
      {children}
    </TransferContext.Provider>
  );
};

export function useTransfer() {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
}
