import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { UserRole, type UserProfile, type OwnerProfile } from '../types/auth.ts';
import { auth, db, isCloudConnected } from './firebase.ts';
import { handleFirestoreError, OperationType } from './firestoreErrors.ts';

const SESSION_STORAGE_KEY = 'sms_auth_session';
const ACCOUNTS_STORAGE_KEY = 'sms_registered_accounts';

export interface StoredSession {
  user: UserProfile;
  owner: OwnerProfile;
}

export interface RegisterOwnerInput {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  currencyCode?: string;
  currencySymbol?: string;
}

interface LocalStoredAccount {
  uid: string;
  email: string;
  passwordHash: string;
  user: UserProfile;
  owner: OwnerProfile;
}

export class AuthService {
  /**
   * Helper to hash passwords locally (simple fast hash for local state demonstration)
   */
  private static hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `pwd_hash_${Math.abs(hash).toString(36)}_${password.length}`;
  }

  /**
   * Retrieve all registered local accounts
   */
  private static getLocalAccounts(): LocalStoredAccount[] {
    try {
      const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as LocalStoredAccount[];
    } catch {
      return [];
    }
  }

  /**
   * Save a local account to persistent local storage
   */
  private static saveLocalAccount(account: LocalStoredAccount): void {
    const accounts = this.getLocalAccounts();
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }

  /**
   * Get active authenticated session from local storage
   */
  static getLocalSession(): StoredSession | null {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as StoredSession;
    } catch {
      return null;
    }
  }

  /**
   * Persist active session
   */
  static saveSession(user: UserProfile, owner: OwnerProfile): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, owner }));
  }

  /**
   * Clear active session
   */
  static clearSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /**
   * Register a new Owner Account
   */
  static async registerOwner(input: RegisterOwnerInput): Promise<StoredSession> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedBusiness = input.businessName.trim();
    const trimmedOwner = input.ownerName.trim();
    const currencyCode = (input.currencyCode?.trim() || 'BDT').toUpperCase();
    const currencySymbol = input.currencySymbol?.trim() || '৳';

    if (!trimmedEmail || !trimmedBusiness || !trimmedOwner || !input.password) {
      throw new Error('All required registration fields must be filled.');
    }

    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters in length.');
    }

    const now = new Date().toISOString();

    // 1. If Firebase Auth & Firestore are connected, register via Cloud
    if (isCloudConnected && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, input.password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: trimmedOwner });

        const ownerId = firebaseUser.uid;

        const ownerProfile: OwnerProfile = {
          id: ownerId,
          businessName: trimmedBusiness,
          primaryEmail: trimmedEmail,
          currencyCode,
          currencySymbol,
          timezone: 'Asia/Dhaka',
          activeShopCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        const userProfile: UserProfile = {
          uid: ownerId,
          email: trimmedEmail,
          displayName: trimmedOwner,
          role: UserRole.OWNER,
          ownerId: ownerId,
          assignedShopIds: [],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        // Write Owner document to Firestore
        const ownerDocPath = `owners/${ownerId}`;
        try {
          await setDoc(doc(db, 'owners', ownerId), {
            id: ownerId,
            businessName: trimmedBusiness,
            primaryEmail: trimmedEmail,
            currencyCode,
            currencySymbol,
            timezone: 'Asia/Dhaka',
            activeShopCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, ownerDocPath);
        }

        // Write User document to Firestore
        const userDocPath = `owners/${ownerId}/users/${ownerId}`;
        try {
          await setDoc(doc(db, 'owners', ownerId, 'users', ownerId), {
            uid: ownerId,
            email: trimmedEmail,
            displayName: trimmedOwner,
            role: 'OWNER',
            ownerId: ownerId,
            assignedShopIds: [],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, userDocPath);
        }

        this.saveSession(userProfile, ownerProfile);
        return { user: userProfile, owner: ownerProfile };
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('An account with this email address already exists. Please sign in instead.');
        } else if (err.code === 'auth/invalid-email') {
          throw new Error('Please provide a valid email address.');
        } else if (err.code === 'auth/weak-password') {
          throw new Error('The password provided is too weak. Please use at least 6 characters.');
        }
        throw new Error(err.message || 'Failed to register account with cloud authentication.');
      }
    }

    // 2. Local / Standard Resilient Mode
    const accounts = this.getLocalAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const ownerId = `owner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const ownerProfile: OwnerProfile = {
      id: ownerId,
      businessName: trimmedBusiness,
      primaryEmail: trimmedEmail,
      currencyCode,
      currencySymbol,
      timezone: 'Asia/Dhaka',
      activeShopCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const userProfile: UserProfile = {
      uid: ownerId,
      email: trimmedEmail,
      displayName: trimmedOwner,
      role: UserRole.OWNER,
      ownerId: ownerId,
      assignedShopIds: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const localAccount: LocalStoredAccount = {
      uid: ownerId,
      email: trimmedEmail,
      passwordHash: this.hashPassword(input.password),
      user: userProfile,
      owner: ownerProfile,
    };

    this.saveLocalAccount(localAccount);
    this.saveSession(userProfile, ownerProfile);

    return { user: userProfile, owner: ownerProfile };
  }

  /**
   * Log In an Existing Owner Account
   */
  static async login(email: string, password: string): Promise<StoredSession> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    // 1. If Firebase Auth & Firestore are connected
    if (isCloudConnected && auth && db) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const firebaseUser = userCredential.user;
        const ownerId = firebaseUser.uid;

        // Fetch Owner doc
        const ownerDocPath = `owners/${ownerId}`;
        let ownerProfile: OwnerProfile;
        try {
          const ownerSnap = await getDoc(doc(db, 'owners', ownerId));
          if (ownerSnap.exists()) {
            const data = ownerSnap.data();
            ownerProfile = {
              id: ownerId,
              businessName: data.businessName || 'Business Owner',
              primaryEmail: data.primaryEmail || trimmedEmail,
              currencyCode: data.currencyCode || 'BDT',
              currencySymbol: data.currencySymbol || '৳',
              timezone: data.timezone || 'Asia/Dhaka',
              activeShopCount: data.activeShopCount || 0,
              createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            };
          } else {
            // Fallback owner profile if not yet in DB
            ownerProfile = {
              id: ownerId,
              businessName: firebaseUser.displayName || 'Enterprise Owner',
              primaryEmail: trimmedEmail,
              currencyCode: 'BDT',
              currencySymbol: '৳',
              timezone: 'Asia/Dhaka',
              activeShopCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, ownerDocPath);
        }

        const userProfile: UserProfile = {
          uid: ownerId,
          email: trimmedEmail,
          displayName: firebaseUser.displayName || ownerProfile.businessName,
          role: UserRole.OWNER,
          ownerId: ownerId,
          assignedShopIds: [],
          isActive: true,
          createdAt: ownerProfile.createdAt,
          updatedAt: ownerProfile.updatedAt,
        };

        this.saveSession(userProfile, ownerProfile);
        return { user: userProfile, owner: ownerProfile };
      } catch (err: any) {
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password'
        ) {
          throw new Error('Invalid email or password. Please verify your credentials and try again.');
        } else if (err.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address.');
        }
        throw new Error(err.message || 'Failed to authenticate.');
      }
    }

    // 2. Local / Offline Resilient Mode
    const accounts = this.getLocalAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

    if (!account) {
      throw new Error('No owner account found with this email address. Please register first.');
    }

    if (account.passwordHash !== this.hashPassword(password)) {
      throw new Error('Invalid password. Please check your credentials and try again.');
    }

    this.saveSession(account.user, account.owner);
    return { user: account.user, owner: account.owner };
  }

  /**
   * Log Out Active User
   */
  static async signOut(): Promise<void> {
    if (isCloudConnected && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('[Firebase] Sign out error:', err);
      }
    }
    this.clearSession();
  }
}
