# Personal Gemini Journal

> **Enterprise Zero-Trust AI Journal & Reflection Space**  
> Fortified by a server-side **Zero-Trust Privacy Gateway (DLP)**, runtime **Google Cloud Secret Manager** key injection with in-memory caching, multi-tier **Gemini Model Fallback Ladder**, and tenant-isolated **Cloud Firestore** native persistence.

---

## 1. Mandatory Agentic Threat Model: 5-Zone Security Matrix

| # | Threat Zone | Concrete Threat & Attack Vector | Impact & Risk Level | Enterprise Countermeasure & Mitigation |
|---|-------------|---------------------------------|---------------------|------------------------------------------|
| **1** | **Input Surfaces** | Raw reflection payloads containing customer PII (names, emails, phones, SSNs, credit cards, locations), malformed JSON, and oversized injection payloads. | **CRITICAL**: PII exfiltration, identity leaks to 3rd-party model providers, DoS attacks. | **Server-Side Zero-Trust Privacy Gateway**: High-precision DLP engine scans and replaces all sensitive entities with surrogate tokens (`[PERSON_1]`, `[LOCATION_1]`) *before* invoking Gemini. Enforces strict input validation (`size <= 10,000` chars). |
| **2** | **Planning & Reasoning** | Prompt injection, role hijacking, instruction dumping, or manipulation of psychological framing. | **HIGH**: Model deviation, unhelpful or unsafe coaching outputs. | **Hardened System Instructions**: System prompts enforce active empathetic listening, non-judgmental reframing, and preservation of token bracket formatting. Zero raw PII is exposed to the reasoning context. |
| **3** | **Tool Execution & Model Resilience** | Upstream Gemini API outages (503), rate limiting (429), model alias deprecation (404), or internal errors (500). | **HIGH**: Service denial, dropped user reflections, user frustration. | **4-Tier Resilient Model Fallback Ladder**: Automated cascading recovery ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) with telemetry trail recording. |
| **4** | **Memory & State** | Cross-tenant data scraping, unauthorized Firestore reads/writes, session hijacking, orphaned records. | **CRITICAL**: Exposure of sensitive personal journals across users. | **Subcollection Tenant Isolation & ABAC**: Data stored strictly at `/users/{userId}/interactions/{interactionId}`. Enforced via Firestore Security Rules requiring `request.auth.uid == userId`, bounded string lengths, and field immutability. |
| **5** | **Inter-System Communication** | API secret exposure in client bundles, unencrypted transit, stolen JWT tokens. | **CRITICAL**: Cloud account compromise, API quota draining. | **Zero Client Credential Exposure**: `GEMINI_API_KEY` is fetched dynamically at runtime from **Google Cloud Secret Manager** and cached in-memory across warm starts. Backend verifies JWTs via `firebase-admin.auth().verifyIdToken()`. |

---

## 2. Zero-Trust Privacy Gateway Architecture

```
[ User Browser (Client) ]
       │
       │ HTTPS / Authorization: Bearer <Firebase_JWT>
       ▼
[ Google Cloud Run Container ]
       │
       ├─► 1. Identity Verification (firebase-admin.auth().verifyIdToken())
       │
       ├─► 2. Zero-Trust Privacy Gateway (DLP De-identification)
       │       • Replaces Sarah Connor -> [PERSON_1]
       │       • Replaces Seattle      -> [LOCATION_1]
       │
       ├─► 3. Dynamic Secret Manager (Fetch & In-Memory Cache GEMINI_API_KEY)
       │
       ├─► 4. Resilient Gemini Engine (Ladder: 3.6-flash -> 3.1-lite -> flash-latest -> 3.7-flash)
       │       • Sends ONLY sanitized string with surrogate tokens
       │
       ├─► 5. Server-Side Detokenization (Restores entities for authenticated user)
       │
       ├─► 6. Tenant-Isolated Firestore Write (/users/{uid}/interactions/{id})
       │
       ▼
[ Client Security Inspector HUD ] (Live visual proof of DLP, secret cache, and model metrics)
```

---

## 3. Google Cloud Secret Manager Provisioning & IAM Setup

### Step 1: Create the Secret in Secret Manager
```bash
# Set your active GCP project ID
export PROJECT_ID=$(gcloud config get-value project)

# Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY \
    --project="${PROJECT_ID}" \
    --replication-policy="automatic"

# Add the secret payload version
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY \
    --project="${PROJECT_ID}" \
    --data-file=-
```

