# Security Specification & Threat Model (TDD)

This document outlines the data invariants and access control model for the Camposoft application.

## 1. Data Invariants & Access Control Model

We enforce zero-trust, attribute-based access control (ABAC) where each user's data is strictly isolated within their own document sub-branch under `/users/{userId}/...`.

- **Scope Separation**: Every collection represents resources owned solely by the parent `{userId}` document.
- **Identity Pinning**: All document reads, writes, and lists are authenticated. A user with UID `X` can *only* read, write, query, or delete under the path `/users/X/...`. Any across-user resource hijacking is strictly blocked.
- **Size Bounds**: String lengths are strictly defined and bounded to prevent Denial of Wallet (Resource Exhaustion) attacks.
- **Type Safety**: Field types are authenticated for every incoming write payload.

---

## 2. The "Dirty Dozen" (Audit Matrix)

| Attack ID | Entity | Payload Target | Malicious Action / Payload Value | Expected Outcome | Rule Safeguard |
|---|---|---|---|---|---|
| DD-01 | Animal | `/users/user_A/animals/animal_1` | User B (UID: `user_B`) attempts to create an animal inside User A's path. | `PERMISSION_DENIED` | Path checking `request.auth.uid == userId` |
| DD-02 | Animal | `/users/user_A/animals/animal_1` | User A attempts to write a Caravan with a 2MB string. | `PERMISSION_DENIED` | Size check `caravana.size() <= 64` |
| DD-03 | Animal | `/users/user_A/animals/animal_1` | Set `gender` to `"Helicopter"`. | `PERMISSION_DENIED` | Enum validation `gender in ['Macho', 'Hembra']` |
| DD-04 | Animal | `/users/user_A/animals/animal_1` | User A attempts to update an animal record but sets another tenant's `userId`. | `PERMISSION_DENIED` | Immutability: `incoming().userId == existing().userId` and matches `request.auth.uid` |
| DD-05 | Animal | `/users/user_A/animals/animal_1` | Set `createdAt` to a hardcoded past/future date instead of `request.time`. | `PERMISSION_DENIED` | Temporal validation `incoming().createdAt == request.time` |
| DD-06 | FeedInventory | `/users/user_A/feeds/feed_1` | User B attempts to write a feed document inside User A's directory. | `PERMISSION_DENIED` | Path checking `request.auth.uid == userId` |
| DD-07 | FeedInventory | `/users/user_A/feeds/feed_1` | Set `stockKg` to a negative scale (e.g. `-100`). | `PERMISSION_DENIED` | Boundary validation `stockKg >= 0` |
| DD-08 | FeedInventory | `/users/user_A/feeds/feed_1` | Set `source` to `"ExternalShop"`. | `PERMISSION_DENIED` | Enum validation `source in ['Producido', 'Comprado']` |
| DD-09 | FeedAssignment | `/users/user_A/feedAssignments/assign_1` | Create an assignment with an invalid non-matching `userId` field. | `PERMISSION_DENIED` | Identity check `incoming().userId == request.auth.uid` |
| DD-10 | CropField | `/users/user_A/fields/field_1` | Update the `rentalCostUSD` on a field to a negative value or string. | `PERMISSION_DENIED` | Shape validation: `rentalCostUSD is number && rentalCostUSD >= 0` |
| DD-11 | CropField | `/users/user_A/fields/field_1` | Set the `status` to `"SuperHarvested"`. | `PERMISSION_DENIED` | Enum validation `status in ['Planificado', 'Sembrado', 'En Desarrollo', 'Cosechado']` |
| DD-12 | Any | `/users/user_A/animals/animal_1` | Unauthenticated user attempts any read or write operation. | `PERMISSION_DENIED` | Global authenticated check `request.auth != null` |
