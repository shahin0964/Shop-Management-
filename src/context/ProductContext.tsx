import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  type Product,
  type ProductCategory,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../types/product.ts';
import { ProductService } from '../services/productService.ts';
import { CategoryService } from '../services/categoryService.ts';
import { useAuth } from './AuthContext.tsx';
import { useShop } from './ShopContext.tsx';

interface ProductContextType {
  products: Product[];
  categories: ProductCategory[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (categoryId: string | null) => void;
  showInactive: boolean;
  setShowInactive: (show: boolean) => void;
  filteredProducts: Product[];
  createProduct: (input: CreateProductInput, overrideShopId?: string) => Promise<Product>;
  updateProduct: (productId: string, input: UpdateProductInput) => Promise<Product>;
  deleteProduct: (productId: string, permanent?: boolean) => Promise<void>;
  createCategory: (input: CreateCategoryInput, overrideShopId?: string) => Promise<ProductCategory>;
  updateCategory: (categoryId: string, input: UpdateCategoryInput) => Promise<ProductCategory>;
  deleteCategory: (categoryId: string) => Promise<{ reassignedProductCount: number }>;
  refreshData: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { owner } = useAuth();
  const { activeShopId } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!owner?.id || !activeShopId) {
      setProducts([]);
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        ProductService.getProducts(owner.id, activeShopId),
        CategoryService.getCategories(owner.id, activeShopId),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error('[ProductContext] Error loading products/categories:', err);
      setError(err.message || 'Failed to load catalog data.');
    } finally {
      setIsLoading(false);
    }
  }, [owner?.id, activeShopId]);

  // Reload data whenever activeShopId or owner changes
  useEffect(() => {
    loadData();
    // Reset filters on shop switch
    setSearchQuery('');
    setSelectedCategoryId(null);
  }, [loadData]);

  const clearError = () => setError(null);

  // Products filtered by search and category
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      // Inactive filter
      if (!showInactive && !product.isActive) {
        return false;
      }

      // Category filter
      if (selectedCategoryId) {
        if (selectedCategoryId === 'uncategorized') {
          if (product.categoryId) return false;
        } else if (product.categoryId !== selectedCategoryId) {
          return false;
        }
      }

      // Search query filter (matches name, barcode, code/SKU, or brand)
      if (query) {
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBarcode = product.barcode?.toLowerCase().includes(query) ?? false;
        const matchesCode = product.code?.toLowerCase().includes(query) ?? false;
        const matchesBrand = product.brand?.toLowerCase().includes(query) ?? false;
        return matchesName || matchesBarcode || matchesCode || matchesBrand;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategoryId, showInactive]);

  const createProduct = async (
    input: CreateProductInput,
    overrideShopId?: string
  ): Promise<Product> => {
    const targetShopId = overrideShopId || activeShopId;
    if (!owner?.id || !targetShopId) {
      throw new Error('Please select a specific shop/branch before adding a product.');
    }

    try {
      const newProduct = await ProductService.createProduct(owner.id, targetShopId, input);
      if (targetShopId === activeShopId) {
        setProducts((prev) => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
      }
      return newProduct;
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
      throw err;
    }
  };

  const updateProduct = async (
    productId: string,
    input: UpdateProductInput
  ): Promise<Product> => {
    if (!owner?.id || !activeShopId) {
      throw new Error('Active shop session required to edit products.');
    }

    try {
      const updated = await ProductService.updateProduct(owner.id, activeShopId, productId, input);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p)).sort((a, b) => a.name.localeCompare(b.name))
      );
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
      throw err;
    }
  };

  const deleteProduct = async (productId: string, permanent = false): Promise<void> => {
    if (!owner?.id || !activeShopId) {
      throw new Error('Active shop session required.');
    }

    try {
      await ProductService.deleteProduct(owner.id, activeShopId, productId, permanent);
      if (permanent) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: false } : p))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product.');
      throw err;
    }
  };

  const createCategory = async (
    input: CreateCategoryInput,
    overrideShopId?: string
  ): Promise<ProductCategory> => {
    const targetShopId = overrideShopId || activeShopId;
    if (!owner?.id || !targetShopId) {
      throw new Error('Please select a specific shop/branch before adding a category.');
    }

    try {
      const newCategory = await CategoryService.createCategory(owner.id, targetShopId, input);
      if (targetShopId === activeShopId) {
        setCategories((prev) =>
          [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      return newCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
      throw err;
    }
  };

  const updateCategory = async (
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<ProductCategory> => {
    if (!owner?.id || !activeShopId) {
      throw new Error('Active shop session required.');
    }

    try {
      const updated = await CategoryService.updateCategory(owner.id, activeShopId, categoryId, input);
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update category.');
      throw err;
    }
  };

  const deleteCategory = async (
    categoryId: string
  ): Promise<{ reassignedProductCount: number }> => {
    if (!owner?.id || !activeShopId) {
      throw new Error('Active shop session required.');
    }

    try {
      const result = await CategoryService.deleteCategory(owner.id, activeShopId, categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      // Refresh products to reflect reassigned categories
      const refreshedProducts = await ProductService.getProducts(owner.id, activeShopId);
      setProducts(refreshedProducts);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to delete category.');
      throw err;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectedCategoryId,
        setSelectedCategoryId,
        showInactive,
        setShowInactive,
        filteredProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        createCategory,
        updateCategory,
        deleteCategory,
        refreshData: loadData,
        error,
        clearError,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}
