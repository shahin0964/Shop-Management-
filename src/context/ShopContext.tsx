import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Shop, type CreateShopInput } from '../types/shop.ts';
import { ShopService } from '../services/shopService.ts';
import { useAuth } from './AuthContext.tsx';

interface ShopContextType {
  shops: Shop[];
  activeShopId: string | null; // null = Combined Multi-Branch View
  activeShop: Shop | null;
  setActiveShopId: (shopId: string | null) => void;
  createShop: (input: CreateShopInput) => Promise<Shop>;
  isLoadingShops: boolean;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, owner } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);

  const fetchShops = async (ownerId: string) => {
    setIsLoadingShops(true);
    try {
      const loadedShops = await ShopService.getShops(ownerId);
      setShops(loadedShops);

      // If activeShopId is set but no longer exists in loaded shops, reset to null
      if (activeShopId && !loadedShops.some((s) => s.id === activeShopId)) {
        setActiveShopId(loadedShops.length > 0 ? loadedShops[0].id : null);
      }
    } catch (err) {
      console.error('[ShopContext] Failed to load shops for owner:', err);
      setShops([]);
    } finally {
      setIsLoadingShops(false);
    }
  };

  // Synchronize on owner change
  useEffect(() => {
    if (!owner) {
      setShops([]);
      setActiveShopId(null);
      setIsLoadingShops(false);
      return;
    }

    fetchShops(owner.id);
  }, [owner?.id]);

  const refreshShops = async () => {
    if (owner?.id) {
      await fetchShops(owner.id);
    }
  };

  const activeShop = shops.find((s) => s.id === activeShopId) || null;

  const createShop = async (input: CreateShopInput): Promise<Shop> => {
    if (!owner || !user) {
      throw new Error('Authenticated owner session required to create a branch.');
    }

    const newShop = await ShopService.createShop(owner.id, input, shops.length);
    const updatedShops = [...shops, newShop];
    setShops(updatedShops);

    // If it's the very first shop, select it as active context
    if (shops.length === 0) {
      setActiveShopId(newShop.id);
    }

    return newShop;
  };

  return (
    <ShopContext.Provider
      value={{
        shops,
        activeShopId,
        activeShop,
        setActiveShopId,
        createShop,
        isLoadingShops,
        refreshShops,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
