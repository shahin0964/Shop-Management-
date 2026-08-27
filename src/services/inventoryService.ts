import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  type InventoryMovement,
  type CreateStockAdjustmentInput,
} from '../types/inventory.ts';
import { type Product } from '../types/product.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { ProductService } from './productService.ts';

const MOVEMENTS_STORAGE_PREFIX = 'sms_shop_movements_';

export class InventoryService {
  private static getStorageKey(ownerId: string, shopId: string): string {
    return `${MOVEMENTS_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  /**
   * Fetch all inventory audit movements for a shop (or filtered by a specific product)
   */
  static async getMovements(
    ownerId: string,
    shopId: string,
    productId?: string
  ): Promise<InventoryMovement[]> {
    if (!ownerId || !shopId) return [];

    let movements: InventoryMovement[] = [];

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/movements`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'movements')
        );
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          movements.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            productId: data.productId || '',
            productName: data.productName || '',
            productCode: data.productCode || undefined,
            type: data.type || 'ADJUSTMENT',
            quantity: Number(data.quantity || 0),
            previousStock: Number(data.previousStock || 0),
            newStock: Number(data.newStock || 0),
            referenceId: data.referenceId || undefined,
            reason: data.reason || undefined,
            note: data.note || undefined,
            createdBy: data.createdBy || 'Owner',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    } else {
      // 2. Local Mode
      const key = this.getStorageKey(ownerId, shopId);
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          movements = JSON.parse(raw);
        } catch (e) {
          console.error('[InventoryService] Error parsing cached movements:', e);
          movements = [];
        }
      }
    }

    // Filter by product if specified
    if (productId) {
      movements = movements.filter((m) => m.productId === productId);
    }

    // Sort descending (most recent first)
    return movements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Directly record an immutable inventory movement log
   */
  static async recordMovement(
    ownerId: string,
    shopId: string,
    data: Omit<InventoryMovement, 'id' | 'createdAt'>
  ): Promise<InventoryMovement> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to record inventory movement.');
    }

    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newMovement: InventoryMovement = {
      ...data,
      id: movementId,
      createdAt: now,
    };

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/movements/${movementId}`;
      try {
        await setDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'movements', movementId), {
          id: movementId,
          ownerId,
          shopId,
          productId: data.productId,
          productName: data.productName,
          productCode: data.productCode || '',
          type: data.type,
          quantity: data.quantity,
          previousStock: data.previousStock,
          newStock: data.newStock,
          referenceId: data.referenceId || '',
          reason: data.reason || '',
          note: data.note || '',
          createdBy: data.createdBy || 'Owner',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    // 2. Local Mode
    const key = this.getStorageKey(ownerId, shopId);
    const existing = await this.getMovements(ownerId, shopId);
    const updated = [newMovement, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));

    return newMovement;
  }

  /**
   * Perform manual Stock Adjustment with mandatory reason and accurate audit movement recording
   */
  static async adjustStock(
    ownerId: string,
    shopId: string,
    input: CreateStockAdjustmentInput,
    createdBy: string = 'Owner'
  ): Promise<{ product: Product; movement: InventoryMovement }> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required.');
    }

    if (!input.productId) {
      throw new Error('Product is required for stock adjustment.');
    }

    const reasonTrimmed = input.reason.trim();
    if (!reasonTrimmed) {
      throw new Error('Please select or specify a reason for this stock adjustment.');
    }

    const parsedAmount = Number(input.amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      throw new Error('Stock adjustment quantity must be a non-negative number.');
    }

    // Fetch existing product
    const product = await ProductService.getProductById(ownerId, shopId, input.productId);
    if (!product) {
      throw new Error('Product not found in this shop.');
    }

    const previousStock = Number(product.currentStock || 0);
    let newStock: number;
    let deltaQuantity: number;

    switch (input.mode) {
      case 'SET_EXACT':
        newStock = parsedAmount;
        deltaQuantity = newStock - previousStock;
        break;
      case 'ADD_STOCK':
        if (parsedAmount === 0) {
          throw new Error('Addition amount must be greater than 0.');
        }
        deltaQuantity = parsedAmount;
        newStock = previousStock + deltaQuantity;
        break;
      case 'REMOVE_STOCK':
        if (parsedAmount === 0) {
          throw new Error('Deduction amount must be greater than 0.');
        }
        if (parsedAmount > previousStock) {
          throw new Error(
            `Cannot deduct ${parsedAmount} ${product.unit}. Current stock is only ${previousStock} ${product.unit}.`
          );
        }
        deltaQuantity = -parsedAmount;
        newStock = previousStock + deltaQuantity;
        break;
      default:
        throw new Error('Invalid stock adjustment mode.');
    }

    if (newStock < 0) {
      throw new Error('Final stock quantity cannot be negative.');
    }

    // 1. Update Product stock
    const updatedProduct = await ProductService.updateProduct(ownerId, shopId, product.id, {
      currentStock: newStock,
    });

    // 2. Record Movement
    const movement = await this.recordMovement(ownerId, shopId, {
      ownerId,
      shopId,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: 'ADJUSTMENT',
      quantity: deltaQuantity,
      previousStock,
      newStock,
      reason: reasonTrimmed,
      note: input.note?.trim() || undefined,
      createdBy,
    });

    return { product: updatedProduct, movement };
  }
}
