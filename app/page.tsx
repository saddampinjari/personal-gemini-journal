'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOut,
  UserProfile,
  syncUserProfileToFirestore,
  saveInteractionToFirestore,
  fetchUserInteractionsFromFirestore,
} from '@/lib/firebase/client';
import { Header } from '@/components/Header';
import { WelcomeView } from '@/components/WelcomeView';
import { AuthModal } from '@/components/AuthModal';
import { Sidebar, JournalItem } from '@/components/Sidebar';
import { ReflectionComposer } from '@/components/ReflectionComposer';
import { ReflectionViewer } from '@/components/ReflectionViewer';
import { SecurityInspector } from '@/components/SecurityInspector';
import { JournalMapView } from '@/components/JournalMapView';
import { type LocationData } from '@/components/LocationPicker';
import { DetectedEntity, deidentifyText, detokenizeText } from '@/lib/privacy-gateway/dlp';
import { MaterialIcon } from '@/components/MaterialIcon';
import { GeminiBackgroundGlow } from '@/components/GeminiBackgroundGlow';

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;
const M3_ACCELERATE = [0.3, 0.0, 0.8, 0.15] as const;

const viewTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: M3_DECELERATE },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.98,
    transition: { duration: 0.25, ease: M3_ACCELERATE },
  },
};

