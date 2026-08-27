/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  type Sale,
  type SaleItem,
  type CreateSaleInput,
  type SaleSummary,
} from '../types/sales.ts';
import { type Product } from '../types/product.ts';
import { type InventoryMovement } from '../types/inventory.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import { ProductService, normalizeCurrencyNumber } from './productService.ts';
import { InventoryService } from './inventoryService.ts';

const SALES_STORAGE_PREFIX = 'sms_shop_sales_';

export class SalesService {
  private static getStorageKey(ownerId: string, shopId: string): string {
    return `${SALES_STORAGE_PREFIX}${ownerId}_${shopId}`;
  }

  /**
   * Generates a clean human-readable invoice / sale number
   */
  private static generateSaleNumber(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `INV-${y}${m}${d}-${randomHex}`;
  }

  /**
   * Fetch all sales for a specific shop
   */
  static async getSales(ownerId: string, shopId: string): Promise<Sale[]> {
    if (!ownerId || !shopId) return [];

    let sales: Sale[] = [];

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/sales`;
      try {
        const querySnapshot = await getDocs(
          collection(db, 'owners', ownerId, 'shops', shopId, 'sales')
        );

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();

          // Fetch items for this sale
          let items: SaleItem[] = [];
          if (Array.isArray(data.items) && data.items.length > 0) {
            items = data.items;
          } else {
            try {
              const itemsSnap = await getDocs(
                collection(db, 'owners', ownerId, 'shops', shopId, 'sales', docSnap.id, 'items')
              );
              itemsSnap.forEach((iSnap) => {
                const iData = iSnap.data();
                items.push({
                  id: iSnap.id,
                  saleId: docSnap.id,
                  productId: iData.productId || '',
                  productName: iData.productName || '',
                  productCode: iData.productCode || undefined,
                  barcode: iData.barcode || undefined,
                  unit: iData.unit || 'pcs',
                  quantity: Number(iData.quantity || 0),
                  unitPrice: normalizeCurrencyNumber(Number(iData.unitPrice || 0)),
                  costPrice: normalizeCurrencyNumber(Number(iData.costPrice || 0)),
                  discount: normalizeCurrencyNumber(Number(iData.discount || 0)),
                  lineTotal: normalizeCurrencyNumber(Number(iData.lineTotal || 0)),
                });
              });
            } catch (itemErr) {
              console.warn('[SalesService] Could not fetch sub-collection items, using root data:', itemErr);
            }
          }

          sales.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            saleNumber: data.saleNumber || docSnap.id,
            items,
            subtotalAmount: normalizeCurrencyNumber(Number(data.subtotalAmount || 0)),
            discountAmount: normalizeCurrencyNumber(Number(data.discountAmount || 0)),
            taxAmount: normalizeCurrencyNumber(Number(data.taxAmount || 0)),
            totalAmount: normalizeCurrencyNumber(Number(data.totalAmount || 0)),
            paidAmount: normalizeCurrencyNumber(Number(data.paidAmount || 0)),
            dueAmount: normalizeCurrencyNumber(Number(data.dueAmount || 0)),
            paymentStatus: data.paymentStatus || 'PAID',
            paymentMethod: data.paymentMethod || 'CASH',
            customerId: data.customerId || undefined,
            customerName: data.customerName || undefined,
            customerPhone: data.customerPhone || undefined,
            note: data.note || undefined,
            platformCreated: data.platformCreated || 'WEB',
            createdBy: data.createdBy || 'Owner',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    } else {
      // 2. Local Storage Mode
      const key = this.getStorageKey(ownerId, shopId);
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          sales = JSON.parse(raw);
        } catch (e) {
          console.error('[SalesService] Error parsing cached sales:', e);
          sales = [];
        }
      }
    }

    // Sort descending (newest sales first)
    return sales.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Fetch single sale by ID
   */
  static async getSaleById(
    ownerId: string,
    shopId: string,
    saleId: string
  ): Promise<Sale | null> {
    if (!ownerId || !shopId || !saleId) return null;

    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops/${shopId}/sales/${saleId}`;
      try {
        const docSnap = await getDoc(doc(db, 'owners', ownerId, 'shops', shopId, 'sales', saleId));
        if (!docSnap.exists()) return null;
        const data = docSnap.data();

        let items: SaleItem[] = [];
        if (Array.isArray(data.items) && data.items.length > 0) {
          items = data.items;
        } else {
          const itemsSnap = await getDocs(
            collection(db, 'owners', ownerId, 'shops', shopId, 'sales', saleId, 'items')
          );
          itemsSnap.forEach((iSnap) => {
            const iData = iSnap.data();
            items.push({
              id: iSnap.id,
              saleId,
              productId: iData.productId || '',
              productName: iData.productName || '',
              productCode: iData.productCode || undefined,
              barcode: iData.barcode || undefined,
              unit: iData.unit || 'pcs',
              quantity: Number(iData.quantity || 0),
              unitPrice: normalizeCurrencyNumber(Number(iData.unitPrice || 0)),
              costPrice: normalizeCurrencyNumber(Number(iData.costPrice || 0)),
              discount: normalizeCurrencyNumber(Number(iData.discount || 0)),
              lineTotal: normalizeCurrencyNumber(Number(iData.lineTotal || 0)),
            });
          });
        }

        return {
          id: docSnap.id,
          ownerId: data.ownerId || ownerId,
          shopId: data.shopId || shopId,
          saleNumber: data.saleNumber || docSnap.id,
          items,
          subtotalAmount: normalizeCurrencyNumber(Number(data.subtotalAmount || 0)),
          discountAmount: normalizeCurrencyNumber(Number(data.discountAmount || 0)),
          taxAmount: normalizeCurrencyNumber(Number(data.taxAmount || 0)),
          totalAmount: normalizeCurrencyNumber(Number(data.totalAmount || 0)),
          paidAmount: normalizeCurrencyNumber(Number(data.paidAmount || 0)),
          dueAmount: normalizeCurrencyNumber(Number(data.dueAmount || 0)),
          paymentStatus: data.paymentStatus || 'PAID',
          paymentMethod: data.paymentMethod || 'CASH',
          customerId: data.customerId || undefined,
          customerName: data.customerName || undefined,
          customerPhone: data.customerPhone || undefined,
          note: data.note || undefined,
          platformCreated: data.platformCreated || 'WEB',
          createdBy: data.createdBy || 'Owner',
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
      }
    } else {
      const sales = await this.getSales(ownerId, shopId);
      return sales.find((s) => s.id === saleId) || null;
    }
  }

