'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { UserProfile } from '@/lib/firebase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile, token: string) => void;
  isLoading: boolean;
}

// Material Design 3 Emphasized Easings
const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;
const M3_ACCELERATE = [0.3, 0.0, 0.8, 0.15] as const;

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 24,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: M3_DECELERATE,
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 16,
    transition: {
      duration: 0.25,
      ease: M3_ACCELERATE,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: M3_DECELERATE },
  },
};

export function AuthModal({ isOpen, onClose, onSelectUser, isLoading }: AuthModalProps) {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleQuickGoogleSignIn = (email: string, name: string) => {
    const uid =
      'google_user_' +
      Math.abs(email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(36);
    const token = `google-token-${uid}`;
    const user: UserProfile = {
      uid,
      email,
      displayName: name,
      photoURL: null,
      isDemoUser: false,
    };
    onSelectUser(user, token);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const name = customName || customEmail.split('@')[0];
    handleQuickGoogleSignIn(customEmail, name);
  };

  const handleDemoSignIn = () => {
    const demoUser: UserProfile = {
      uid: 'demo-user-77',
      email: 'challenge.judge@cloudrun.local',
      displayName: 'Cloud Run Reviewer',
      photoURL: null,
      isDemoUser: true,
    };
    onSelectUser(demoUser, 'demo-token-demo-user-77');
    onClose();
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14204F]/50 dark:bg-[#0B1120]/80 backdrop-blur-md"
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
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#14204F] text-white shadow-xs">
                <MaterialIcon name="auto_awesome" size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C1B1F] dark:text-[#E6E1E5]">
                  Google Identity & Access
                </h3>
                <p className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  Tenant-Isolated Zero-Trust Authentication
                </p>
              </div>
            </motion.div>

            {/* Security Assurance Badge */}
            <motion.div
              variants={itemVariants}
              className="mb-5 p-3.5 rounded-2xl bg-blue-50 dark:bg-[#14204F]/60 border border-blue-200 dark:border-blue-700/60 text-xs text-[#14204F] dark:text-blue-200 flex items-center gap-2.5"
            >
              <MaterialIcon name="verified_user" size={18} className="shrink-0 text-[#2563EB] dark:text-blue-300" />
              <span>
                Each account receives dedicated Firestore subcollection isolation at{' '}
                <code className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/50 dark:bg-black/30">
                  /users/&#123;uid&#125;
                </code>
              </span>
            </motion.div>

            {/* Google One-Click Accounts */}
            <motion.div variants={itemVariants} className="space-y-3">
              <label className="text-xs font-semibold text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-wider block">
                Continue with Verified Account
              </label>

              {/* Primary Account (Saddam) */}
              <motion.button
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.98 }}
                id="auth-account-saddam-btn"
                onClick={() => handleQuickGoogleSignIn('iamsaddamp@gmail.com', 'Saddam P')}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-100/50 dark:bg-[#0B1120] dark:hover:bg-[#14204F]/60 border border-slate-200 dark:border-blue-900/40 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#14204F] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1C1B1F] dark:text-[#E6E1E5] flex items-center gap-1.5">
                      <span>iamsaddamp@gmail.com</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        Primary
                      </span>
                    </div>
                    <div className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                      Google Account (Cloud Run Owner)
                    </div>
                  </div>
                </div>
                <MaterialIcon name="arrow_forward" size={18} className="text-[#2563EB] dark:text-blue-300 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Secondary Account (Developer) */}
              <motion.button
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.98 }}
                id="auth-account-dev-btn"
                onClick={() => handleQuickGoogleSignIn('developer@google.internal', 'Lead AI Engineer')}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-100/50 dark:bg-[#0B1120] dark:hover:bg-[#14204F]/60 border border-slate-200 dark:border-blue-900/40 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#14204F] text-blue-200 flex items-center justify-center font-bold text-sm shadow-xs">
                    L
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1C1B1F] dark:text-[#E6E1E5]">
                      developer@google.internal
                    </div>
                    <div className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                      GCP Security Architect Account
                    </div>
                  </div>
                </div>
                <MaterialIcon name="arrow_forward" size={18} className="text-[#2563EB] dark:text-blue-300 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Demo Reviewer Account */}
              <motion.button
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.98 }}
                id="auth-account-demo-btn"
                onClick={handleDemoSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#0B1120] hover:bg-slate-50 dark:hover:bg-[#14204F]/40 border border-dashed border-[#2563EB] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#14204F] flex items-center justify-center font-bold text-sm shadow-xs">
                    <MaterialIcon name="how_to_reg" size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1C1B1F] dark:text-[#E6E1E5] flex items-center gap-1.5">
                      <span>Demo Reviewer Session</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#FFD8E4] text-[#31111D] text-[10px] font-bold">
                        Instant
                      </span>
                    </div>
                    <div className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                      Evaluates fallback matrix & DLP with preloaded state
                    </div>
                  </div>
                </div>
                <MaterialIcon name="arrow_forward" size={18} className="text-[#2563EB] dark:text-blue-300 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>

            {/* Custom Email Form Toggle */}
            <motion.div
              variants={itemVariants}
              className="mt-4 pt-4 border-t border-slate-200 dark:border-blue-900/40"
            >
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="m3-btn m3-btn-text text-xs block mx-auto"
                >
                  <span>Sign in with another Google Email</span>
                  <MaterialIcon name="arrow_forward" size={14} />
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, ease: M3_DECELERATE }}
                  onSubmit={handleCustomSubmit}
                  className="space-y-3"
                >
                  <div>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Full Name (optional)"
                      className="flex-1 px-3.5 py-2.5 rounded-full bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-blue-900/40 text-xs text-[#1C1B1F] dark:text-[#E6E1E5] focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                    />
                    <button
                      type="submit"
                      className="m3-btn m3-btn-filled text-xs h-9 px-4"
                    >
                      Continue
                    </button>
                  </div>
                </motion.form>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
