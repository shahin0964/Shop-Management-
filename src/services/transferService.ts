import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  type StockTransfer,
  type StockTransferItem,
  type CreateStockTransferInput,
} from '../types/transfer.ts';
import { type Product } from '../types/product.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { ShopService } from './shopService.ts';
import { ProductService } from './productService.ts';

const TRANSFERS_STORAGE_PREFIX = 'sms_owner_transfers_';

// Processing guard lock to prevent duplicate transfer submissions
const activeSubmissionLocks = new Set<string>();

export class TransferService {
  private static getStorageKey(ownerId: string): string {
    return `${TRANSFERS_STORAGE_PREFIX}${ownerId}`;
  }

  /**
   * Fetch all historical and active stock transfers for an Owner tenant
   */
  static async getTransfers(ownerId: string): Promise<StockTransfer[]> {
    if (!ownerId) return [];

    let transfers: StockTransfer[] = [];

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/transfers`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'transfers')
        );
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          transfers.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            transferNumber: data.transferNumber || `TRF-${docSnap.id.slice(-6)}`,
            sourceShopId: data.sourceShopId || '',
            sourceShopName: data.sourceShopName || 'Source Branch',
            destinationShopId: data.destinationShopId || '',
            destinationShopName: data.destinationShopName || 'Destination Branch',
            status: data.status || 'COMPLETED',
            items: Array.isArray(data.items) ? data.items : [],
            totalItemCount: Number(data.totalItemCount || (data.items ? data.items.length : 0)),
            totalQuantity: Number(data.totalQuantity || 0),
            totalEstimatedValue: Number(data.totalEstimatedValue || 0),
            notes: data.notes || undefined,
            initiatedBy: data.initiatedBy || 'Owner',
            createdBy: data.createdBy || data.initiatedBy || 'Owner',
            dispatchedBy: data.dispatchedBy || undefined,
            receivedBy: data.receivedBy || undefined,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    } else {
      // 2. Local Storage Mode
      const key = this.getStorageKey(ownerId);
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          transfers = JSON.parse(raw);
        } catch (e) {
          console.error('[TransferService] Error reading cached transfers:', e);
          transfers = [];
        }
      }
    }

    // Sort descending by creation date (newest first)
    return transfers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Fetch single Stock Transfer record by ID
   */
  static async getTransferById(ownerId: string, transferId: string): Promise<StockTransfer | null> {
    const all = await this.getTransfers(ownerId);
    return all.find((t) => t.id === transferId) || null;
  }

  /**
   * Execute an atomic Shop-to-Shop Stock Transfer
   */
  static async createTransfer(
    ownerId: string,
    createdBy: string,
    input: CreateStockTransferInput
  ): Promise<StockTransfer> {
    if (!ownerId) {
      throw new Error('Tenant Owner ID is required to execute a stock transfer.');
    }

    const sourceShopId = input.sourceShopId?.trim();
    const destinationShopId = input.destinationShopId?.trim();

    if (!sourceShopId || !destinationShopId) {
      throw new Error('Both Source Shop and Destination Shop must be selected.');
    }

    if (sourceShopId === destinationShopId) {
      throw new Error('Source Shop and Destination Shop cannot be the same branch.');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('At least one product item must be selected for transfer.');
    }

    // Duplicate Submission Protection Guard
    const submissionKey = `${ownerId}_${sourceShopId}_${destinationShopId}_${JSON.stringify(
      input.items
    )}`;
    if (activeSubmissionLocks.has(submissionKey)) {
      throw new Error('A stock transfer request with these exact items is currently processing.');
    }

    activeSubmissionLocks.add(submissionKey);

    try {
      // 1. Verify Shops belong to the SAME Owner
      const shops = await ShopService.getShops(ownerId);
      const sourceShop = shops.find((s) => s.id === sourceShopId);
      const destinationShop = shops.find((s) => s.id === destinationShopId);

      if (!sourceShop) {
        throw new Error('Selected Source Shop does not exist or is unauthorized.');
      }
      if (!destinationShop) {
        throw new Error('Selected Destination Shop does not exist or is unauthorized.');
      }
      if (sourceShop.ownerId !== ownerId || destinationShop.ownerId !== ownerId) {
        throw new Error('Cross-tenant transfers are strictly prohibited. Both shops must belong to the same Owner.');
      }

      // 2. Fetch products for source and destination shops
      const sourceProducts = await ProductService.getProducts(ownerId, sourceShopId);
      const destProducts = await ProductService.getProducts(ownerId, destinationShopId);

      // 3. Prepare Transfer Data and validate stock levels
      const transferId = `trf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();

      const transferItemsList: StockTransferItem[] = [];
      let totalQuantity = 0;
      let totalEstimatedValue = 0;

      // Operations queue for atomic commit
      const sourceStockUpdates: { product: Product; newStock: number; prevStock: number; qty: number }[] = [];
      const destStockUpdates: {
        product: Product;
        newStock: number;
        prevStock: number;
        qty: number;
        isNewProduct: boolean;
      }[] = [];

      for (const itemInput of input.items) {
        const qty = Number(itemInput.quantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error('Transfer quantity must be a positive number greater than zero.');
        }

        const sourceProduct = sourceProducts.find((p) => p.id === itemInput.productId);
        if (!sourceProduct || !sourceProduct.isActive) {
          throw new Error(`Product ID ${itemInput.productId} was not found or is inactive in source branch "${sourceShop.name}".`);
        }

        const sourcePrevStock = Number(sourceProduct.currentStock || 0);
        if (qty > sourcePrevStock) {
          throw new Error(
            `Insufficient stock for "${sourceProduct.name}" in "${sourceShop.name}". Available: ${sourcePrevStock} ${sourceProduct.unit}, requested transfer: ${qty} ${sourceProduct.unit}.`
          );
        }

        const sourceNewStock = sourcePrevStock - qty;
        sourceStockUpdates.push({
          product: sourceProduct,
          prevStock: sourcePrevStock,
          newStock: sourceNewStock,
          qty,
        });

        // Match product in Destination Shop
        let matchedDestProduct = destProducts.find((dp) => {
          if (!dp.isActive) return false;
          // Exact Barcode Match
          if (
            sourceProduct.barcode &&
            sourceProduct.barcode.trim() !== '' &&
            dp.barcode &&
            dp.barcode.trim().toLowerCase() === sourceProduct.barcode.trim().toLowerCase()
          ) {
            return true;
          }
          // Exact Code/SKU Match
          if (
            sourceProduct.code &&
            sourceProduct.code.trim() !== '' &&
            dp.code &&
            dp.code.trim().toLowerCase() === sourceProduct.code.trim().toLowerCase()
          ) {
            return true;
          }
          // Name and Unit Match
          return (
            dp.name.trim().toLowerCase() === sourceProduct.name.trim().toLowerCase() &&
            dp.unit.trim().toLowerCase() === sourceProduct.unit.trim().toLowerCase()
          );
        });

        let destProductId: string;
        let destPrevStock: number;
        let destNewStock: number;
        let isNewProduct = false;
        let destProductRecord: Product;

        if (matchedDestProduct) {
          destProductId = matchedDestProduct.id;
          destPrevStock = Number(matchedDestProduct.currentStock || 0);
          destNewStock = destPrevStock + qty;
          destProductRecord = {
            ...matchedDestProduct,
            currentStock: destNewStock,
          };
        } else {
          // Create new product record in Destination Shop
          isNewProduct = true;
          destProductId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          destPrevStock = 0;
          destNewStock = qty;

          destProductRecord = {
            id: destProductId,
            ownerId,
            shopId: destinationShopId,
            name: sourceProduct.name,
            code: sourceProduct.code || `SKU-${Date.now().toString().slice(-5)}`,
            barcode: sourceProduct.barcode || undefined,
            categoryId: '', // Default unassigned category in dest shop
            brand: sourceProduct.brand || undefined,
            unit: sourceProduct.unit || 'PCS',
            costPrice: sourceProduct.costPrice || 0,
            sellingPrice: sourceProduct.sellingPrice || 0,
            currentStock: destNewStock,
            minStockAlert: sourceProduct.minStockAlert !== undefined ? sourceProduct.minStockAlert : 5,
            description: sourceProduct.description || undefined,
            imageUrl: sourceProduct.imageUrl || undefined,
            isActive: true,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
        }

        destStockUpdates.push({
          product: destProductRecord,
          prevStock: destPrevStock,
          newStock: destNewStock,
          qty,
          isNewProduct,
        });

        const itemCost = Number(sourceProduct.costPrice || 0);
        const lineValuation = qty * itemCost;

        totalQuantity += qty;
        totalEstimatedValue += lineValuation;

        const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        transferItemsList.push({
          id: itemId,
          transferId,
          productId: sourceProduct.id,
          productCode: sourceProduct.code,
          productName: sourceProduct.name,
          barcode: sourceProduct.barcode,
          quantity: qty,
          unit: sourceProduct.unit,
          unitCost: itemCost,
          destinationProductId: destProductId,
        });
      }

      const newTransfer: StockTransfer = {
        id: transferId,
        ownerId,
        transferNumber,
        sourceShopId: sourceShop.id,
        sourceShopName: sourceShop.name,
        destinationShopId: destinationShop.id,
        destinationShopName: destinationShop.name,
        status: 'COMPLETED',
        items: transferItemsList,
        totalItemCount: transferItemsList.length,
        totalQuantity,
        totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
        notes: input.notes?.trim() || undefined,
        initiatedBy: createdBy,
        createdBy,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // 4. ATOMIC EXECUTION (Cloud Firestore or Local Storage)
      if (isCloudConnected && db) {
        const batch = writeBatch(db);

        // A. Add Transfer Record
        const transferRef = doc(db, 'owners', ownerId, 'transfers', transferId);
        batch.set(transferRef, {
          id: transferId,
          ownerId,
          transferNumber,
          sourceShopId: sourceShop.id,
          sourceShopName: sourceShop.name,
          destinationShopId: destinationShop.id,
          destinationShopName: destinationShop.name,
          status: 'COMPLETED',
          items: transferItemsList,
          totalItemCount: transferItemsList.length,
          totalQuantity,
          totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
          notes: input.notes?.trim() || '',
          initiatedBy: createdBy,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // B. Process Source Shop Updates & Movements
        for (const update of sourceStockUpdates) {
          const srcProdRef = doc(
            db,
            'owners',
            ownerId,
            'shops',
            sourceShopId,
            'products',
            update.product.id
          );
          batch.update(srcProdRef, {
            currentStock: update.newStock,
            updatedAt: serverTimestamp(),
          });

          const srcMovId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const srcMovRef = doc(
            db,
            'owners',
            ownerId,
            'shops',
            sourceShopId,
            'movements',
            srcMovId
          );
          batch.set(srcMovRef, {
            id: srcMovId,
            ownerId,
            shopId: sourceShopId,
            productId: update.product.id,
            productName: update.product.name,
            productCode: update.product.code || '',
            type: 'TRANSFER_OUT',
            quantity: -update.qty,
            previousStock: update.prevStock,
            newStock: update.newStock,
            referenceId: transferId,
            reason: `Transfer Out to ${destinationShop.name} (${transferNumber})`,
            note: input.notes?.trim() || '',
            createdBy,
            createdAt: serverTimestamp(),
          });
        }

        // C. Process Destination Shop Updates & Movements
        for (const update of destStockUpdates) {
          const destProdRef = doc(
            db,
            'owners',
            ownerId,
            'shops',
            destinationShopId,
            'products',
            update.product.id
          );

          if (update.isNewProduct) {
            batch.set(destProdRef, {
              ...update.product,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            batch.update(destProdRef, {
              currentStock: update.newStock,
              updatedAt: serverTimestamp(),
            });
          }

          const destMovId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const destMovRef = doc(
            db,
            'owners',
            ownerId,
            'shops',
            destinationShopId,
            'movements',
            destMovId
          );
          batch.set(destMovRef, {
            id: destMovId,
            ownerId,
            shopId: destinationShopId,
            productId: update.product.id,
            productName: update.product.name,
            productCode: update.product.code || '',
            type: 'TRANSFER_IN',
            quantity: update.qty,
            previousStock: update.prevStock,
            newStock: update.newStock,
            referenceId: transferId,
            reason: `Transfer In from ${sourceShop.name} (${transferNumber})`,
            note: input.notes?.trim() || '',
            createdBy,
            createdAt: serverTimestamp(),
          });
        }

        try {
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `owners/${ownerId}/transfers/${transferId}`);
        }
      }

      // 5. Local Storage Fallback & Cache Sync
      // Update Source Products local storage
      const sourceProdKey = `sms_shop_products_${ownerId}_${sourceShopId}`;
      const cachedSourceProds: Product[] = JSON.parse(localStorage.getItem(sourceProdKey) || '[]');
      const updatedSourceProds = cachedSourceProds.map((p) => {
        const u = sourceStockUpdates.find((su) => su.product.id === p.id);
        return u ? { ...p, currentStock: u.newStock, updatedAt: nowIso } : p;
      });
      localStorage.setItem(sourceProdKey, JSON.stringify(updatedSourceProds));

      // Update Destination Products local storage
      const destProdKey = `sms_shop_products_${ownerId}_${destinationShopId}`;
      const cachedDestProds: Product[] = JSON.parse(localStorage.getItem(destProdKey) || '[]');
      let updatedDestProds = [...cachedDestProds];
      for (const update of destStockUpdates) {
        if (update.isNewProduct) {
          updatedDestProds.push(update.product);
        } else {
          updatedDestProds = updatedDestProds.map((p) =>
            p.id === update.product.id ? { ...p, currentStock: update.newStock, updatedAt: nowIso } : p
          );
        }
      }
      localStorage.setItem(destProdKey, JSON.stringify(updatedDestProds));

      // Save transfer record
      const transfersKey = this.getStorageKey(ownerId);
      const existingTransfers = await this.getTransfers(ownerId);
      const updatedTransfers = [newTransfer, ...existingTransfers];
      localStorage.setItem(transfersKey, JSON.stringify(updatedTransfers));

      return newTransfer;
    } finally {
      activeSubmissionLocks.delete(submissionKey);
    }
  }
}
