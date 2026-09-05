'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';

// Default configuration with environment fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'personal-gemini-journal.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'personal-gemini-journal',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'personal-gemini-journal.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // SSR placeholder
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemoUser?: boolean;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key'
  );
}

/**
 * Genuine Firebase Google Sign-In using OAuth popup
 */
export async function signInWithGoogle(): Promise<{ user: UserProfile; token: string }> {
  if (!auth) {
    throw new Error('Firebase Auth has not been initialized in the browser.');
  }

  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase Project is not connected yet. Please add your NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID into .env.local to open the live Google OAuth popup.'
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const userProfile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      isDemoUser: false,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('pgj_auth_user', JSON.stringify({ user: userProfile, token }));
    }
    return { user: userProfile, token };
  } catch (error: unknown) {
    const fbErr = error as { code?: string; message?: string };
    if (fbErr.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled: The Google popup was closed before completing authentication.');
    }
    if (fbErr.code === 'auth/popup-blocked') {
      throw new Error('Popup blocked: Please allow popups for localhost:3000 in your browser to sign in with Google.');
    }
    if (fbErr.code === 'auth/unauthorized-domain') {
      throw new Error('Unauthorized Domain: Please add "localhost" to your Firebase Console > Authentication > Settings > Authorized Domains.');
    }
    throw new Error(fbErr.message || 'Firebase Authentication failed.');
  }
}

/**
 * Genuine Firebase Email/Password Sign-In
 */
export async function signInWithEmail(email: string, pass: string): Promise<{ user: UserProfile; token: string }> {
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Project is not connected yet. Please add your Firebase credentials to .env.local.');
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const token = await result.user.getIdToken();
  const userProfile: UserProfile = {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName || email.split('@')[0],
    photoURL: result.user.photoURL,
    isDemoUser: false,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('pgj_auth_user', JSON.stringify({ user: userProfile, token }));
  }
  return { user: userProfile, token };
}

/**
 * Genuine Firebase Email/Password Sign-Up
 */
export async function signUpWithEmail(email: string, pass: string): Promise<{ user: UserProfile; token: string }> {
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Project is not connected yet. Please add your Firebase credentials to .env.local.');
  }
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  try {
    await sendEmailVerification(result.user);
  } catch (err) {
    console.warn('Could not send verification email:', err);
  }
  const token = await result.user.getIdToken();
  const userProfile: UserProfile = {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName || email.split('@')[0],
    photoURL: result.user.photoURL,
    isDemoUser: false,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('pgj_auth_user', JSON.stringify({ user: userProfile, token }));
  }
  return { user: userProfile, token };
}

export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pgj_auth_user');
    localStorage.removeItem('pgj_demo_session');
  }
  if (auth && typeof auth.signOut === 'function') {
    try {
      await fbSignOut(auth);
    } catch {
      // Clean sign out completed
    }
  }
}

/**
 * Automatically creates/updates the user root document at /users/{uid} on login
 */
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  if (!db || !user?.uid) return;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('syncUserProfileToFirestore note:', err);
  }
}

/**
 * Directly writes interaction to Firestore from the authenticated client
 * Enforces zero cross-user leakage matching firestore.rules
 */
export async function saveInteractionToFirestore(
  userId: string,
  interactionId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!db || !userId || !interactionId) return;
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Direct client-side Firestore save note:', err);
  }
}

/**
 * Fetches interactions directly from Firestore subcollection
 */
export async function fetchUserInteractionsFromFirestore(
  userId: string
): Promise<Record<string, unknown>[]> {
  if (!db || !userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), interactionId: d.id }));
  } catch (err) {
    console.warn('Direct client-side Firestore fetch note:', err);
    return [];
  }
}
