import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';
import {
  TelecomRecharge,
  CreateRechargeInput,
  MfsTransaction,
  CreateMfsTransactionInput,
} from '../types/telecomMfs.ts';
import { telecomMfsService } from '../services/telecomMfsService.ts';

interface TelecomMfsContextType {
  recharges: TelecomRecharge[];
  mfsTransactions: MfsTransaction[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
  recordRecharge: (input: CreateRechargeInput) => Promise<TelecomRecharge>;
  recordMfsTransaction: (input: CreateMfsTransactionInput) => Promise<MfsTransaction>;
  refreshData: () => Promise<void>;
  dailySummary: {
    totalRechargeAmountToday: number;
    rechargeCountToday: number;
    totalMfsCashInToday: number;
    totalMfsCashOutToday: number;
    totalMfsVolumeToday: number;
    mfsCountToday: number;
  };
}

const TelecomMfsContext = createContext<TelecomMfsContextType | undefined>(undefined);

export const TelecomMfsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { owner } = useAuth();
  const { activeShop } = useShop();

  const [recharges, setRecharges] = useState<TelecomRecharge[]>([]);
  const [mfsTransactions, setMfsTransactions] = useState<MfsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ownerId = owner?.id;
  const shopId = activeShop?.id;

  const loadData = useCallback(async () => {
    if (!ownerId || !shopId) {
      setRecharges([]);
      setMfsTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [rechargeList, mfsList] = await Promise.all([
        telecomMfsService.getRecharges(ownerId, shopId),
        telecomMfsService.getMfsTransactions(ownerId, shopId),
      ]);

      setRecharges(rechargeList);
      setMfsTransactions(mfsList);
    } catch (err) {
      console.error('Failed to load Telecom/MFS transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recordRecharge = useCallback(
    async (input: CreateRechargeInput): Promise<TelecomRecharge> => {
      if (!ownerId || !shopId) {
        throw new Error('Please select an active shop before recording a recharge transaction');
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const creatorName = owner?.businessName || 'Staff User';
        const newRecord = await telecomMfsService.createRecharge(ownerId, shopId, creatorName, input);
        setRecharges((prev) => [newRecord, ...prev]);
        return newRecord;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to record recharge transaction';
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [ownerId, shopId, owner?.businessName]
  );

  const recordMfsTransaction = useCallback(
    async (input: CreateMfsTransactionInput): Promise<MfsTransaction> => {
      if (!ownerId || !shopId) {
        throw new Error('Please select an active shop before recording an MFS transaction');
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const creatorName = owner?.businessName || 'Staff User';
        const newRecord = await telecomMfsService.createMfsTransaction(ownerId, shopId, creatorName, input);
        setMfsTransactions((prev) => [newRecord, ...prev]);
        return newRecord;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to record MFS transaction';
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [ownerId, shopId, owner?.businessName]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const dailySummary = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todayRecharges = recharges.filter((r) => r.createdAt && r.createdAt.startsWith(todayStr));
    const totalRechargeAmountToday = todayRecharges.reduce((acc, r) => acc + (r.amount || 0), 0);

    const todayMfs = mfsTransactions.filter((m) => m.createdAt && m.createdAt.startsWith(todayStr));
    const totalMfsCashInToday = todayMfs
      .filter((m) => m.type === 'CASH_IN')
      .reduce((acc, m) => acc + (m.amount || 0), 0);

    const totalMfsCashOutToday = todayMfs
      .filter((m) => m.type === 'CASH_OUT')
      .reduce((acc, m) => acc + (m.amount || 0), 0);

    const totalMfsVolumeToday = todayMfs.reduce((acc, m) => acc + (m.amount || 0), 0);

    return {
      totalRechargeAmountToday,
      rechargeCountToday: todayRecharges.length,
      totalMfsCashInToday,
      totalMfsCashOutToday,
      totalMfsVolumeToday,
      mfsCountToday: todayMfs.length,
    };
  }, [recharges, mfsTransactions]);

  return (
    <TelecomMfsContext.Provider
      value={{
        recharges,
        mfsTransactions,
        isLoading,
        isSubmitting,
        error,
        clearError,
        recordRecharge,
        recordMfsTransaction,
        refreshData: loadData,
        dailySummary,
      }}
    >
      {children}
    </TelecomMfsContext.Provider>
  );
};

export const useTelecomMfs = () => {
  const context = useContext(TelecomMfsContext);
  if (!context) {
    throw new Error('useTelecomMfs must be used within a TelecomMfsProvider');
  }
  return context;
};
