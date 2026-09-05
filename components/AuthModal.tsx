'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import {
  UserProfile,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  isFirebaseConfigured,
} from '@/lib/firebase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile, token: string) => void;
  isLoading: boolean;
}

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: M3_DECELERATE },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export function AuthModal({ isOpen, onClose, onSelectUser, isLoading: parentLoading }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'email' | 'config'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick config state
  const [cfgApiKey, setCfgApiKey] = useState('');
  const [cfgProjectId, setCfgProjectId] = useState('');
  const [cfgAuthDomain, setCfgAuthDomain] = useState('');
  const [cfgAppId, setCfgAppId] = useState('');
  const [cfgSaved, setCfgSaved] = useState(false);

  const configured = isFirebaseConfigured();

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        onSelectUser(result.user, result.token);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setError(msg);
      if (msg.includes('Missing') || msg.includes('not connected') || !configured) {
        setActiveTab('config');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (result.user) {
        onSelectUser(result.user, result.token);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
      if (msg.includes('Missing') || msg.includes('not connected') || !configured) {
        setActiveTab('config');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgApiKey || !cfgProjectId) {
      setError('Please provide at least the Firebase API Key and Project ID.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cfgApiKey,
          projectId: cfgProjectId,
          authDomain: cfgAuthDomain || `${cfgProjectId}.firebaseapp.com`,
          appId: cfgAppId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration.');
      }

      setCfgSaved(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save config';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A12]/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="auth-modal-card"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            id="auth-modal-card"
            className="w-full max-w-md bg-white/95 dark:bg-[#0E1528]/95 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-blue-900/50 shadow-2xl p-6 sm:p-7 relative overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 m3-btn-icon text-slate-500 dark:text-slate-400"
              aria-label="Close modal"
            >
              <MaterialIcon name="close" size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#14204F] text-white shadow-xs">
                <MaterialIcon name="security" size={22} className="text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C1B1F] dark:text-[#E6E1E5]">
                  Firebase Authentication
                </h3>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Official Google Firebase Auth Provider
                </p>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="mb-4">
              {configured ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Firebase Connected &bull; Real OAuth Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                  <MaterialIcon name="warning" size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>Firebase Credentials Pending in .env.local</span>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 rounded-full bg-slate-100 dark:bg-[#070A12] mb-5 border border-slate-200 dark:border-blue-900/40">
              <button
                onClick={() => { setActiveTab('google'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  activeTab === 'google'
                    ? 'bg-white dark:bg-[#14204F] text-[#14204F] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Google Popup
              </button>
              <button
                onClick={() => { setActiveTab('email'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  activeTab === 'email'
                    ? 'bg-white dark:bg-[#14204F] text-[#14204F] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Email / Password
              </button>
              <button
                onClick={() => { setActiveTab('config'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-[#14204F] text-[#14204F] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Connect Keys
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs leading-relaxed">
                <div className="flex items-start gap-2">
                  <MaterialIcon name="error" size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* TAB 1: GOOGLE SIGN-IN */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                  Signs in using Google Identity through Firebase Authentication. Opens the official Google OAuth consent popup window.
                </p>

                <button
                  id="modal-google-signin-btn"
                  onClick={handleGoogleAuth}
                  disabled={loading || parentLoading}
                  className="m3-btn m3-btn-filled w-full h-12 text-sm font-medium flex items-center justify-center gap-3 shadow-md"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{loading ? 'Opening Google Popup...' : 'Sign In with Google'}</span>
                </button>

                {!configured && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-[#14204F]/40 border border-blue-200 dark:border-blue-900/40 text-xs text-[#14204F] dark:text-blue-200">
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <MaterialIcon name="info" size={14} className="text-[#2563EB] dark:text-blue-300" />
                      <span>Firebase Keys Needed for Live Popup</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      To enable the official Google popup in your browser, switch to the <strong>Connect Keys</strong> tab and enter your Firebase credentials.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EMAIL / PASSWORD */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0] mb-1 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0] mb-1 block">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="m3-btn m3-btn-filled flex-1 h-10 text-xs font-semibold"
                  >
                    {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="m3-btn m3-btn-outlined text-xs h-10 px-3"
                  >
                    {isSignUp ? 'Switch to Sign In' : 'Sign Up'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: CONNECT KEYS */}
            {activeTab === 'config' && (
              <form onSubmit={handleSaveConfig} className="space-y-3">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-[#14204F]/40 border border-blue-200 dark:border-blue-800 text-[11px] text-[#14204F] dark:text-blue-200">
                  <span>Get these from <strong>Firebase Console &gt; Project Settings &gt; Your Apps &gt; Web app</strong>:</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#49454F] dark:text-[#CAC4D0] block">
                    Firebase API Key (AIzaSy...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={cfgApiKey}
                    onChange={(e) => setCfgApiKey(e.target.value)}
                    placeholder="AIzaSyB..."
                    className="w-full px-3.5 py-2 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#49454F] dark:text-[#CAC4D0] block">
                    Firebase Project ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={cfgProjectId}
                    onChange={(e) => setCfgProjectId(e.target.value)}
                    placeholder="personal-gemini-journal-123"
                    className="w-full px-3.5 py-2 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#49454F] dark:text-[#CAC4D0] block">
                    App ID (optional)
                  </label>
                  <input
                    type="text"
                    value={cfgAppId}
                    onChange={(e) => setCfgAppId(e.target.value)}
                    placeholder="1:1234567890:web:abcdef..."
                    className="w-full px-3.5 py-2 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || cfgSaved}
                  className="m3-btn m3-btn-filled w-full h-10 text-xs font-semibold mt-2"
                >
                  {cfgSaved ? 'Saved! Reloading...' : loading ? 'Saving...' : 'Save & Connect to Firebase'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
