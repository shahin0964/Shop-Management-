/**
 * Shop / Branch Domain Models
 */

export interface Shop {
  id: string;
  ownerId: string; // Tenant reference
  name: string;
  code: string; // Short code e.g. "DHK-01", "CTG-02"
  address?: string;
  phone?: string;
  email?: string;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopInput {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
}
