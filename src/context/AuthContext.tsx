import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole, type UserProfile, type OwnerProfile, type AuthSessionState } from '../types/auth.ts';
import { AuthService, type RegisterOwnerInput } from '../services/authService.ts';
import { auth, db, initFirebase } from '../services/firebase.ts';

interface AuthContextType extends AuthSessionState {
  registerOwner: (input: RegisterOwnerInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isCloudConnected: boolean;
  clearAuthError: () => void;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShopId] = useState<string | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initialize Firebase if configured
    const { auth: firebaseAuth, isCloudConnected: cloudReady } = initFirebase();
    setIsCloudConnected(cloudReady);

    if (cloudReady && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (firebaseUser && db) {
          try {
            const ownerSnap = await getDoc(doc(db, 'owners', firebaseUser.uid));
            if (ownerSnap.exists()) {
              const data = ownerSnap.data();
              const ownerData: OwnerProfile = {
                id: firebaseUser.uid,
                businessName: data.businessName || 'Business Owner',
                primaryEmail: data.primaryEmail || firebaseUser.email || '',
                currencyCode: data.currencyCode || 'BDT',
                currencySymbol: data.currencySymbol || '৳',
                timezone: data.timezone || 'Asia/Dhaka',
                activeShopCount: data.activeShopCount || 0,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              };

              const userData: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || ownerData.businessName,
                role: UserRole.OWNER,
                ownerId: firebaseUser.uid,
                assignedShopIds: [],
                isActive: true,
                createdAt: ownerData.createdAt,
                updatedAt: ownerData.updatedAt,
              };

              setUser(userData);
              setOwner(ownerData);
              AuthService.saveSession(userData, ownerData);
            }
          } catch (err) {
            console.error('[Auth] Failed to load Firestore user profile on auth change:', err);
          }
        } else {
          // If no firebaseUser in cloud mode and not in local session
          const stored = AuthService.getLocalSession();
          if (stored) {
            setUser(stored.user);
            setOwner(stored.owner);
          } else {
            setUser(null);
            setOwner(null);
          }
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      // 2. Local / Offline mode fallback
      const stored = AuthService.getLocalSession();
      if (stored) {
        setUser(stored.user);
        setOwner(stored.owner);
      }
      setIsLoading(false);
    }
  }, []);

  const registerOwner = async (input: RegisterOwnerInput) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const session = await AuthService.registerOwner(input);
      setUser(session.user);
      setOwner(session.owner);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const session = await AuthService.login(email, password);
      setUser(session.user);
      setOwner(session.owner);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setOwner(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        owner,
        isAuthenticated: !!user,
        isLoading,
        activeShopId,
        isCloudConnected,
        authError,
        registerOwner,
        login,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
