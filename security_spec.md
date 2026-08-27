# Security Specification: Multi-Tenant Multi-Shop Hierarchy

## 1. System Invariants & Master Source of Truth
1. **Tenant Isolation**: An Owner's ID (`ownerId`) is the root partition key for all operational data. Data located under `/owners/{ownerId}/...` is strictly inaccessible to any user whose profile does not resolve to that `ownerId`.
2. **Shop Integrity**: Every branch/shop belongs strictly to one Owner. Staff can only access shops listed in their `assignedShopIds` array (or all shops if role is `OWNER`).
3. **Product Catalog Uniformity**: Products exist at the Owner level (`/owners/{ownerId}/products/{productId}`) and stock levels exist at the Shop branch level (`/owners/{ownerId}/shops/{shopId}/inventory/{productId}`).
4. **Stock Transfer Guarantee**: Transfers (`/owners/{ownerId}/transfers/{transferId}`) can only be executed between two shops that share the exact same `ownerId`.
5. **No Client Trust**: Document permissions are enforced strictly by server-side Firestore security rules verifying `request.auth.uid`, role verification via document lookup, and immutable tenant IDs.

---

## 2. The Dirty Dozen Attack Payloads & Mitigation

| # | Attack Vector | Malicious Payload / Action | Rule Engine Gate Mitigation |
|---|---|---|---|
| 1 | **Cross-Tenant Hijack** | Owner A attempts to read `/owners/{ownerB}/shops/...` | Master Gate: `request.auth.uid == ownerId` or relational membership check fails immediately with PERMISSION_DENIED. |
| 2 | **Role Escalation on Registration** | User attempts to create own user doc with `role: "OWNER"` on another tenant | `isValidUser()` enforces `incoming().ownerId == request.auth.uid` for owners, and staff creation is restricted to existing owners. |
| 3 | **Tenant ID Mutation** | User sends update changing `ownerId: "owner_xyz"` | Immutability Rule: `incoming().ownerId == existing().ownerId` required on all updates. |
| 4 | **Unassigned Shop Access** | Staff with access only to `Shop A` attempts to list inventory of `Shop B` | ABAC Gate: `isShopMember(ownerId, shopId)` verifies `shopId in get(...).data.assignedShopIds`. |
| 5 | **Resource Exhaustion / Oversized Payload** | Attacker sends 2MB text in `product.name` or 50KB in `code` | Mandatory Size Check: `data.name.size() <= 128` and `data.code.size() <= 64`. |
| 6 | **ID Path Poisoning** | Attacker targets `/owners/{ownerId}/shops/../../evil` | `isValidId(id)` regex check `^[a-zA-Z0-9_\\-]+$` on all path variables. |
| 7 | **Ghost Field Injection** | Attacker includes undocumented `{ "isAdmin": true }` in Product write | Blueprint exact key checking: `data.keys().hasAll(...) && data.keys().size() == N` on creation. |
| 8 | **Negative Price / Stock Tampering** | Attacker creates product with `costPrice: -500` or negative stock | Type and domain checks: `data.costPrice >= 0 && data.sellingPrice >= 0`. |
| 9 | **Fake Timestamp Spoofing** | Attacker supplies custom past/future `createdAt` | Strict Server Time: `incoming().createdAt == request.time`. |
| 10| **Inter-Tenant Transfer Spoof** | Attacker creates transfer from `Owner A / Shop 1` to `Owner B / Shop 2` | Same-Owner Validation: `exists(/databases/$(database)/documents/owners/$(ownerId)/shops/$(incoming().destinationShopId))` |
| 11| **Terminal State Mutation** | Attacker modifies transfer items on `status: "RECEIVED"` or `"CANCELLED"` | Terminal State Lock: updates prohibited once state is in terminal enum. |
| 12| **Query Scraping Bypass** | Attacker queries `/owners/{ownerId}/products` without tenant filter | Query Enforcer: `allow list: if isOwner(ownerId) || isStaffOfOwner(ownerId)`. |
