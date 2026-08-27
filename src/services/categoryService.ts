import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  type ProductCategory,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../types/product.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { ProductService } from './productService.ts';

const CATEGORIES_STORAGE_PREFIX = 'sms_shop_categories_';

export class CategoryService {
  private static getStorageKey(ownerId: string, shopId: string): string {
    return `${CATEGORIES_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  /**
   * Fetch all categories for a specific shop
   */
  static async getCategories(ownerId: string, shopId: string): Promise<ProductCategory[]> {
    if (!ownerId || !shopId) {
      return [];
    }

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/categories`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'categories')
        );
        const categories: ProductCategory[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          categories.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            name: data.name || '',
            description: data.description || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
        return categories.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    // 2. Local / Offline Resilient Mode
    try {
      const key = this.getStorageKey(ownerId, shopId);
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as ProductCategory[];
      return parsed
        .filter((c) => c.ownerId === ownerId && c.shopId === shopId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  /**
   * Create a new category within a specific shop
   */
  static async createCategory(
    ownerId: string,
    shopId: string,
    input: CreateCategoryInput
  ): Promise<ProductCategory> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to create a category.');
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Category name is required.');
    }

    // Check duplicate name within this shop
    const existingCategories = await this.getCategories(ownerId, shopId);
    const isDuplicate = existingCategories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`A category named "${trimmedName}" already exists in this branch.`);
    }

    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newCategory: ProductCategory = {
      id: categoryId,
      ownerId,
      shopId,
      name: trimmedName,
      description: input.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/categories/${categoryId}`;
      try {
        await setDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'categories', categoryId), {
          id: categoryId,
          ownerId,
          shopId,
          name: trimmedName,
          description: input.description?.trim() || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    // 2. Local / Standard Resilient Mode
    const key = this.getStorageKey(ownerId, shopId);
    const updated = [...existingCategories, newCategory];
    localStorage.setItem(key, JSON.stringify(updated));

    return newCategory;
  }

  /**
   * Update category information
   */
  static async updateCategory(
    ownerId: string,
    shopId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<ProductCategory> {
    if (!ownerId || !shopId || !categoryId) {
      throw new Error('Owner ID, Shop ID, and Category ID are required.');
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Category name cannot be empty.');
    }

    // Check duplicate against other categories in the same shop
    const existingCategories = await this.getCategories(ownerId, shopId);
    const isDuplicate = existingCategories.some(
      (c) => c.id !== categoryId && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Another category named "${trimmedName}" already exists in this branch.`);
    }

    const currentCat = existingCategories.find((c) => c.id === categoryId);
    if (!currentCat) {
      throw new Error('Category not found.');
    }

    const now = new Date().toISOString();
    const updatedCat: ProductCategory = {
      ...currentCat,
      name: trimmedName,
      description: input.description?.trim() || '',
      updatedAt: now,
    };

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/categories/${categoryId}`;
      try {
        await updateDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'categories', categoryId), {
          name: trimmedName,
          description: input.description?.trim() || '',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }

    // 2. Local Mode
    const key = this.getStorageKey(ownerId, shopId);
    const list = existingCategories.map((c) => (c.id === categoryId ? updatedCat : c));
    localStorage.setItem(key, JSON.stringify(list));

    return updatedCat;
  }

  /**
   * Safe Category Deletion:
   * Reassigns any linked products in this shop to "Uncategorized" (null categoryId)
   * to guarantee no products are destroyed or orphaned.
   */
  static async deleteCategory(
    ownerId: string,
    shopId: string,
    categoryId: string
  ): Promise<{ reassignedProductCount: number }> {
    if (!ownerId || !shopId || !categoryId) {
      throw new Error('Owner ID, Shop ID, and Category ID are required.');
    }

    // 1. Find all products in this shop linked to this category
    const products = await ProductService.getProducts(ownerId, shopId);
    const linkedProducts = products.filter((p) => p.categoryId === categoryId);

    // 2. Safely unassign category from all linked products
    for (const prod of linkedProducts) {
      await ProductService.updateProduct(ownerId, shopId, prod.id, {
        categoryId: null,
      });
    }

    // 3. Delete Category from Firestore or Local Storage
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/categories/${categoryId}`;
      try {
        await deleteDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'categories', categoryId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }

    // Local Storage delete
    const key = this.getStorageKey(ownerId, shopId);
    const existing = await this.getCategories(ownerId, shopId);
    const filtered = existing.filter((c) => c.id !== categoryId);
    localStorage.setItem(key, JSON.stringify(filtered));

    return { reassignedProductCount: linkedProducts.length };
  }
}
