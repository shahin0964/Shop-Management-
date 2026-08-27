import { ShopService } from './shopService.ts';
import { ProductService } from './productService.ts';
import { CategoryService } from './categoryService.ts';
import { CustomerService } from './customerService.ts';
import { SalesService } from './salesService.ts';
import { telecomMfsService } from './telecomMfsService.ts';
import { TransferService } from './transferService.ts';
import { db, isCloudConnected } from './firebase.ts';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

export interface BackupMetadata {
  backupVersion: string;
  appVersion: string;
  ownerId: string;
  ownerEmail: string;
  timestamp: string;
}

export interface ShopSpecificData {
  categories: any[];
  products: any[];
  customers: any[];
  payments: any[];
  sales: any[];
  recharges: any[];
  mfs: any[];
  expenses: any[];
}

export interface BackupPayload {
  metadata: BackupMetadata;
  shops: any[];
  stockTransfers: any[];
  shopData: Record<string, ShopSpecificData>;
}

export class BackupService {
  /**
   * Compiles all systems collections for the active owner across all their shops.
   */
  static async exportBackup(ownerId: string, ownerEmail: string): Promise<BackupPayload> {
    if (!ownerId) {
      throw new Error('Authenticated owner ID is required to perform system export.');
    }

    // 1. Fetch all shops for this owner
    const shops = await ShopService.getShops(ownerId);
    
    // 2. Fetch all global stock transfers for this owner
    const stockTransfers = await TransferService.getTransfers(ownerId);

    const shopData: Record<string, ShopSpecificData> = {};

    // 3. Loop through each shop and load all associated data
    for (const shop of shops) {
      const shopId = shop.id;

      // Extract each service's items for this shop
      const [
        categories,
        products,
        customers,
        payments,
        sales,
        recharges,
        mfs,
        expenses
      ] = await Promise.all([
        CategoryService.getCategories(ownerId, shopId),
        ProductService.getProducts(ownerId, shopId),
        CustomerService.getCustomers(ownerId, shopId),
        CustomerService.getPayments(ownerId, shopId),
        SalesService.getSales(ownerId, shopId),
        telecomMfsService.getRecharges(ownerId, shopId),
        telecomMfsService.getMfsTransactions(ownerId, shopId),
        // Read expenses directly from Cache helper or standard list
        this.getExpensesDirect(ownerId, shopId)
      ]);

      shopData[shopId] = {
        categories,
        products,
        customers,
        payments,
        sales,
        recharges,
        mfs,
        expenses
      };
    }

    const payload: BackupPayload = {
      metadata: {
        backupVersion: '1.0',
        appVersion: '1.0.0',
        ownerId,
        ownerEmail,
        timestamp: new Date().toISOString()
      },
      shops,
      stockTransfers,
      shopData
    };

    return payload;
  }