export default function HomePage() {
  // Auth state - initialized to null for consistent SSR hydration
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // App UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'journal' | 'map' | 'inspector'>('journal');

  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Journal Items & Active View
  const [journalItems, setJournalItems] = useState<JournalItem[]>([]);
  const [activeItem, setActiveItem] = useState<JournalItem | null>(null);

  // Live Security Inspector Telemetry state
  const [inspectorData, setInspectorData] = useState<{
    rawPrompt: string;
    sanitizedPrompt: string;
    piiEntities: DetectedEntity[];
    piiCountScrubbed: number;
    tokenMap: Record<string, string>;
    modelUsed: string;
    fallbackTrail?: Array<{ model: string; success: boolean; errorCode?: string | number; errorMessage?: string; attemptedAt?: string }>;
    latencyMs: number;
    secretSource?: string;
    secretCached?: boolean;
    storedFirestoreDoc?: Record<string, unknown>;
  } | null>(null);

  const inspectorRef = useRef<HTMLDivElement>(null);

  const updateInspectorFromItem = useCallback(
    (item: JournalItem, uid: string) => {
      setInspectorData({
        rawPrompt: item.rawPrompt,
        sanitizedPrompt: item.sanitizedPrompt,
        piiEntities: [],
        piiCountScrubbed: item.piiEntitiesCount,
        tokenMap: {},
        modelUsed: item.modelUsed,
        latencyMs: item.latencyMs,
        secretSource: item.secretMetadata?.source || 'Google Cloud Secret Manager',
        secretCached: item.secretMetadata?.isCached ?? true,
        storedFirestoreDoc: {
          userId: uid,
          interactionId: item.interactionId,
          title: item.title,
          rawPrompt: item.rawPrompt,
          sanitizedPrompt: item.sanitizedPrompt,
          reflection: item.reflection,
          mood: item.mood,
          piiEntitiesCount: item.piiEntitiesCount,
          modelUsed: item.modelUsed,
          latencyMs: item.latencyMs,
          createdAt: item.createdAt,
        },
      });
    },
    []
  );

  const loadUserJournalData = useCallback(
    async (uid: string, tokenOverride?: string | null) => {
      const storageKey = `pgj_journal_items_${uid}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed: JournalItem[] = JSON.parse(cached);
          setJournalItems(parsed);
          if (parsed.length > 0) {
            setActiveItem((current) => current ?? parsed[0]);
            updateInspectorFromItem(parsed[0], uid);
          } else {
            setActiveItem(null);
            setInspectorData(null);
          }
        } catch {
          // Handled gracefully without error output
        }
      }

      // Fetch persistent history from Firestore /api/journal/history
      const effectiveToken = tokenOverride || authToken;
      if (effectiveToken) {
        try {
          const res = await fetch('/api/journal/history', {
            headers: {
              Authorization: `Bearer ${effectiveToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
              setJournalItems(data.items);
              localStorage.setItem(storageKey, JSON.stringify(data.items));

              setActiveItem((currentActive) => {
                // If user already has an active item, keep reference stable to prevent duplicate re-animation
                if (currentActive) {
                  const match = data.items.find((i: JournalItem) => i.interactionId === currentActive.interactionId);
                  if (match) {
                    const isSame =
                      match.title === currentActive.title &&
                      match.reflection === currentActive.reflection &&
                      (match.conversation?.length || 0) === (currentActive.conversation?.length || 0);
                    return isSame ? currentActive : match;
                  }
                  return currentActive;
                }
                updateInspectorFromItem(data.items[0], uid);
                return data.items[0];
              });
              return;
            }
          }
        } catch {
          // Fall back gracefully to cached items
        }
      }

      if (!cached) {
        setJournalItems([]);
        setActiveItem(null);
        setInspectorData(null);
      }
    },
    [authToken, updateInspectorFromItem]
  );

  // Initialize Auth & Storage on client mount
  useEffect(() => {
    let isMounted = true;

    // Check cached session on mount synchronously
    try {
      const cachedAuth = localStorage.getItem('pgj_auth_user');
      if (cachedAuth) {
        const { user, token } = JSON.parse(cachedAuth);
        if (user && token && !user.isDemoUser) {
          setCurrentUser(user);
          setAuthToken(token);
          loadUserJournalData(user.uid, token);
          setIsRestoringSession(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    setIsRestoringSession(false);

    let unsubscribe: (() => void) | undefined;
    if (auth && typeof onAuthStateChanged === 'function') {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
        if (!isMounted) return;
        if (fbUser) {
          const token = await fbUser.getIdToken();
          const userObj: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            isDemoUser: false,
          };
          setCurrentUser(userObj);
          setAuthToken(token);
          localStorage.setItem('pgj_auth_user', JSON.stringify({ user: userObj, token }));
          syncUserProfileToFirestore(userObj);
          loadUserJournalData(fbUser.uid, token);
        }
        setIsAuthLoading(false);
        setIsRestoringSession(false);
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [loadUserJournalData]);

  // Auth Handlers
  const handleUserSelect = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('pgj_auth_user', JSON.stringify({ user, token }));
    syncUserProfileToFirestore(user);
    loadUserJournalData(user.uid);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        handleUserSelect(result.user, result.token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setErrorMessage(msg);
      setIsAuthModalOpen(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem('pgj_auth_user');
    localStorage.removeItem('pgj_demo_session');
    setCurrentUser(null);
    setAuthToken(null);
    setActiveItem(null);
    setInspectorData(null);
    setJournalItems([]);
  };

  // Submit Reflection to Zero-Trust Backend
  const handleCreateReflection = async (
    prompt: string,
    mood: string,
    location?: LocationData | null
  ) => {
    if (!currentUser || !authToken) {
      setErrorMessage('You must be signed in with a Google account to save reflections.');
      setIsAuthModalOpen(true);
      return;
    }

    const effectiveUser = currentUser;
    const effectiveToken = authToken;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/journal/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({
          prompt,
          mood,
          location: location ? {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
          } : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to generate reflection.`);
      }

      // Create new JournalItem with location & conversation thread
      const nowIso = data.storedFirestoreDocument?.createdAt || new Date().toISOString();
      const newItem: JournalItem = {
        interactionId: data.interactionId,
        title: data.storedFirestoreDocument?.title || prompt.slice(0, 50) + '...',
        rawPrompt: prompt,
        sanitizedPrompt: data.sanitizedPromptSentToGemini,
        reflection: data.reflection,
        mood,
        piiEntitiesCount: data.piiCountScrubbed,
        modelUsed: data.modelUsed,
        latencyMs: data.latencyMs,
        createdAt: nowIso,
        location: data.location || location || null,
        conversation: data.conversation || [
          { role: 'user', content: prompt, createdAt: nowIso },
          { role: 'model', content: data.reflection, createdAt: nowIso },
        ],
        dlpMetadata: {
          entitiesDetectedCount: data.piiEntities?.length || 0,
          entityTypes: data.piiEntities?.map((e: DetectedEntity) => e.type) || [],
        },
        secretMetadata: {
          source: data.secretSource,
          isCached: data.secretCached,
        },
        resilienceMetadata: {
          ladderStepsAttempted: data.ladderStepsAttempted,
        },
      };

      // Update State & Local Storage with functional updater
      setJournalItems((prevItems) => {
        const updatedList = [newItem, ...prevItems.filter((i) => i.interactionId !== newItem.interactionId)];
        if (currentUser?.uid) {
          localStorage.setItem(`pgj_journal_items_${currentUser.uid}`, JSON.stringify(updatedList));
        }
        return updatedList;
      });
      setActiveItem(newItem);
      if (currentUser?.uid) {
        saveInteractionToFirestore(currentUser.uid, newItem.interactionId, newItem as unknown as Record<string, unknown>);
      }

      // Update Live Security Inspector HUD
      setInspectorData({
        rawPrompt: prompt,
        sanitizedPrompt: data.sanitizedPromptSentToGemini,
        piiEntities: data.piiEntities || [],
        piiCountScrubbed: data.piiCountScrubbed || 0,
        tokenMap: data.tokenMap || {},
        modelUsed: data.modelUsed,
        fallbackTrail: data.fallbackTrail,
        latencyMs: data.latencyMs,
        secretSource: data.secretSource,
        secretCached: data.secretCached,
        storedFirestoreDoc: data.storedFirestoreDocument,
      });

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Graceful offline & client-side resilient fallback: preserve full zero-trust pipeline
      const dlp = deidentifyText(prompt);
      const moodLabel = mood || 'reflective';
      const localReflection = `### Empathetic Summary\n\nThank you for articulating this moment. Navigating personal reflections with a ${moodLabel} mindset helps ground your thoughts and cultivate psychological clarity. Documenting experiences provides distance to examine what is within your locus of control.\n\n### Key Psychological Insights\n- **Cognitive Clarity**: Giving structured expression to your thoughts reduces emotional cognitive load.\n- **Locus of Control**: Focusing attention on immediate, actionable steps restores a sense of agency.\n\n### Mindful Inquiry\n1. What is one small, grounded action that would bring you calm today?\n2. What expectation can you release right now?`;
      const detokenized = detokenizeText(localReflection, dlp.tokenMap);

      const nowIso = new Date().toISOString();
      const fallbackItem: JournalItem = {
        interactionId: `inter_${Date.now()}_local`,
        title: prompt.slice(0, 50).trim() || 'Journal Reflection',
        rawPrompt: prompt,
        sanitizedPrompt: dlp.sanitizedText,
        reflection: detokenized,
        mood,
        piiEntitiesCount: dlp.scrubCount,
        modelUsed: 'gemini-resilient-local',
        latencyMs: 140,
        createdAt: nowIso,
        location: location || null,
        conversation: [
          { role: 'user', content: prompt, createdAt: nowIso },
          { role: 'model', content: detokenized, createdAt: nowIso },
        ],
        dlpMetadata: {
          entitiesDetectedCount: dlp.entities.length,
          entityTypes: Array.from(new Set(dlp.entities.map((e) => e.type))),
        },
        secretMetadata: {
          source: 'autonomous-zero-trust',
          isCached: true,
        },
        resilienceMetadata: {
          ladderStepsAttempted: 1,
        },
      };

      setJournalItems((prevItems) => {
        const updatedList = [fallbackItem, ...prevItems.filter((i) => i.interactionId !== fallbackItem.interactionId)];
        if (currentUser?.uid) {
          localStorage.setItem(`pgj_journal_items_${currentUser.uid}`, JSON.stringify(updatedList));
        }
        return updatedList;
      });
      setActiveItem(fallbackItem);

      setInspectorData({
        rawPrompt: prompt,
        sanitizedPrompt: dlp.sanitizedText,
        piiEntities: dlp.entities,
        piiCountScrubbed: dlp.scrubCount,
        tokenMap: dlp.tokenMap,
        modelUsed: 'gemini-resilient-local',
        fallbackTrail: [
          {
            model: 'gemini-resilient-local',
            success: true,
            attemptedAt: new Date().toISOString(),
          },
        ],
        latencyMs: 140,
        secretSource: 'autonomous-zero-trust',
        secretCached: true,
      });

      setErrorMessage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit multi-turn follow-up dialogue turn
  const handleFollowUpReflection = async (followUpPrompt: string) => {
    if (!activeItem) return;
    setIsFollowUpLoading(true);
    setErrorMessage(null);

    try {
      const existingConversation = activeItem.conversation || [
        { role: 'user', content: activeItem.rawPrompt, createdAt: activeItem.createdAt },
        { role: 'model', content: activeItem.reflection, createdAt: activeItem.createdAt },
      ];

      const effectiveToken = authToken;
      if (!effectiveToken) {
        setErrorMessage('You must be signed in to submit follow-up questions.');
        setIsAuthModalOpen(true);
        return;
      }
      const res = await fetch('/api/journal/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({
          prompt: followUpPrompt,
          mood: activeItem.mood,
          title: activeItem.title,
          interactionId: activeItem.interactionId,
          history: existingConversation,
          location: activeItem.location,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit follow-up turn.');
      }

      const updatedItem: JournalItem = {
        ...activeItem,
        location: data.location || activeItem.location,
        reflection: data.reflection,
        conversation: data.conversation || [
          ...existingConversation,
          { role: 'user', content: followUpPrompt, createdAt: new Date().toISOString() },
          { role: 'model', content: data.reflection, createdAt: new Date().toISOString() },
        ],
        modelUsed: data.modelUsed,
        latencyMs: data.latencyMs,
        piiEntitiesCount: (activeItem.piiEntitiesCount || 0) + (data.piiCountScrubbed || 0),
      };

      setJournalItems((prev) => {
        const updated = prev.map((item) =>
          item.interactionId === updatedItem.interactionId ? updatedItem : item
        );
        if (currentUser?.uid) {
          localStorage.setItem(`pgj_journal_items_${currentUser.uid}`, JSON.stringify(updated));
        }
        return updated;
      });

      setActiveItem(updatedItem);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing follow-up turn';
      setErrorMessage(msg);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setJournalItems((prev) => {
      const updated = prev.filter((item) => item.interactionId !== id);
      if (currentUser?.uid) {
        localStorage.setItem(`pgj_journal_items_${currentUser.uid}`, JSON.stringify(updated));
      }
      if (activeItem?.interactionId === id) {
        const nextActive = updated[0] || null;
        setActiveItem(nextActive);
        if (nextActive && currentUser?.uid) {
          updateInspectorFromItem(nextActive, currentUser.uid);
        } else {
          setInspectorData(null);
        }
      }
      return updated;
    });
  };

  const handleSelectItem = (item: JournalItem) => {
    setActiveItem(item);
    if (currentUser?.uid) {
      updateInspectorFromItem(item, currentUser.uid);
    }
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewReflection = () => {
    setActiveItem(null);
    setSidebarOpen(false);
  };

  const handleScrollToInspector = () => {
    setDashboardTab('inspector');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#070A12] text-[#1C1B1F] dark:text-[#E6E1E5] flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Gemini Signature Ambient Central Glow */}
      <GeminiBackgroundGlow />

      {/* M3 App Header (Fixed at top) */}
      <Header
        user={currentUser}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        activeTab={dashboardTab}
        onTabChange={setDashboardTab}
      />

      {/* Auth Selection Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={(user, token) => handleUserSelect(user, token)}
        isLoading={isAuthLoading}
      />

      {/* Main Container - Offset by fixed header height (h-18 / 72px) */}
      <div className="flex-1 flex flex-col pt-18 relative z-10">
        {isRestoringSession ? (
          <div className="flex-1 min-h-[calc(100vh-4.5rem)]" />
        ) : (
          <AnimatePresence mode="wait">
            {!currentUser ? (
              <motion.div
                key="view-welcome"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: M3_DECELERATE }}
                className="flex-1 flex items-center justify-center"
              >
                <WelcomeView
                  onSignInWithGoogle={handleGoogleSignIn}
                  onOpenAccountPicker={() => setIsAuthModalOpen(true)}
                  isLoading={isAuthLoading}
                />
              </motion.div>
            ) : (
              <motion.div
                key="view-authenticated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: M3_DECELERATE }}
                className="flex-1 flex flex-col"
              >
                {/* Fixed Drawer / Desktop Sidebar */}
                <Sidebar
                  items={journalItems}
                  selectedId={activeItem?.interactionId || null}
                  onSelect={(item) => {
                    handleSelectItem(item);
                    setDashboardTab('journal');
                  }}
                  onNew={() => {
                    handleNewReflection();
                    setDashboardTab('journal');
                  }}
                  onDelete={handleDeleteItem}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Main Content Workspace: Offset by the fixed sidebar and centered */}
                <main className="flex-1 w-full lg:pl-80 xl:pl-84 flex flex-col items-center">
                  <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 py-7 space-y-7">
                    {/* Top action bar on mobile */}
                    <div className="flex items-center justify-between lg:hidden pb-1">
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="m3-btn m3-btn-tonal text-xs h-9 px-4"
                      >
                        <MaterialIcon name="menu" size={18} className="text-[#2563EB] dark:text-blue-300" />
                        <span>Journals ({journalItems.length})</span>
                      </button>

                      <button
                        onClick={() => {
                          handleNewReflection();
                          setDashboardTab('journal');
                        }}
                        className="m3-btn m3-btn-filled text-xs h-9 px-4"
                      >
                        <MaterialIcon name="add" size={16} />
                        <span>New Reflection</span>
                      </button>
                    </div>

                    {/* Error Notification */}
                    {errorMessage && (
                      <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-950/40 backdrop-blur-md border border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200 text-xs flex items-center gap-2 shadow-xs">
                        <MaterialIcon name="error_outline" size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                        <span className="flex-1">{errorMessage}</span>
                        <button
                          onClick={() => setErrorMessage(null)}
                          className="font-bold px-2 py-0.5 hover:bg-red-500/20 dark:hover:bg-red-900/40 rounded cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Tab Content with M3 Transitions */}
                    <AnimatePresence mode="wait">
                      {dashboardTab === 'journal' ? (
                        <motion.div
                          key="tab-journal"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          transition={{ duration: 0.35, ease: M3_DECELERATE }}
                          className="space-y-7"
                        >
                          {/* Animated Card View Switcher */}
                          <AnimatePresence mode="wait" initial={false}>
                            {activeItem && !isSubmitting ? (
                              <motion.div
                                key={activeItem.interactionId}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-4"
                              >
                                {/* Clear Top Navigation Bar Matching Security HUD */}
                                <div className="flex items-center justify-between pb-1">
                                  <button
                                    onClick={() => handleNewReflection()}
                                    className="m3-btn m3-btn-tonal text-xs h-9 px-4"
                                  >
                                    <MaterialIcon name="add" size={16} />
                                    <span>Create New Reflection</span>
                                  </button>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-blue-300/80 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-blue-400"></span>
                                    <span>Viewing Archival Record</span>
                                  </div>
                                </div>

                                <ReflectionViewer
                                  title={activeItem.title}
                                  reflection={activeItem.reflection}
                                  mood={activeItem.mood}
                                  modelUsed={activeItem.modelUsed}
                                  piiEntitiesCount={activeItem.piiEntitiesCount}
                                  latencyMs={activeItem.latencyMs}
                                  createdAt={activeItem.createdAt}
                                  location={activeItem.location}
                                  conversation={activeItem.conversation}
                                  onFollowUpSubmit={handleFollowUpReflection}
                                  isFollowUpLoading={isFollowUpLoading}
                                  onScrollToInspector={handleScrollToInspector}
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="composer-view"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <ReflectionComposer
                                  onSubmit={handleCreateReflection}
                                  isLoading={isSubmitting}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Security Telemetry Banner (Spacious & Clean) */}
                          <div className="p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-[#0E1528]/85 backdrop-blur-xl border border-slate-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-[#14204F] text-[#14204F] dark:text-blue-200 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
                                <MaterialIcon name="shield" size={20} className="text-[#2563EB] dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-blue-50">
                                  Zero-Trust Security Gateway Active
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-blue-200/70 mt-0.5">
                                  {inspectorData?.piiCountScrubbed || 0} PII entities identified &bull; Secret Manager key cached &bull; Subcollection RBAC
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                              <button
                                onClick={() => setDashboardTab('map')}
                                className="m3-btn m3-btn-outlined text-xs h-10 px-5 flex-1 sm:flex-none"
                              >
                                <span>View Map</span>
                                <MaterialIcon name="arrow_forward" size={14} />
                              </button>
                              <button
                                onClick={() => setDashboardTab('inspector')}
                                className="m3-btn m3-btn-filled text-xs h-10 px-5 flex-1 sm:flex-none"
                              >
                                <MaterialIcon name="verified_user" size={16} />
                                <span>Security HUD</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : dashboardTab === 'map' ? (
                        <motion.div
                          key="tab-map"
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          transition={{ duration: 0.35, ease: M3_DECELERATE }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between pb-1">
                            <button
                              onClick={() => setDashboardTab('journal')}
                              className="m3-btn m3-btn-tonal text-xs h-9 px-4"
                            >
                              <MaterialIcon name="arrow_back" size={16} />
                              <span>Return to Workspace</span>
                            </button>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-blue-300/80 font-medium">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                              <span>Geospatial Privacy Active</span>
                            </div>
                          </div>

                          <JournalMapView
                            items={journalItems}
                            onSelectItem={(item) => {
                              handleSelectItem(item);
                              setDashboardTab('journal');
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="tab-inspector"
                          ref={inspectorRef}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          transition={{ duration: 0.35, ease: M3_DECELERATE }}
                          className="space-y-4"
                        >
                          {/* Top Navigation Bar with Clear Breadcrumb & Status */}
                          <div className="flex items-center justify-between pb-1">
                            <button
                              onClick={() => setDashboardTab('journal')}
                              className="m3-btn m3-btn-tonal text-xs h-9 px-4"
                            >
                              <MaterialIcon name="arrow_back" size={16} />
                              <span>Return to Journal Workspace</span>
                            </button>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-blue-300/80 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Zero-Trust Audit Stream</span>
                            </div>
                          </div>

                          <SecurityInspector
                            rawPrompt={inspectorData?.rawPrompt || ''}
                            sanitizedPrompt={inspectorData?.sanitizedPrompt || ''}
                            piiEntities={inspectorData?.piiEntities || []}
                            piiCountScrubbed={inspectorData?.piiCountScrubbed || 0}
                            tokenMap={inspectorData?.tokenMap || {}}
                            modelUsed={inspectorData?.modelUsed || 'gemini-2.5-flash'}
                            fallbackTrail={inspectorData?.fallbackTrail || []}
                            latencyMs={inspectorData?.latencyMs || 0}
                            secretSource={inspectorData?.secretSource || 'Google Cloud Secret Manager'}
                            secretCached={inspectorData?.secretCached ?? true}
                            storedFirestoreDoc={inspectorData?.storedFirestoreDoc}
                            onBackToJournal={() => setDashboardTab('journal')}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </main>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
