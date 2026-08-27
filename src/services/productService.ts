import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
} from '../types/product.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { InventoryService } from './inventoryService.ts';

const PRODUCTS_STORAGE_PREFIX = 'sms_shop_products_';

/**
 * Standard rounding helper for monetary values to avoid floating-point inaccuracies
 */
export function normalizeCurrencyNumber(value: number): number {
  if (isNaN(value) || value < 0) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class ProductService {
  private static getStorageKey(ownerId: string, shopId: string): string {
    return `${PRODUCTS_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  /**
   * Fetch all products for a specific shop
   */
  static async getProducts(ownerId: string, shopId: string): Promise<Product[]> {
    if (!ownerId || !shopId) {
      return [];
    }

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/products`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'products')
        );
        const products: Product[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          products.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            name: data.name || '',
            code: data.code || '',
            barcode: data.barcode || '',
            categoryId: data.categoryId ?? null,
            brand: data.brand || '',
            unit: data.unit || 'pcs',
            costPrice: normalizeCurrencyNumber(Number(data.costPrice || 0)),
            sellingPrice: normalizeCurrencyNumber(Number(data.sellingPrice || 0)),
            currentStock: Number(data.currentStock || 0),
            minStockAlert: data.minStockAlert !== undefined ? Number(data.minStockAlert) : undefined,
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
        return products.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    // 2. Local / Standard Resilient Mode
    try {
      const key = this.getStorageKey(ownerId, shopId);
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as Product[];
      return parsed
        .filter((p) => p.ownerId === ownerId && p.shopId === shopId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  /**
   * Get single product by ID
   */
  static async getProductById(
    ownerId: string,
    shopId: string,
    productId: string
  ): Promise<Product | null> {
    if (!ownerId || !shopId || !productId) return null;

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/products/${productId}`;
      try {
        const snap = await getDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'products', productId));
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
          id: snap.id,
          ownerId: data.ownerId || ownerId,
          shopId: data.shopId || shopId,
          name: data.name || '',
          code: data.code || '',
          barcode: data.barcode || '',
          categoryId: data.categoryId ?? null,
          brand: data.brand || '',
          unit: data.unit || 'pcs',
          costPrice: normalizeCurrencyNumber(Number(data.costPrice || 0)),
          sellingPrice: normalizeCurrencyNumber(Number(data.sellingPrice || 0)),
          currentStock: Number(data.currentStock || 0),
          minStockAlert: data.minStockAlert !== undefined ? Number(data.minStockAlert) : undefined,
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }

    const list = await this.getProducts(ownerId, shopId);
    return list.find((p) => p.id === productId) || null;
  }

  /**
   * Lookup product by exact barcode value within an authorized shop context.
   * Preserves exact barcode string formatting including leading zeros.
   */
  static async getProductByBarcode(
    ownerId: string,
    shopId: string,
    barcode: string
  ): Promise<Product | null> {
    if (!ownerId || !shopId || !barcode) return null;
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;

    const products = await this.getProducts(ownerId, shopId);
    return (
      products.find(
        (p) =>
          p.isActive &&
          p.barcode &&
          p.barcode.toLowerCase() === cleanBarcode.toLowerCase()
      ) || null
    );
  }

  /**
   * Create a new product in the given shop
   */
  static async createProduct(
    ownerId: string,
    shopId: string,
    input: CreateProductInput
  ): Promise<Product> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to add a product.');
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Product name is required.');
    }

    const unit = input.unit.trim() || 'pcs';
    const costPrice = normalizeCurrencyNumber(Number(input.costPrice));
    const sellingPrice = normalizeCurrencyNumber(Number(input.sellingPrice));
    const currentStock = Math.max(0, Number(input.currentStock || 0));

    if (isNaN(costPrice) || costPrice < 0) {
      throw new Error('Purchase/Cost price must be a valid non-negative number.');
    }
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      throw new Error('Selling price must be a valid non-negative number.');
    }
    if (isNaN(currentStock) || currentStock < 0) {
      throw new Error('Current stock quantity must be a non-negative number.');
    }

    const barcode = input.barcode?.trim() || '';

    // Validate Barcode uniqueness within this shop context if provided
    if (barcode) {
      const existingProducts = await this.getProducts(ownerId, shopId);
      const duplicate = existingProducts.find(
        (p) => p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()
      );
      if (duplicate) {
        throw new Error(
          `A product with barcode "${barcode}" already exists in this branch: "${duplicate.name}".`
        );
      }
    }

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const code = input.code?.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    const newProduct: Product = {
      id: productId,
      ownerId,
      shopId,
      name: trimmedName,
      code,
      barcode: barcode || undefined,
      categoryId: input.categoryId || null,
      brand: input.brand?.trim() || undefined,
      unit,
      costPrice,
      sellingPrice,
      currentStock,
      minStockAlert: input.minStockAlert !== undefined ? Number(input.minStockAlert) : undefined,
      description: input.description?.trim() || undefined,
      imageUrl: input.imageUrl?.trim() || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/products/${productId}`;
      try {
        await setDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'products', productId), {
          id: productId,
          ownerId,
          shopId,
          name: trimmedName,
          code,
          barcode: barcode || '',
          categoryId: input.categoryId || null,
          brand: input.brand?.trim() || '',
          unit,
          costPrice,
          sellingPrice,
          currentStock,
          minStockAlert: input.minStockAlert !== undefined ? Number(input.minStockAlert) : null,
          description: input.description?.trim() || '',
          imageUrl: input.imageUrl?.trim() || '',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    // 2. Local Mode
    const key = this.getStorageKey(ownerId, shopId);
    const existing = await this.getProducts(ownerId, shopId);
    const updated = [...existing, newProduct];
    localStorage.setItem(key, JSON.stringify(updated));

    // 3. Record Initial Opening Stock movement if stock > 0
    if (currentStock > 0) {
      try {
        await InventoryService.recordMovement(ownerId, shopId, {
          ownerId,
          shopId,
          productId: newProduct.id,
          productName: newProduct.name,
          productCode: newProduct.code,
          type: 'OPENING_STOCK',
          quantity: currentStock,
          previousStock: 0,
          newStock: currentStock,
          reason: 'Initial Opening Stock on Product Creation',
          createdBy: 'Owner',
        });
      } catch (movErr) {
        console.warn('[ProductService] Could not log opening stock movement:', movErr);
      }
    }

    return newProduct;
  }

  /**
   * Update product information
   */
  static async updateProduct(
    ownerId: string,
    shopId: string,
    productId: string,
    input: UpdateProductInput
  ): Promise<Product> {
    if (!ownerId || !shopId || !productId) {
      throw new Error('Owner ID, Shop ID, and Product ID are required.');
    }

    const existingProducts = await this.getProducts(ownerId, shopId);
    const currentProduct = existingProducts.find((p) => p.id === productId);
    if (!currentProduct) {
      throw new Error('Product not found in this branch.');
    }

    // Validate barcode uniqueness if changed
    if (input.barcode !== undefined) {
      const trimmedBarcode = input.barcode.trim();
      if (trimmedBarcode) {
        const duplicate = existingProducts.find(
          (p) =>
            p.id !== productId &&
            p.barcode &&
            p.barcode.toLowerCase() === trimmedBarcode.toLowerCase()
        );
        if (duplicate) {
          throw new Error(
            `Another product with barcode "${trimmedBarcode}" already exists in this branch: "${duplicate.name}".`
          );
        }
      }
    }

    const now = new Date().toISOString();
    const updatedProduct: Product = {
      ...currentProduct,
      name: input.name !== undefined ? input.name.trim() : currentProduct.name,
      code: input.code !== undefined ? input.code.trim() : currentProduct.code,
      barcode: input.barcode !== undefined ? input.barcode.trim() || undefined : currentProduct.barcode,
      categoryId: input.categoryId !== undefined ? input.categoryId : currentProduct.categoryId,
      brand: input.brand !== undefined ? input.brand.trim() || undefined : currentProduct.brand,
      unit: input.unit !== undefined ? input.unit.trim() : currentProduct.unit,
      costPrice:
        input.costPrice !== undefined
          ? normalizeCurrencyNumber(Number(input.costPrice))
          : currentProduct.costPrice,
      sellingPrice:
        input.sellingPrice !== undefined
          ? normalizeCurrencyNumber(Number(input.sellingPrice))
          : currentProduct.sellingPrice,
      currentStock:
        input.currentStock !== undefined
          ? Math.max(0, Number(input.currentStock))
          : currentProduct.currentStock,
      minStockAlert:
        input.minStockAlert !== undefined
          ? Number(input.minStockAlert)
          : currentProduct.minStockAlert,
      description:
        input.description !== undefined
          ? input.description.trim() || undefined
          : currentProduct.description,
      imageUrl:
        input.imageUrl !== undefined
          ? input.imageUrl.trim() || undefined
          : currentProduct.imageUrl,
      isActive: input.isActive !== undefined ? input.isActive : currentProduct.isActive,
      updatedAt: now,
    };

    if (!updatedProduct.name) {
      throw new Error('Product name cannot be empty.');
    }

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/products/${productId}`;
      try {
        const updatePayload: Record<string, any> = {
          name: updatedProduct.name,
          code: updatedProduct.code,
          barcode: updatedProduct.barcode || '',
          categoryId: updatedProduct.categoryId ?? null,
          brand: updatedProduct.brand || '',
          unit: updatedProduct.unit,
          costPrice: updatedProduct.costPrice,
          sellingPrice: updatedProduct.sellingPrice,
          currentStock: updatedProduct.currentStock,
          minStockAlert: updatedProduct.minStockAlert ?? null,
          description: updatedProduct.description || '',
          imageUrl: updatedProduct.imageUrl || '',
          isActive: updatedProduct.isActive,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'products', productId), updatePayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    // 2. Local Mode
    const key = this.getStorageKey(ownerId, shopId);
    const updatedList = existingProducts.map((p) => (p.id === productId ? updatedProduct : p));
    localStorage.setItem(key, JSON.stringify(updatedList));

    return updatedProduct;
  }

  /**
   * Safe Product Deletion / Deactivation:
   * By default, toggles isActive to false (soft delete) to preserve integrity for future history.
   * If permanent deletion is requested, removes record from store.
   */
  static async deleteProduct(
    ownerId: string,
    shopId: string,
    productId: string,
    permanent = false
  ): Promise<void> {
    if (!ownerId || !shopId || !productId) {
      throw new Error('Owner ID, Shop ID, and Product ID are required.');
    }

    if (!permanent) {
      // Soft-delete / deactivate
      await this.updateProduct(ownerId, shopId, productId, { isActive: false });
      return;
    }

    // Hard delete
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/products/${productId}`;
      try {
        await deleteDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'products', productId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }

    const key = this.getStorageKey(ownerId, shopId);
    const existing = await this.getProducts(ownerId, shopId);
    const filtered = existing.filter((p) => p.id !== productId);
    localStorage.setItem(key, JSON.stringify(filtered));
  }
}