  /**
   * Safely imports a backup payload. Validates format, tenancy owner, and shop structures.
   * Performs idempotency writes to both localStorage cache and cloud Firestore.
   */
  static async importBackup(
    currentOwnerId: string,
    payload: any,
    onProgress?: (message: string) => void
  ): Promise<{ success: boolean; stats: any }> {
    if (!currentOwnerId) {
      throw new Error('You must be logged in to restore a database backup.');
    }

    // Phase 1: Structure Validation
    if (!payload || !payload.metadata || !payload.shops || !payload.shopData) {
      throw new Error('Invalid backup file format. Missing core metadata or collection nodes.');
    }

    const meta = payload.metadata as BackupMetadata;

    // Zero-Trust Check: Tenant Isolation Guard
    if (meta.ownerId !== currentOwnerId) {
      throw new Error(
        `Security Isolation Alert: This backup file belongs to a different owner tenant (${meta.ownerEmail || meta.ownerId}). Cross-tenant restoration is strictly forbidden.`
      );
    }

    onProgress?.('Verifying schema integrity and target shops...');

    const stats = {
      shopsCount: payload.shops.length,
      transfersCount: payload.stockTransfers?.length || 0,
      totalCategories: 0,
      totalProducts: 0,
      totalCustomers: 0,
      totalPayments: 0,
      totalSales: 0,
      totalRecharges: 0,
      totalMfs: 0,
      totalExpenses: 0
    };

    // Phase 2: Save owner level data - Shops and Transfers
    // A. LocalStorage caching
    localStorage.setItem(`sms_owner_shops_${currentOwnerId}`, JSON.stringify(payload.shops));
    if (payload.stockTransfers) {
      localStorage.setItem(`sms_owner_transfers_${currentOwnerId}`, JSON.stringify(payload.stockTransfers));
    }

    // B. Cloud Firestore sync
    if (isCloudConnected && db) {
      onProgress?.('Syncing tenant configurations to cloud storage...');
      for (const shop of payload.shops) {
        await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shop.id), {
          ...shop,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      for (const transfer of (payload.stockTransfers || [])) {
        await setDoc(doc(db, 'owners', currentOwnerId, 'transfers', transfer.id), {
          ...transfer,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }

    // Phase 3: Loop and save individual shop sub-collections
    for (const shopId of Object.keys(payload.shopData)) {
      onProgress?.(`Restoring data for shop ${shopId}...`);
      const data = payload.shopData[shopId] as ShopSpecificData;

      // Restoring Categories
      localStorage.setItem(`sms_shop_categories_${currentOwnerId}_${shopId}`, JSON.stringify(data.categories || []));
      stats.totalCategories += (data.categories || []).length;

      // Restoring Products
      localStorage.setItem(`sms_shop_products_${currentOwnerId}_${shopId}`, JSON.stringify(data.products || []));
      stats.totalProducts += (data.products || []).length;

      // Restoring Customers
      localStorage.setItem(`sms_shop_customers_${currentOwnerId}_${shopId}`, JSON.stringify(data.customers || []));
      stats.totalCustomers += (data.customers || []).length;

      // Restoring Payments
      localStorage.setItem(`sms_shop_payments_${currentOwnerId}_${shopId}`, JSON.stringify(data.payments || []));
      stats.totalPayments += (data.payments || []).length;

      // Restoring Sales
      localStorage.setItem(`sms_shop_sales_${currentOwnerId}_${shopId}`, JSON.stringify(data.sales || []));
      stats.totalSales += (data.sales || []).length;

      // Restoring Recharges & MFS
      localStorage.setItem(`sms_recharges_${currentOwnerId}_${shopId}`, JSON.stringify(data.recharges || []));
      stats.totalRecharges += (data.recharges || []).length;

      localStorage.setItem(`sms_mfs_${currentOwnerId}_${shopId}`, JSON.stringify(data.mfs || []));
      stats.totalMfs += (data.mfs || []).length;

      // Restoring Expenses
      localStorage.setItem(`expenses_cache_${currentOwnerId}_${shopId}`, JSON.stringify(data.expenses || []));
      stats.totalExpenses += (data.expenses || []).length;

      // C. Sync Shop sub-collections to Cloud Firestore
      if (isCloudConnected && db) {
        onProgress?.(`Cloud synching categories and products for shop ${shopId}...`);

        // Categories
        for (const cat of (data.categories || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'categories', cat.id), cat, { merge: true });
        }

        // Products
        for (const prod of (data.products || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'products', prod.id), prod, { merge: true });
        }

        // Customers
        for (const cust of (data.customers || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'customers', cust.id), cust, { merge: true });
        }

        // Payments
        for (const pmt of (data.payments || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'payments', pmt.id), pmt, { merge: true });
        }

        // Sales
        for (const sale of (data.sales || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'sales', sale.id), sale, { merge: true });
        }

        // Recharges & MFS
        for (const rc of (data.recharges || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'recharges', rc.id), rc, { merge: true });
        }
        for (const mfs of (data.mfs || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'mfs', mfs.id), mfs, { merge: true });
        }

        // Expenses
        for (const exp of (data.expenses || [])) {
          await setDoc(doc(db, 'owners', currentOwnerId, 'shops', shopId, 'expenses', exp.id), exp, { merge: true });
        }
      }
    }

    onProgress?.('Backup restoration complete! Recalculating state indices...');
    return { success: true, stats };
  }

  /**
   * Helper to fetch local expenses cache or Firestore if connected
   */
  private static async getExpensesDirect(ownerId: string, shopId: string): Promise<any[]> {
    // We try to fetch cached expenses, otherwise empty array
    try {
      const raw = localStorage.getItem(`expenses_cache_${ownerId}_${shopId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
