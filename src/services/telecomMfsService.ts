import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';
import {
  TelecomRecharge,
  CreateRechargeInput,
  MfsTransaction,
  CreateMfsTransactionInput,
} from '../types/telecomMfs.ts';

// In-memory submission locks for idempotency/duplicate protection
const activeRechargeLocks = new Set<string>();
const activeMfsLocks = new Set<string>();

/**
 * Clean & validate phone number format.
 * Expects 8 to 15 digits (allowing optional leading plus sign).
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; cleaned: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, cleaned: '', error: 'Customer mobile number is required' };
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.length === 0) {
    return { isValid: false, cleaned: '', error: 'Customer mobile number is required' };
  }

  // Regex check for numeric or +numeric
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, cleaned, error: 'Enter a valid mobile number (8-15 digits, e.g. 01712345678)' };
  }

  return { isValid: true, cleaned };
}

/**
 * Validate financial transaction amount. Must be greater than 0.
 */
export function validateAmount(amount: number): { isValid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  if (amount <= 0) {
    return { isValid: false, error: 'Transaction amount must be greater than zero (0)' };
  }
  return { isValid: true };
}

// LocalStorage helpers for persistent offline/fallback mode
function getLocalRechargesKey(ownerId: string, shopId: string): string {
  return `sms_recharges_${ownerId}_${shopId}`;
}

function getLocalMfsKey(ownerId: string, shopId: string): string {
  return `sms_mfs_${ownerId}_${shopId}`;
}

