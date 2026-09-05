---
name: personal-gemini-journal-security
description: Security guidelines, custom instructions, and deployment directives for the Personal Gemini Journal app on Google Cloud Run and Firebase.
---

# Personal Gemini Journal: Custom Instructions & Security Directives

This skill codifies the architectural rules, security boundaries, and custom instructions for the **Personal Gemini Journal** application.

---

## 1. Zero-Trust Architecture Rules

1. **Authentication Gate**:
   - Every read and write to `/api/journal/history` and `/api/journal/reflect` MUST be authenticated with a verified Bearer token.
   - Unauthenticated or anonymous requests MUST immediately return `401 Unauthorized`.
   - Never allow unauthenticated fallback sessions in production.

2. **Tenant Isolation**:
   - All user data persists strictly under `/users/{userId}/interactions/{interactionId}`.
   - User A can never read, list, or write User B's documents.
   - Enforced by server-side identity resolution and Firestore Security Rules (`request.auth.uid == userId`).

3. **Data Loss Prevention (DLP)**:
   - Scrub sensitive personal information (PII) before sending prompts to Gemini.
   - Replace sensitive entities (names, emails, phone numbers, exact addresses) with cryptographic surrogate tokens (`[PERSON_1]`, `[EMAIL_1]`, `[PHONE_1]`, `[LOCATION_1]`).
   - Detokenize Gemini's response locally before displaying to the authenticated user.

4. **Key Management**:
   - The `GEMINI_API_KEY` MUST be retrieved from **Google Cloud Secret Manager** (`projects/.../secrets/GEMINI_API_KEY/versions/latest`) at runtime.
   - Never expose API keys in client-side bundles or repository code.

---

## 2. Google Maps Location Directives

When interacting with geospatial or location features:
1. **DLP Location Masking**:
   - User-provided location strings must be parsed into city-level resolution.
   - Do not pass precise street addresses or building numbers to external AI APIs.
2. **Reverse Geocoding Security**:
   - Coordinates are stored in the user's isolated Firestore subcollection.
   - Interactive maps must use localized Leaflet / Google Maps directives with CSP compliance.

---

## 3. Role-Based Access Control (RBAC) Directives

1. **Admin Permissions**:
   - Elevated operations (e.g. system audit logs, latency telemetry, rate-limit adjustments) require verified admin custom claims (`request.auth.token.admin == true`).
2. **Standard User Scope**:
   - Standard users have access exclusively to their own journal entries and their own multi-turn conversational threads.

---

## 4. Pre-Deployment Verification Checklist

Before deploying new revisions to Google Cloud Run:
- [ ] Run `npm run build` to verify 0 TypeScript and ESLint errors.
- [ ] Verify `verifyAuthToken` rejects unauthenticated requests with `401`.
- [ ] Ensure Secret Manager client is initialized with proper IAM permissions.
- [ ] Ensure Firestore rules prevent cross-tenant queries.
