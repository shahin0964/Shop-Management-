/**
 * Authentication and Multi-Tenant Role Types
 */

export enum UserRole {
  OWNER = 'OWNER',
  SHOP_MANAGER = 'SHOP_MANAGER',
  CASHIER = 'CASHIER',
  STAFF = 'STAFF',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  ownerId: string; // Master Tenant Identifier (Owner's UID)
  assignedShopIds: string[]; // Shops this user has authorization to access (Empty for OWNER means all shops)
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerProfile {
  id: string; // Same as Owner's Auth UID
  businessName: string;
  legalName?: string;
  primaryEmail: string;
  primaryPhone?: string;
  currencyCode: string; // e.g. "BDT", "USD"
  currencySymbol: string; // e.g. "৳", "$"
  timezone: string;
  activeShopCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionState {
  user: UserProfile | null;
  owner: OwnerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeShopId: string | null; // null = Combined All-Shop view (Owner only)
}