  /**
   * Atomic POS Checkout / Sale Transaction:
   * 1. Validates all cart items and verifies stock availability.
   * 2. Snapshots product name, unit price, and cost price.
   * 3. Calculates subtotal, discounts, tax, grand total, paid, and due amounts.
   * 4. Deducts product stock atomically in both Cloud and Local state.
   * 5. Creates immutable Inventory Movement log (type: 'SALE') for each item.
   * 6. Creates and commits the Sale order document and line items.
   */
  static async createSale(
    ownerId: string,
    shopId: string,
    input: CreateSaleInput,
    createdBy: string = 'Owner'
  ): Promise<{
    sale: Sale;
    updatedProducts: Product[];
    movements: InventoryMovement[];
  }> {
    if (!ownerId || !shopId) {
      throw new Error('Owner ID and Shop ID are required to complete a sale.');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('Cart is empty. Please add at least one product before checkout.');
    }

    // 1. Fetch current catalog of products for this shop to guarantee consistency
    const shopProducts = await ProductService.getProducts(ownerId, shopId);
    const productMap = new Map<string, Product>();
    shopProducts.forEach((p) => productMap.set(p.id, p));

    // 2. Validate items & stock sufficiency
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const saleNumber = this.generateSaleNumber();
    const nowIso = new Date().toISOString();

    const preparedItems: SaleItem[] = [];
    const stockUpdates: Array<{ product: Product; newStock: number; deltaQty: number }> = [];
    let calculatedSubtotal = 0;

    for (const itemInput of input.items) {
      const product = productMap.get(itemInput.productId);
      if (!product) {
        throw new Error(`Product with ID "${itemInput.productId}" not found in this shop.`);
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently inactive.`);
      }

      const qty = Number(itemInput.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid quantity (${qty}) for product "${product.name}".`);
      }

      const currentStock = Number(product.currentStock || 0);
      if (qty > currentStock) {
        throw new Error(
          `Insufficient stock for "${product.name}". Requested: ${qty} ${product.unit}, Available: ${currentStock} ${product.unit}.`
        );
      }

      const unitSellingPrice =
        itemInput.unitPrice !== undefined && !isNaN(Number(itemInput.unitPrice))
          ? normalizeCurrencyNumber(Number(itemInput.unitPrice))
          : normalizeCurrencyNumber(Number(product.sellingPrice || 0));

      const costPriceSnapshot = normalizeCurrencyNumber(Number(product.costPrice || 0));
      const itemDiscount = normalizeCurrencyNumber(Number(itemInput.discount || 0));
      const lineTotal = normalizeCurrencyNumber(qty * unitSellingPrice - itemDiscount);

      if (lineTotal < 0) {
        throw new Error(`Line total cannot be negative for product "${product.name}".`);
      }

      calculatedSubtotal = normalizeCurrencyNumber(calculatedSubtotal + lineTotal);

      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      preparedItems.push({
        id: itemId,
        saleId,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        barcode: product.barcode,
        unit: product.unit,
        quantity: qty,
        unitPrice: unitSellingPrice,
        costPrice: costPriceSnapshot,
        discount: itemDiscount,
        lineTotal,
      });

      const newStock = currentStock - qty;
      stockUpdates.push({
        product,
        newStock,
        deltaQty: qty,
      });
    }