### Step 2: Grant Cloud Run Service Account Access
```bash
# Retrieve the default Compute Engine or Cloud Run service account
export SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"

# Grant Secret Accessor role to the service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Run Deployment Command

Deploy directly to Google Cloud Run with the mandatory challenge verification label:

```bash
gcloud run deploy personal-gemini-journal \
    --project="${PROJECT_ID}" \
    --region="us-central1" \
    --source="." \
    --platform="managed" \
    --allow-unauthenticated \
    --port=3000 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GEMINI_SECRET_NAME=GEMINI_API_KEY" \
    --update-labels=dev-tutorial=cloud-run-ai-challenge
```

---

## 5. Cloud Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isValidInteraction(data, userId) {
      return data.userId == userId
        && data.userId == request.auth.uid
        && data.rawPrompt is string
        && data.rawPrompt.size() > 0
        && data.rawPrompt.size() <= 10000
        && data.sanitizedPrompt is string
        && data.sanitizedPrompt.size() <= 10000
        && data.reflection is string
        && data.reflection.size() <= 20000
        && (data.title == null || (data.title is string && data.title.size() <= 200))
        && (data.mood == null || (data.mood is string && data.mood.size() <= 32))
        && (data.piiEntitiesCount == null || data.piiEntitiesCount is number)
        && (data.modelUsed == null || (data.modelUsed is string && data.modelUsed.size() <= 64))
        && (data.latencyMs == null || data.latencyMs is number);
    }

    match /{document=**} {
      allow read, write: if false;
    }

    match /users/{userId}/interactions/{interactionId} {
      allow get: if isOwner(userId) && isValidId(userId) && isValidId(interactionId);
      allow list: if isOwner(userId) && isValidId(userId);
      allow create: if isOwner(userId)
        && isValidId(userId)
        && isValidId(interactionId)
        && isValidInteraction(incoming(), userId);
      allow update: if isOwner(userId)
        && isValidId(userId)
        && isValidId(interactionId)
        && isValidInteraction(incoming(), userId)
        && incoming().userId == existing().userId
        && (existing().createdAt == null || incoming().createdAt == existing().createdAt);
      allow delete: if isOwner(userId) && isValidId(userId) && isValidId(interactionId);
    }
  }
}
```

---

## 6. Functional Walkthrough Test Cases

| Test Case | Interaction Steps | Expected Outcome |
|-----------|-------------------|------------------|
| **TC-1: Theme Toggle** | Click the theme icon (Sun/Moon) in the top header. | The application smoothly toggles between Google Material 3 Light Mode (clean tonal surfaces) and Dark Mode (deep slate surfaces) and persists preference in `localStorage`. |
| **TC-2: Instant Demo Authentication** | Click "Test Demo Session" on the welcome screen. | Instantly authenticates as `Cloud Run Reviewer` with `demo-user-77` without blocking popups, displaying the active dashboard workspace. |
| **TC-3: Live PII De-identification Preview** | Type `"Had lunch in Seattle with Dr. Sarah Connor about our project at sarah@ai.com."` into the composer. | The live preview card displays `2` or `3` PII entities detected (`[LOCATION_1]`, `[PERSON_1]`, `[EMAIL_1]`) in real-time before submission. |
| **TC-4: Zero-Trust Reflection Generation** | Select mood `"Grateful"` and click `"Generate Reflection"`. | The button enters an animated processing state. The empathetic reflection appears with key insights, and the Security Inspector HUD updates with exact telemetry. |
| **TC-5: Security Inspector Verification** | Click on `"1. Redacted Context Sent to Gemini (DLP)"` in the Security Inspector. | The code viewer shows the exact surrogate string (`"Had lunch in [LOCATION_1] with [PERSON_1]..."`) proving no raw PII reached the AI model. |
| **TC-6: Firestore Document Inspection** | Click on `"3. Stored Firestore Document"` tab and click `"Copy JSON"`. | Displays the exact structured document saved under `/users/demo-user-77/interactions/inter_*` with zero `undefined` values. |
| **TC-7: Resilient Model Fallback HUD** | Click on `"4. Privacy & Resilience Telemetry HUD"`. | Displays the active model (`gemini-3.6-flash`), roundtrip latency in ms, PII entity count, and Secret Manager warm cache status. |
| **TC-8: Journal History Search & Filtering** | Click `"Grateful"` mood filter chip or type `"Seattle"` in the search bar. | The history sidebar dynamically filters entries matching the query or mood. |
