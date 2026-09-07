'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';

interface WelcomeViewProps {
  onSignInWithGoogle: () => Promise<void>;
  onOpenAccountPicker?: () => void;
  isLoading: boolean;
}

// Material Design 3 Fluid Animation Specs
const M3_EMPHASIZED = [0.16, 1, 0.3, 1] as const;

const pageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: M3_EMPHASIZED,
    },
  },
};

const cardsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: M3_EMPHASIZED,
    },
  },
};

export function WelcomeView({
  onSignInWithGoogle,
  onOpenAccountPicker,
  isLoading,
}: WelcomeViewProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setError(null);
    try {
      await onSignInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in popup unavailable. Please choose your Google account.';
      setError(msg);
      if (onOpenAccountPicker) {
        onOpenAccountPicker();
      }
    }
  };

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 w-full max-w-7xl mx-auto"
    >
      {/* Hero Eyebrow Pill */}
      <motion.div
        variants={heroItemVariants}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-[#14204F]/80 text-[#14204F] dark:text-blue-200 border border-blue-200/90 dark:border-blue-700/60 mb-6 shadow-xs backdrop-blur-md"
      >
        <MaterialIcon name="auto_awesome" size={16} className="text-[#2563EB] dark:text-blue-300" />
        <span>Zero-Trust AI Architecture &bull; Google Cloud Run</span>
      </motion.div>

      {/* Main Headline with Styled Italic Accent */}
      <motion.h1
        variants={heroItemVariants}
        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-center text-slate-900 dark:text-[#E6E1E5] tracking-tight max-w-4xl leading-[1.15]"
      >
        Reflect with Deep Insight. <br className="hidden sm:inline" />
        <span className="font-serif italic font-normal bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-300 dark:to-indigo-300">
          Protected in Seconds.
        </span>
      </motion.h1>

      <motion.p
        variants={heroItemVariants}
        className="mt-5 text-base sm:text-lg text-center text-slate-600 dark:text-[#CAC4D0] max-w-2xl leading-relaxed"
      >
        A private sanctuary for daily mindfulness and mental clarity, fortified by a server-side{' '}
        <span className="font-semibold text-blue-600 dark:text-blue-300">Zero-Trust Privacy Gateway</span>,
        GCP Secret Manager key isolation, and tenant-isolated Cloud Firestore.
      </motion.p>

      {/* Error / Notice Display */}
      {error && (
        <motion.div
          variants={heroItemVariants}
          className="mt-4 p-3 rounded-2xl bg-[#FFD8E4]/60 dark:bg-[#31111D]/60 border border-[#FFD8E4] dark:border-[#632034] text-[#31111D] dark:text-[#FFD8E4] text-xs max-w-lg text-center font-medium"
        >
          {error}
        </motion.div>
      )}

      {/* Sign-In Actions - M3 Button Specification */}
      <motion.div
        variants={heroItemVariants}
        className="mt-8 flex flex-col items-center gap-3.5 w-full max-w-md justify-center"
      >
        {/* Google Sign In Brand Button - M3 Filled Primary */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="m3-btn m3-btn-filled h-12 px-8 w-full sm:w-auto font-medium text-sm flex items-center justify-center gap-3 shadow-md"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <span>{isLoading ? 'Connecting to Google...' : 'Sign In with Google'}</span>
          <MaterialIcon name="arrow_forward" size={16} />
        </button>

        {onOpenAccountPicker && (
          <button
            onClick={onOpenAccountPicker}
            className="m3-btn m3-btn-text text-xs font-semibold"
          >
            <span>Or choose / enter Google Account email</span>
            <MaterialIcon name="arrow_forward" size={14} />
          </button>
        )}
      </motion.div>

      {/* 4 Zero-Trust Architecture Cards - Sequenced Material Entrance */}
      <div className="mt-16 w-full">
        <motion.div variants={heroItemVariants} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#14204F]/60 border border-slate-200 dark:border-blue-900/40 shadow-xs mb-3 backdrop-blur-md">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
              <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
              <span className="w-2 h-2 rounded-full bg-[#FBBC05]" />
              <span className="w-2 h-2 rounded-full bg-[#34A853]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#CAC4D0]">
              Enterprise Security Pillars
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#E6E1E5]">
            Why Zero-Trust Journaling Matters
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#CAC4D0] max-w-xl mx-auto mt-2">
            Architected with Google Cloud enterprise-grade security primitives for absolute data sovereignty.
          </p>
        </motion.div>

        <div className="relative w-full">
          {/* Subtle Ambient Google Quad-Color Backlight */}
          <div className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-r from-[#4285F4]/8 via-[#EA4335]/6 via-[#FBBC05]/6 to-[#34A853]/8 blur-2xl pointer-events-none opacity-80 dark:opacity-40" />

          <motion.div
            variants={cardsContainerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full"
          >
            {/* Card 1: Google Blue - DLP Engine */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
              className="group relative rounded-3xl bg-gradient-to-br from-blue-50/90 via-white/95 to-blue-100/40 dark:from-blue-950/40 dark:via-[#14204F]/50 dark:to-blue-900/20 backdrop-blur-md border border-blue-200/80 dark:border-blue-800/40 hover:border-[#4285F4] dark:hover:border-[#4285F4] shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transform-gpu transition-[border-color,box-shadow] duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Google Blue Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-blue-400 to-sky-300" />
              
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-950/60 text-[#1A73E8] dark:text-[#8AB4F8] flex items-center justify-center shadow-xs ring-1 ring-blue-200/70 dark:ring-blue-700/50 group-hover:scale-105 transition-transform">
                      <MaterialIcon name="verified_user" size={26} className="text-[#1A73E8] dark:text-[#8AB4F8]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 text-[#1A73E8] dark:text-[#8AB4F8] border border-blue-200/70 dark:border-blue-800/40">
                      Cloud DLP
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-base group-hover:text-[#1A73E8] dark:group-hover:text-[#8AB4F8] transition-colors">
                    Zero-Trust Gateway
                  </h3>
                  <p className="mt-2 text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                    Scrubs names, locations, emails, and phone numbers into surrogate cryptographic tokens before transmitting prompts to Gemini.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-blue-100 dark:border-blue-900/40 flex items-center gap-1.5 text-xs font-semibold text-[#1A73E8] dark:text-[#8AB4F8]">
                  <MaterialIcon name="check_circle" size={16} className="text-[#1A73E8] dark:text-[#8AB4F8]" />
                  <span>Full PII Anonymization</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Google Red - Secret Manager */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
              className="group relative rounded-3xl bg-gradient-to-br from-red-50/90 via-white/95 to-red-100/40 dark:from-red-950/30 dark:via-[#14204F]/40 dark:to-red-900/15 backdrop-blur-md border border-red-200/80 dark:border-red-800/40 hover:border-[#EA4335] dark:hover:border-[#EA4335] shadow-xs hover:shadow-xl hover:shadow-red-500/10 transform-gpu transition-[border-color,box-shadow] duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Google Red Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#EA4335] via-red-400 to-rose-300" />
              
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/50 dark:to-red-950/60 text-[#D93025] dark:text-[#F28B82] flex items-center justify-center shadow-xs ring-1 ring-red-200/70 dark:ring-red-700/50 group-hover:scale-105 transition-transform">
                      <MaterialIcon name="vpn_key" size={26} className="text-[#D93025] dark:text-[#F28B82]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-red-100/80 dark:bg-red-950/60 text-[#D93025] dark:text-[#F28B82] border border-red-200/70 dark:border-red-800/40">
                      Secret Manager
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-base group-hover:text-[#D93025] dark:group-hover:text-[#F28B82] transition-colors">
                    GCP Secret Manager
                  </h3>
                  <p className="mt-2 text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                    Fetches <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-red-100/60 dark:bg-red-950/60 text-[#D93025] dark:text-[#F28B82]">GEMINI_API_KEY</code> at container runtime with in-memory caching. Zero client bundle leak.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-red-100 dark:border-red-900/40 flex items-center gap-1.5 text-xs font-semibold text-[#D93025] dark:text-[#F28B82]">
                  <MaterialIcon name="check_circle" size={16} className="text-[#D93025] dark:text-[#F28B82]" />
                  <span>Zero Bundle Secret Leaks</span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Google Yellow - Resilient Fallback */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
              className="group relative rounded-3xl bg-gradient-to-br from-yellow-50/95 via-amber-50/60 to-yellow-100/70 dark:from-yellow-950/35 dark:via-[#14204F]/40 dark:to-amber-900/20 backdrop-blur-md border border-yellow-300 dark:border-yellow-600/50 hover:border-[#FBBC05] dark:hover:border-[#FBBC05] shadow-xs hover:shadow-xl hover:shadow-yellow-500/15 transform-gpu transition-[border-color,box-shadow] duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Google Yellow Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#FBBC05] via-yellow-400 to-amber-300" />
              
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-200/90 to-yellow-100 dark:from-yellow-900/60 dark:to-amber-950/70 text-[#9E5500] dark:text-[#FDD663] flex items-center justify-center shadow-xs ring-1 ring-yellow-300 dark:ring-yellow-600/60 group-hover:scale-105 transition-transform">
                      <MaterialIcon name="bolt" size={26} className="text-[#9E5500] dark:text-[#FDD663]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/70 text-[#9E5500] dark:text-[#FDD663] border border-yellow-300 dark:border-yellow-700/60">
                      Gemini Ladder
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-base group-hover:text-[#9E5500] dark:group-hover:text-[#FDD663] transition-colors">
                    Resilient Fallback
                  </h3>
                  <p className="mt-2 text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                    Automated multi-tier fallback ladder across Gemini models with autonomous local fallback against <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-yellow-100/80 dark:bg-yellow-950/60 text-[#9E5500] dark:text-[#FDD663]">503 / 429</code> spikes or rate limits.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-yellow-200/90 dark:border-yellow-900/50 flex items-center gap-1.5 text-xs font-semibold text-[#9E5500] dark:text-[#FDD663]">
                  <MaterialIcon name="check_circle" size={16} className="text-[#9E5500] dark:text-[#FDD663]" />
                  <span>503 / 429 Resilience</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Google Green - Tenant Firestore */}
            <motion.div
              variants={cardItemVariants}
              whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
              className="group relative rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white/95 to-green-100/40 dark:from-emerald-950/30 dark:via-[#14204F]/40 dark:to-emerald-900/15 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-800/40 hover:border-[#34A853] dark:hover:border-[#34A853] shadow-xs hover:shadow-xl hover:shadow-emerald-500/10 transform-gpu transition-[border-color,box-shadow] duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Top Google Green Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#34A853] via-emerald-400 to-teal-300" />
              
              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-50 dark:from-emerald-900/50 dark:to-emerald-950/60 text-[#188038] dark:text-[#81C995] flex items-center justify-center shadow-xs ring-1 ring-emerald-200/70 dark:ring-emerald-700/50 group-hover:scale-105 transition-transform">
                      <MaterialIcon name="dns" size={26} className="text-[#188038] dark:text-[#81C995]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-[#188038] dark:text-[#81C995] border border-emerald-200/70 dark:border-emerald-800/40">
                      Cloud Firestore
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-base group-hover:text-[#188038] dark:group-hover:text-[#81C995] transition-colors">
                    Tenant Firestore
                  </h3>
                  <p className="mt-2 text-xs text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                    Isolated subcollections at <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-emerald-100/60 dark:bg-emerald-950/60 text-[#188038] dark:text-[#81C995]">/users/{'{uid}'}</code> enforcing strict subcollection isolation rules.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1.5 text-xs font-semibold text-[#188038] dark:text-[#81C995]">
                  <MaterialIcon name="check_circle" size={16} className="text-[#188038] dark:text-[#81C995]" />
                  <span>Cryptographic User Scope</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