function getLocalRecharges(ownerId: string, shopId: string): TelecomRecharge[] {
  try {
    const raw = localStorage.getItem(getLocalRechargesKey(ownerId, shopId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRecharge(ownerId: string, shopId: string, record: TelecomRecharge) {
  try {
    const existing = getLocalRecharges(ownerId, shopId);
    const updated = [record, ...existing.filter((r) => r.id !== record.id)];
    localStorage.setItem(getLocalRechargesKey(ownerId, shopId), JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to cache recharge in localStorage:', err);
  }
}

function getLocalMfs(ownerId: string, shopId: string): MfsTransaction[] {
  try {
    const raw = localStorage.getItem(getLocalMfsKey(ownerId, shopId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMfs(ownerId: string, shopId: string, record: MfsTransaction) {
  try {
    const existing = getLocalMfs(ownerId, shopId);
    const updated = [record, ...existing.filter((m) => m.id !== record.id)];
    localStorage.setItem(getLocalMfsKey(ownerId, shopId), JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to cache MFS transaction in localStorage:', err);
  }
}

export const telecomMfsService = {
  /**
   * Fetch Telecom Recharges for a specific shop
   */
  async getRecharges(ownerId: string, shopId: string): Promise<TelecomRecharge[]> {
    if (!ownerId || !shopId) return [];

    const path = `owners/${ownerId}/shops/${shopId}/recharges`;
    try {
      if (db) {
        const rechargesRef = collection(db, 'owners', ownerId, 'shops', shopId, 'recharges');
        const q = query(rechargesRef, orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        const list: TelecomRecharge[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            operator: data.operator || 'Other',
            customerPhone: data.customerPhone || '',
            amount: data.amount || 0,
            reference: data.reference || '',
            note: data.note || '',
            createdBy: data.createdBy || 'User',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
          };
        });

        // Sync to local cache
        localStorage.setItem(getLocalRechargesKey(ownerId, shopId), JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore fetch recharges failed, using local cache:', err);
    }

    return getLocalRecharges(ownerId, shopId);
  },

  /**
   * Create a new Mobile Recharge / Load transaction record
   */
  async createRecharge(
    ownerId: string,
    shopId: string,
    createdBy: string,
    input: CreateRechargeInput
  ): Promise<TelecomRecharge> {
    if (!ownerId || !shopId) {
      throw new Error('Valid owner and shop context are required to record a recharge transaction');
    }

    // Validation
    const phoneVal = validatePhoneNumber(input.customerPhone);
    if (!phoneVal.isValid) {
      throw new Error(phoneVal.error || 'Invalid phone number');
    }

    const amtVal = validateAmount(input.amount);
    if (!amtVal.isValid) {
      throw new Error(amtVal.error || 'Invalid amount');
    }

    if (!input.operator || input.operator.trim().length === 0) {
      throw new Error('Mobile operator is required');
    }

    // Duplicate submission lock key
    const lockKey = `${ownerId}_${shopId}_${input.operator}_${phoneVal.cleaned}_${input.amount}_${input.reference || ''}`;
    if (activeRechargeLocks.has(lockKey)) {
      throw new Error('Duplicate transaction request in progress. Please wait.');
    }

    activeRechargeLocks.add(lockKey);

    try {
      const nowIso = new Date().toISOString();
      const rechargeId = `TRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newRecord: TelecomRecharge = {
        id: rechargeId,
        ownerId,
        shopId,
        operator: input.operator.trim(),
        customerPhone: phoneVal.cleaned,
        amount: Number(input.amount),
        reference: input.reference?.trim() || '',
        note: input.note?.trim() || '',
        createdBy,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const path = `owners/${ownerId}/shops/${shopId}/recharges/${rechargeId}`;

      if (db) {
        try {
          const docRef = doc(db, 'owners', ownerId, 'shops', shopId, 'recharges', rechargeId);
          await setDoc(docRef, {
            ...newRecord,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }

      saveLocalRecharge(ownerId, shopId, newRecord);
      return newRecord;
    } finally {
      activeRechargeLocks.delete(lockKey);
    }
  },

  /**
   * Fetch MFS Transactions (bKash, Nagad, Rocket) for a specific shop
   */
  async getMfsTransactions(ownerId: string, shopId: string): Promise<MfsTransaction[]> {
    if (!ownerId || !shopId) return [];

    const path = `owners/${ownerId}/shops/${shopId}/mfs_transactions`;
    try {
      if (db) {
        const mfsRef = collection(db, 'owners', ownerId, 'shops', shopId, 'mfs_transactions');
        const q = query(mfsRef, orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        const list: MfsTransaction[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: data.ownerId || ownerId,
            shopId: data.shopId || shopId,
            provider: data.provider || 'BKASH',
            type: data.type || 'CASH_IN',
            amount: data.amount || 0,
            customerPhone: data.customerPhone || '',
            reference: data.reference || '',
            note: data.note || '',
            createdBy: data.createdBy || 'User',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
          };
        });

        // Sync to local cache
        localStorage.setItem(getLocalMfsKey(ownerId, shopId), JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore fetch MFS transactions failed, using local cache:', err);
    }

    return getLocalMfs(ownerId, shopId);
  },

  /**
   * Create a new MFS Transaction record (bKash, Nagad, Rocket)
   */
  async createMfsTransaction(
    ownerId: string,
    shopId: string,
    createdBy: string,
    input: CreateMfsTransactionInput
  ): Promise<MfsTransaction> {
    if (!ownerId || !shopId) {
      throw new Error('Valid owner and shop context are required to record an MFS transaction');
    }

    // Validation
    const phoneVal = validatePhoneNumber(input.customerPhone);
    if (!phoneVal.isValid) {
      throw new Error(phoneVal.error || 'Invalid phone number');
    }

    const amtVal = validateAmount(input.amount);
    if (!amtVal.isValid) {
      throw new Error(amtVal.error || 'Invalid amount');
    }

    if (!input.provider) {
      throw new Error('MFS Provider (e.g. bKash, Nagad, Rocket) is required');
    }

    if (!input.type) {
      throw new Error('Transaction type is required');
    }

    // Duplicate submission lock key
    const lockKey = `${ownerId}_${shopId}_${input.provider}_${input.type}_${phoneVal.cleaned}_${input.amount}_${input.reference || ''}`;
    if (activeMfsLocks.has(lockKey)) {
      throw new Error('Duplicate transaction request in progress. Please wait.');
    }

    activeMfsLocks.add(lockKey);

    try {
      const nowIso = new Date().toISOString();
      const mfsId = `MFS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newRecord: MfsTransaction = {
        id: mfsId,
        ownerId,
        shopId,
        provider: input.provider,
        type: input.type,
        amount: Number(input.amount),
        customerPhone: phoneVal.cleaned,
        reference: input.reference?.trim() || '',
        note: input.note?.trim() || '',
        createdBy,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const path = `owners/${ownerId}/shops/${shopId}/mfs_transactions/${mfsId}`;

      if (db) {
        try {
          const docRef = doc(db, 'owners', ownerId, 'shops', shopId, 'mfs_transactions', mfsId);
          await setDoc(docRef, {
            ...newRecord,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }

      saveLocalMfs(ownerId, shopId, newRecord);
      return newRecord;
    } finally {
      activeMfsLocks.delete(lockKey);
    }
  },
};