    const discountAmount = normalizeCurrencyNumber(Number(input.discountAmount || 0));
    const taxAmount = normalizeCurrencyNumber(Number(input.taxAmount || 0));
    const totalAmount = normalizeCurrencyNumber(
      Math.max(0, calculatedSubtotal - discountAmount + taxAmount)
    );

    const paidAmount = normalizeCurrencyNumber(Math.max(0, Number(input.paidAmount || 0)));
    const dueAmount = normalizeCurrencyNumber(Math.max(0, totalAmount - paidAmount));

    let paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' = 'PAID';
    if (paidAmount >= totalAmount) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'DUE';
    }

    const newSale: Sale = {
      id: saleId,
      ownerId,
      shopId,
      saleNumber,
      items: preparedItems,
      subtotalAmount: calculatedSubtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod: input.paymentMethod || 'CASH',
      customerId: input.customerId || undefined,
      customerName: input.customerName?.trim() || undefined,
      customerPhone: input.customerPhone?.trim() || undefined,
      note: input.note?.trim() || undefined,
      platformCreated: 'WEB',
      createdBy,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const recordedMovements: InventoryMovement[] = [];
    const updatedProducts: Product[] = [];

    // 3. Execution: Cloud Firestore Atomic Write Batch
    if (isCloudConnected && db) {
      const salePath = `owners/${ownerId}/shops/${shopId}/sales/${saleId}`;
      try {
        const batch = writeBatch(db);

        // A. Set Master Sale Document
        const saleRef = doc(db, 'owners', ownerId, 'shops', shopId, 'sales', saleId);
        batch.set(saleRef, {
          id: saleId,
          ownerId,
          shopId,
          saleNumber,
          items: preparedItems, // Store items directly on the sale for fast single-read retrieval
          subtotalAmount: calculatedSubtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentStatus,
          paymentMethod: newSale.paymentMethod,
          customerId: newSale.customerId || '',
          customerName: newSale.customerName || '',
          customerPhone: newSale.customerPhone || '',
          note: newSale.note || '',
          platformCreated: 'WEB',
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // B. Set Line Items in Subcollection (for normalized querying)
        preparedItems.forEach((item) => {
          const itemRef = doc(
            db,
            'owners',
            ownerId,
            'shops',
            shopId,
            'sales',
            saleId,
            'items',
            item.id
          );
          batch.set(itemRef, {
            id: item.id,
            saleId,
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode || '',
            barcode: item.barcode || '',
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            discount: item.discount,
            lineTotal: item.lineTotal,
          });
        });

        // C. Reduce Product Stock & Record Audit Movement in Batch
        for (const update of stockUpdates) {
          const prodRef = doc(
            db,
            'owners',
            ownerId,
            'shops',
            shopId,
            'products',
            update.product.id
          );
          batch.update(prodRef, {
            currentStock: update.newStock,
            updatedAt: serverTimestamp(),
          });

          const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const movRef = doc(db, 'owners', ownerId, 'shops', shopId, 'movements', movId);
          batch.set(movRef, {
            id: movId,
            ownerId,
            shopId,
            productId: update.product.id,
            productName: update.product.name,
            productCode: update.product.code || '',
            type: 'SALE',
            quantity: -update.deltaQty,
            previousStock: update.product.currentStock,
            newStock: update.newStock,
            referenceId: saleId,
            reason: `POS Sale #${saleNumber}`,
            note: newSale.paymentMethod,
            createdBy,
            createdAt: serverTimestamp(),
          });

          recordedMovements.push({
            id: movId,
            ownerId,
            shopId,
            productId: update.product.id,
            productName: update.product.name,
            productCode: update.product.code,
            type: 'SALE',
            quantity: -update.deltaQty,
            previousStock: update.product.currentStock,
            newStock: update.newStock,
            referenceId: saleId,
            reason: `POS Sale #${saleNumber}`,
            note: newSale.paymentMethod,
            createdBy,
            createdAt: nowIso,
          });

          updatedProducts.push({
            ...update.product,
            currentStock: update.newStock,
            updatedAt: nowIso,
          });
        }

        // Commit all operations atomically
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, salePath);
      }
    } else {
      // Local Mode: Synchronous Multi-entity Persistence
      for (const update of stockUpdates) {
        const updatedProd = await ProductService.updateProduct(
          ownerId,
          shopId,
          update.product.id,
          { currentStock: update.newStock }
        );
        updatedProducts.push(updatedProd);

        const mov = await InventoryService.recordMovement(ownerId, shopId, {
          ownerId,
          shopId,
          productId: update.product.id,
          productName: update.product.name,
          productCode: update.product.code,
          type: 'SALE',
          quantity: -update.deltaQty,
          previousStock: update.product.currentStock,
          newStock: update.newStock,
          referenceId: saleId,
          reason: `POS Sale #${saleNumber}`,
          note: newSale.paymentMethod,
          createdBy,
        });
        recordedMovements.push(mov);
      }
    }

    // Persist Sale locally for fast offline cache
    const key = this.getStorageKey(ownerId, shopId);
    const existingSales = await this.getSales(ownerId, shopId);
    localStorage.setItem(key, JSON.stringify([newSale, ...existingSales]));

    return {
      sale: newSale,
      updatedProducts,
      movements: recordedMovements,
    };
  }

  /**
   * Calculate summary metrics from sales list
   */
  static calculateSummary(sales: Sale[]): SaleSummary {
    const todayStr = new Date().toISOString().split('T')[0];

    let totalSalesCount = 0;
    let totalSalesAmount = 0;
    let totalPaidAmount = 0;
    let totalDueAmount = 0;
    let todaySalesCount = 0;
    let todaySalesAmount = 0;

    sales.forEach((s) => {
      totalSalesCount += 1;
      totalSalesAmount = normalizeCurrencyNumber(totalSalesAmount + s.totalAmount);
      totalPaidAmount = normalizeCurrencyNumber(totalPaidAmount + s.paidAmount);
      totalDueAmount = normalizeCurrencyNumber(totalDueAmount + s.dueAmount);

      const saleDate = s.createdAt.split('T')[0];
      if (saleDate === todayStr) {
        todaySalesCount += 1;
        todaySalesAmount = normalizeCurrencyNumber(todaySalesAmount + s.totalAmount);
      }
    });

    return {
      totalSalesCount,
      totalSalesAmount,
      totalPaidAmount,
      totalDueAmount,
      todaySalesCount,
      todaySalesAmount,
    };
  }
}
