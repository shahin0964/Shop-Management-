import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  type Purchase,
  type CreatePurchaseInput,
  type InventoryMovement,
} from '../types/inventory.ts';
import { type Product } from '../types/product.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { ProductService, normalizeCurrencyNumber } from './productService.ts';
import { InventoryService } from './inventoryService.ts';

const PURCHASES_STORAGE_PREFIX = 'sms_shop_purchases_';

export class PurchaseService {
  private static getStorageKey(ownerId: string, shopId: string): string {
    return `${PURCHASES_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  /**
   * Fetch all purchases for a specific shop
   */
  static async getPurchases(
    ownerId: string,
    shopId: string,
    productId?: string
  ): Promise<Purchase[]> {
    if (!ownerId || !shopId) return [];

    let purchases: Purchase[] = [];

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/purchases`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'purchases')
        );
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          purchases.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            productId: data.productId || '',
            productName: data.productName || '',
            productCode: data.productCode || undefined,
            barcode: data.barcode || undefined,
            unit: data.unit || 'pcs',
            quantity: Number(data.quantity || 0),
            unitCost: normalizeCurrencyNumber(Number(data.unitCost || 0)),
            totalCost: normalizeCurrencyNumber(Number(data.totalCost || 0)),
            purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
            supplierName: data.supplierName || undefined,
            invoiceNumber: data.invoiceNumber || undefined,
            note: data.note || undefined,
            createdBy: data.createdBy || 'Owner',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
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
          purchases = JSON.parse(raw);
        } catch (e) {
          console.error('[PurchaseService] Error parsing cached purchases:', e);
          purchases = [];
        }
      }
    }

    if (productId) {
      purchases = purchases.filter((p) => p.productId === productId);
    }

    // Sort descending by purchaseDate / createdAt
    return purchases.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Record a new Purchase / Stock In transaction:
   * - Saves purchase record with historical unit cost
   * - Increments product currentStock atomically
   * - Optionally updates product's base costPrice if requested
   * - Appends an immutable InventoryMovement record
   */
  static async createPurchase(
    ownerId: string,
    shopId: string,
    input: CreatePurchaseInput,
    createdBy: string = 'Owner'
  ): Promise<{ purchase: Purchase; product: Product; movement: InventoryMovement }> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to record a purchase.');
    }

    if (!input.productId) {
      throw new Error('Please select a valid product.');
    }

    const quantity = Number(input.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error('Purchase quantity must be greater than 0.');
    }

    const unitCost = normalizeCurrencyNumber(Number(input.unitCost));
    if (isNaN(unitCost) || unitCost < 0) {
      throw new Error('Unit purchase cost must be a valid non-negative number.');
    }

    const totalCost = normalizeCurrencyNumber(quantity * unitCost);

    // Fetch product to verify existence and stock baseline
    const product = await ProductService.getProductById(ownerId, shopId, input.productId);
    if (!product) {
      throw new Error('Product not found in the selected shop.');
    }

    const previousStock = Number(product.currentStock || 0);
    const newStock = previousStock + quantity;
    const purchaseId = `pur_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const purchaseDate = input.purchaseDate?.trim() || now.split('T')[0];

    const newPurchase: Purchase = {
      id: purchaseId,
      ownerId,
      shopId,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      barcode: product.barcode,
      unit: product.unit,
      quantity,
      unitCost,
      totalCost,
      purchaseDate,
      supplierName: input.supplierName?.trim() || undefined,
      invoiceNumber: input.invoiceNumber?.trim() || undefined,
      note: input.note?.trim() || undefined,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/purchases/${purchaseId}`;
      try {
        await setDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'purchases', purchaseId), {
          id: purchaseId,
          ownerId,
          shopId,
          productId: product.id,
          productName: product.name,
          productCode: product.code || '',
          barcode: product.barcode || '',
          unit: product.unit,
          quantity,
          unitCost,
          totalCost,
          purchaseDate,
          supplierName: input.supplierName?.trim() || '',
          invoiceNumber: input.invoiceNumber?.trim() || '',
          note: input.note?.trim() || '',
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    // 2. Local Mode Persistence for Purchase
    const key = this.getStorageKey(ownerId, shopId);
    const existingPurchases = await this.getPurchases(ownerId, shopId);
    localStorage.setItem(key, JSON.stringify([newPurchase, ...existingPurchases]));

    // 3. Update Product Stock (and optionally update catalog base costPrice)
    const productUpdatePayload: { currentStock: number; costPrice?: number } = {
      currentStock: newStock,
    };
    if (input.updateProductCostPrice) {
      productUpdatePayload.costPrice = unitCost;
    }

    const updatedProduct = await ProductService.updateProduct(
      ownerId,
      shopId,
      product.id,
      productUpdatePayload
    );

    // 4. Record Traceable Inventory Movement Audit
    const movement = await InventoryService.recordMovement(ownerId, shopId, {
      ownerId,
      shopId,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: 'PURCHASE',
      quantity,
      previousStock,
      newStock,
      referenceId: purchaseId,
      reason: input.supplierName ? `Purchase from ${input.supplierName.trim()}` : 'Stock Purchase / Stock In',
      note: input.invoiceNumber ? `Invoice #${input.invoiceNumber.trim()}` : input.note,
      createdBy,
    });

    return {
      purchase: newPurchase,
      product: updatedProduct,
      movement,
    };
  }
}
