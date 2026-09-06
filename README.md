# Personal Gemini Journal

> **Enterprise Zero-Trust AI Journal & Reflection Space**  
> Fortified by a server-side **Zero-Trust Privacy Gateway (Cloud DLP)**, runtime **Google Cloud Secret Manager** key injection with in-memory caching, multi-tier **Gemini Model Fallback Ladder**, and tenant-isolated **Cloud Firestore** native persistence. Deployed to **Google Cloud Run** with automated CI/CD.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloud_Run-4285F4?style=flat&logo=googlecloud)](https://personal-gemini-journal-454901294317.us-central1.run.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75FF?style=flat&logo=google)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

---

## Overview

**Personal Gemini Journal** is a modern mindfulness and reflective journaling web application engineered with an enterprise **Zero-Trust** security architecture. 

While conventional AI journaling tools transmit unencrypted personal thoughts directly to LLM providers, Personal Gemini Journal sanitizes all user entries through an automated **Privacy Gateway (Cloud DLP)** prior to model inference, retrieves API credentials dynamically via **Google Cloud Secret Manager**, and cryptographically sandboxes user reflections inside tenant-isolated **Cloud Firestore** subcollections.

---

## Key Architecture & Features

### 1. Zero-Trust Privacy Gateway (Cloud DLP)
- **Automatic PII De-identification**: Analyzes input text to identify personally identifiable information (PII) including names, emails, phone numbers, and locations.
- **Surrogate Tokenization**: Converts sensitive strings into format-preserving surrogate tokens (e.g., `Sarah Connor` &rarr; `[PERSON_1]`, `Seattle` &rarr; `[LOCATION_1]`) *before* invoking Gemini.
- **Server-Side Detokenization**: Restores the original entities only in the final response returned to the authenticated user. Raw PII never leaves the secure server boundary.

### 2. Multi-Turn Gemini Reflections
- **Empathetic Psychological Reframing**: Provides grounded cognitive clarity, emotional tone analysis, and mindful inquiries.
- **Multi-Turn Conversational Memory**: Supports iterative dialogue allowing users to ask follow-up questions while maintaining thread context.
- **Resilient Fallback Engine**: Implements an autonomous cascading ladder (`gemini-2.5-flash` &rarr; `gemini-2.0-flash` &rarr; `gemini-1.5-flash`) with local resilience against network spikes or rate limits.

### 3. Tenant-Isolated Firestore Storage
- **Cryptographic User Sandboxing**: All user reflections, mood tags, and conversation threads are stored strictly at `/users/{userId}/interactions/{interactionId}`.
- **Zero Cross-Tenant Leakage**: Enforced by comprehensive Firestore Security Rules that validate incoming user ownership (`request.auth.uid == userId`) and prohibit cross-user access.

### 4. Enterprise Secret Management
- **Zero Client Bundle Leaks**: API credentials (`GEMINI_API_KEY`) are fetched at container startup directly from **Google Cloud Secret Manager**.
- **In-Memory Caching**: Minimizes Secret Manager API latency by maintaining warm in-memory caches across Cloud Run instance lifecycles.

### 5. Location-Aware Privacy Journaling
- **Interactive Material 3 Map**: Geospatially pins user entries on an interactive map colored by emotional tone (Joy, Gratitude, Resilience, Reflection).
- **Zero Geospatial Tracking**: The Privacy Gateway tokenizes locations so Gemini understands geographical context without tracking real-world coordinates.

---

## System Architecture

```
[ User Browser ]
       │
       │ HTTPS / Authorization: Bearer <Firebase_JWT>
       ▼
[ Google Cloud Run Container (Next.js 15 Standalone) ]
       │
       ├─► 1. Identity Verification (firebase-admin.auth().verifyIdToken())
       │
       ├─► 2. Zero-Trust Privacy Gateway (DLP De-identification)
       │       • Replaces Sarah Connor -> [PERSON_1]
       │       • Replaces Seattle      -> [LOCATION_1]
       │
       ├─► 3. Secret Manager (Runtime fetch & cache GEMINI_API_KEY)
       │
       ├─► 4. Resilient Gemini Engine (Multi-turn ladder: 2.5-flash -> 2.0-flash -> 1.5-flash)
       │       • Sends ONLY sanitized prompt with surrogate tokens
       │
       ├─► 5. Server-Side Detokenization (Restores entities for authenticated user)
       │
       ├─► 6. Tenant-Isolated Firestore Persistence (/users/{uid}/interactions/{id})
       │
       ▼
[ Client Security Inspector HUD ] (Live transparency: DLP tokens, latency & model telemetry)
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **npm** or **bun**
- A **Google Cloud Project** with Cloud Run, Firestore, and Secret Manager enabled
- A **Firebase Project** with Authentication (Google Sign-In) enabled

### 1. Clone the Repository
```bash
git clone https://github.com/saddampinjari/personal-gemini-journal.git
cd personal-gemini-journal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id

# Gemini API (Local Dev fallback; production uses GCP Secret Manager)
GEMINI_API_KEY=your-gemini-api-key

# Firebase Web App Config (From Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Google Cloud Run

### Option 1: Automated CI/CD via Google Cloud Build (Recommended)
This repository contains a production-ready `cloudbuild.yaml` configured for Google Cloud Build:
1. Connect your repository to **Cloud Build Triggers** in the Google Cloud Console.
2. Every `git push origin main` triggers a multi-stage Docker build, pushes to Google Artifact Registry, and deploys to Cloud Run with zero downtime.

### Option 2: Manual CLI Deployment
```bash
# Build and deploy using Google Cloud SDK
gcloud run deploy personal-gemini-journal \
    --source="." \
    --region="us-central1" \
    --platform="managed" \
    --allow-unauthenticated \
    --port=8080 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=your-project-id" \
    --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

---

## Cloud Firestore Security Rules

Deploy the included `firestore.rules` to enforce strict zero-trust data access:

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

    // Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    // User root profile document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // User interactions subcollection (Strict Isolation)
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15, React 19, TailwindCSS | App Router, Server Components, Material 3 UI |
| **Animation** | Motion (`motion/react`) | Fluid transitions, ambient background glow, micro-interactions |
| **Authentication** | Firebase Authentication | Google OAuth popup, Email/Password verification |
| **Database** | Google Cloud Firestore | Tenant-partitioned NoSQL document storage |
| **AI Inference** | Google Gemini API | Empathetic reflection & psychological reframing |
| **Privacy / DLP** | Custom Cloud DLP Engine | PII entity detection, masking, and detokenization |
| **Secrets** | Google Cloud Secret Manager | Dynamic runtime credential resolution |
| **Container / Hosting** | Docker, Google Cloud Run | Serverless, auto-scaling production runtime |
| **CI/CD** | Google Cloud Build, GitHub Actions | Automated build, test, and deployment pipeline |

---

## License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.
