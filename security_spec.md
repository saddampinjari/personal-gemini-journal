# Security Specification & Threat Audit: Personal Gemini Journal

## 1. Core Data Invariants & Access Boundary
1. **Tenant Isolation**: All journal documents exist exclusively under `/users/{userId}/interactions/{interactionId}`. Cross-user reading or writing is mathematically prohibited.
2. **Identity Integrity**: `request.auth.uid == userId` must be strictly enforced on all CRUD operations (`get`, `list`, `create`, `update`, `delete`).
3. **Verified Authentication**: Standard operations require `request.auth != null`.
4. **Field Immutability**: `userId` and `createdAt` cannot be modified after document creation.
5. **Denial of Wallet Protection**: Bounded length limits on strings (`rawPrompt` <= 10000 chars, `title` <= 200 chars) and ID patterns `^[a-zA-Z0-9_-]+$`.
6. **Zero Client Trust**: System fields and timestamps are strictly validated.

---

## 2. The "Dirty Dozen" Threat Payloads

| # | Attack Vector | Target Path | Payload Description | Expected Result |
|---|---------------|-------------|---------------------|-----------------|
| 1 | Cross-Tenant Read | `/users/victim_user/interactions/doc1` | User `attacker_user` attempts `get()` | `PERMISSION_DENIED` |
| 2 | Cross-Tenant List/Scrape | `/users/victim_user/interactions` | User `attacker_user` attempts collection query | `PERMISSION_DENIED` |
| 3 | Unauthenticated Read | `/users/any_user/interactions/doc1` | Anonymous client attempts `get()` | `PERMISSION_DENIED` |
| 4 | Unauthenticated Write | `/users/any_user/interactions/doc1` | Anonymous client attempts `setDoc()` | `PERMISSION_DENIED` |
| 5 | ID Poisoning Attack | `/users/user123/interactions/../../../evil` | Path traversal string in `interactionId` | `PERMISSION_DENIED` |
| 6 | Ghost Field Injection | `/users/user123/interactions/doc1` | Payload includes injected `isAdmin: true` or hidden role keys | `PERMISSION_DENIED` |
| 7 | Identity Spoofing | `/users/user123/interactions/doc1` | User `attacker_user` attempts write with `userId: 'user123'` | `PERMISSION_DENIED` |
| 8 | Large Payload DoS (Denial of Wallet) | `/users/user123/interactions/doc1` | `rawPrompt` exceeds 10,000 characters | `PERMISSION_DENIED` |
| 9 | Immutable Field Tampering | `/users/user123/interactions/doc1` | Attempting to update `userId` or `createdAt` on existing document | `PERMISSION_DENIED` |
| 10 | Blanket Query Attempt | `/users/{userId}/interactions` | Attempting unconstrained collectionGroup list query | `PERMISSION_DENIED` |
| 11 | Malformed Interaction ID | `/users/user123/interactions/inv@lid!id#$` | Non-alphanumeric interactionId format | `PERMISSION_DENIED` |
| 12 | Schema Bypass Missing Required | `/users/user123/interactions/doc1` | Missing `rawPrompt` or `sanitizedPrompt` on creation | `PERMISSION_DENIED` |

---

## 3. Threat Model Review Table
* **Identity Spoofing**: Blocked by `request.auth.uid == userId` and `incoming().userId == request.auth.uid`.
* **Resource Poisoning**: Blocked by strict length checks and regex validation on all path IDs.
* **Update Gaps**: Blocked by immutable field checks and strict affected key restrictions.
