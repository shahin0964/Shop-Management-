import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { type Shop, type CreateShopInput } from '../types/shop.ts';
import { db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';

const SHOPS_STORAGE_PREFIX = 'sms_owner_shops_';

export class ShopService {
  /**
   * Fetch all shops for an authenticated Owner
   */
  static async getShops(ownerId: string): Promise<Shop[]> {
    if (!ownerId) {
      throw new Error('Owner ID is required to fetch shops.');
    }

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const path = `owners/${ownerId}/shops`;
      try {
        const querySnapshot = await getDocs(collection(db, 'owners', ownerId, 'shops'));
        const shops: Shop[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          shops.push({
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            name: data.name || '',
            code: data.code || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            isMainBranch: data.isMainBranch ?? false,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          });
        });
        return shops;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    }

    // 2. Local / Standard Resilient Mode
    try {
      const storageKey = `${SHOPS_STORAGE_PREFIX}${ownerId}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [];
      const parsedShops = JSON.parse(saved) as Shop[];
      // Strictly enforce owner ID match on all loaded records
      return parsedShops.filter((s) => s.ownerId === ownerId);
    } catch {
      return [];
    }
  }

  /**
   * Create a new shop under the authenticated Owner
   */
  static async createShop(
    ownerId: string,
    input: CreateShopInput,
    existingShopCount = 0
  ): Promise<Shop> {
    if (!ownerId) {
      throw new Error('Authenticated owner identity required.');
    }

    const trimmedName = input.name.trim();
    const trimmedCode = input.code.trim().toUpperCase();

    if (!trimmedName) {
      throw new Error('Shop/Branch name is required.');
    }

    if (!trimmedCode) {
      throw new Error('Shop/Branch code is required.');
    }

    const shopId = `shop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const isFirstBranch = existingShopCount === 0;
    const isMainBranch = input.isMainBranch ?? isFirstBranch;

    const newShop: Shop = {
      id: shopId,
      ownerId,
      name: trimmedName,
      code: trimmedCode,
      address: input.address?.trim() || '',
      phone: input.phone?.trim() || '',
      email: input.email?.trim() || '',
      isMainBranch,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Cloud Firestore Mode
    if (isCloudConnected && db) {
      const shopDocPath = `owners/${ownerId}/shops/${shopId}`;
      try {
        await setDoc(doc(db, 'owners', ownerId, 'shops', shopId), {
          id: shopId,
          ownerId,
          name: trimmedName,
          code: trimmedCode,
          address: input.address?.trim() || '',
          phone: input.phone?.trim() || '',
          email: input.email?.trim() || '',
          isMainBranch,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Update owner activeShopCount
        const ownerDocRef = doc(db, 'owners', ownerId);
        await updateDoc(ownerDocRef, {
          activeShopCount: increment(1),
          updatedAt: serverTimestamp(),
        }).catch(() => {
          // Non-blocking if counter update fails
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, shopDocPath);
      }
    }

    // 2. Local / Standard Resilient Mode
    const storageKey = `${SHOPS_STORAGE_PREFIX}${ownerId}`;
    const currentShops = await this.getShops(ownerId);

    // If setting as main branch, demote others
    const updatedShops = currentShops.map((s) =>
      isMainBranch ? { ...s, isMainBranch: false } : s
    );

    updatedShops.push(newShop);
    localStorage.setItem(storageKey, JSON.stringify(updatedShops));

    return newShop;
  }

  /**
   * Get single shop with Owner Verification
   */
  static async getShopById(ownerId: string, shopId: string): Promise<Shop | null> {
    if (!ownerId || !shopId) return null;

    if (isCloudConnected && db) {
      const shopDocPath = `owners/${ownerId}/shops/${shopId}`;
      try {
        const snap = await getDoc(doc(db, 'owners', ownerId, 'shops', shopId));
        if (!snap.exists()) return null;
        const data = snap.data();
        if (data.ownerId !== ownerId) {
          throw new Error('Access denied: shop does not belong to the authenticated owner.');
        }
        return {
          id: snap.id,
          ownerId: data.ownerId,
          name: data.name,
          code: data.code,
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          isMainBranch: data.isMainBranch ?? false,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, shopDocPath);
      }
    }

    const shops = await this.getShops(ownerId);
    const found = shops.find((s) => s.id === shopId);
    if (found && found.ownerId !== ownerId) {
      throw new Error('Unauthorized access attempt to shop belonging to another owner.');
    }
    return found || null;
  }
}
