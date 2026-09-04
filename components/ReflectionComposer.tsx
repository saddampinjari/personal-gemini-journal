'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { deidentifyText } from '@/lib/privacy-gateway/dlp';
import { LocationPicker, type LocationData } from '@/components/LocationPicker';

interface ReflectionComposerProps {
  onSubmit: (prompt: string, mood: string, location?: LocationData | null) => Promise<void>;
  isLoading: boolean;
}

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;

const M3_SMOOTH = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: M3_SMOOTH,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, ease: M3_SMOOTH },
  },
};

const cardsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: M3_SMOOTH,
    },
  },
};

const MOOD_OPTIONS = [
  { id: 'reflective', label: 'Reflective', icon: 'psychology' },
  { id: 'grateful', label: 'Grateful', icon: 'favorite' },
  { id: 'anxious', label: 'Anxious', icon: 'waves' },
  { id: 'energized', label: 'Energized', icon: 'bolt' },
  { id: 'thoughtful', label: 'Thoughtful', icon: 'lightbulb' },
  { id: 'peaceful', label: 'Peaceful', icon: 'spa' },
];

const INSPIRATION_PROMPTS = [
  {
    title: 'Workplace Sync & Deadline Anxiety',
    category: 'Work & Stress',
    text: 'Today I had a tense meeting in Seattle with Dr. Sarah Connor and Alex Smith about the Q3 budget. I felt overwhelmed when my manager questioned my timeline, but I stayed calm and articulated our engineering constraints.',
  },
  {
    title: 'Overcoming Imposter Syndrome',
    category: 'Personal Growth',
    text: 'I presented my architecture review to the executive team in San Francisco. Although I was nervous about my ideas, John Doe and the team praised the zero-trust security model. I need to celebrate this progress.',
  },
  {
    title: 'Navigating Difficult Decisions',
    category: 'Life & Career',
    text: 'I am evaluating two career offers between an opportunity in New York and staying remote in Austin. I called 555-019-2834 to consult with my mentor about long-term growth versus work-life sustainability.',
  },
];

export function ReflectionComposer({ onSubmit, isLoading }: ReflectionComposerProps) {
  const [prompt, setPrompt] = useState('');
  const [mood, setMood] = useState('reflective');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showLiveDlp, setShowLiveDlp] = useState(false);

  // Client-side quick DLP preview
  const livePreview = deidentifyText(prompt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await onSubmit(prompt, mood, location);
  };

  const handleSelectInspiration = (text: string) => {
    setPrompt(text);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      id="reflection-composer-card"
      className="bg-white dark:bg-[#1E1C23] rounded-3xl border border-[#E8E4EE] dark:border-[#36343B] shadow-xs p-6 sm:p-9 transition-colors duration-200"
    >
      {/* Top Header Section: Clean, Spacious, Matching Security HUD */}
      <motion.div
        variants={itemVariants}
        className="p-5 sm:p-7 border-b border-[#E8E4EE] dark:border-[#36343B] bg-[#F7F5FA] dark:bg-[#1E1B24] -m-6 sm:-m-9 mb-6 sm:mb-8"
      >
        {/* Row 1: Icon, Title, and Privacy Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] border border-[#D0BCFF] dark:border-[#6750A4] shadow-xs shrink-0">
              <MaterialIcon name="edit_note" size={26} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-lg sm:text-xl tracking-tight">
                  New Journal Reflection
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Zero-Trust DLP Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0] mt-1">
                Reflect freely. Names, locations, and personal identifiers are scrubbed locally before AI processing.
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="self-start sm:self-center flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#25232A] text-[#21005D] dark:text-[#EADDFF] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs shrink-0">
            <MaterialIcon name="shield" size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            <span>
              {livePreview.scrubCount > 0
                ? `${livePreview.scrubCount} PII Entities Detected`
                : 'Privacy Sanitizer Ready'}
            </span>
          </div>
        </div>

        {/* Row 2: 3 Informative Metric Cards Matching Security HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {/* Card 1: DLP De-identification Status */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#EADDFF] dark:bg-[#381E72]/60 text-[#21005D] dark:text-[#EADDFF] flex items-center justify-center shrink-0">
              <MaterialIcon name="shield" size={20} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5]">
                {livePreview.scrubCount > 0 ? `${livePreview.scrubCount} PII Redacted` : 'Local Privacy Scrub'}
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99] truncate">
                De-identifies sensitive entities
              </div>
            </div>
          </div>

          {/* Card 2: Isolated Firestore Storage */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8DEF8] dark:bg-[#381E72]/40 text-[#21005D] dark:text-[#EADDFF] flex items-center justify-center shrink-0">
              <MaterialIcon name="dns" size={20} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5]">
                Tenant Subcollection
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99] truncate">
                /users/{'{uid}'}/interactions
              </div>
            </div>
          </div>

          {/* Card 3: Model Target */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <MaterialIcon name="memory" size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5] font-mono truncate">
                gemini-3.6-flash
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99] truncate">
                4-Tier Resilient Ladder
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Mood Selector */}
        <motion.div variants={itemVariants}>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#79747E] dark:text-[#938F99] mb-3">
            Choose Emotional Tone:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {MOOD_OPTIONS.map((m) => {
              const isSelected = mood === m.id;
              return (
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#F5F0FB] dark:bg-[#2C2438] border-[#6750A4] text-[#6750A4] dark:text-[#D0BCFF] shadow-xs ring-1 ring-[#6750A4]'
                      : 'bg-[#FAF8FD] dark:bg-[#232128] border-[#E8E4EE] dark:border-[#36343B] text-[#49454F] dark:text-[#CAC4D0] hover:border-[#D0BCFF]'
                  }`}
                >
                  <MaterialIcon name={m.icon} size={24} className="mb-1" />
                  <span className="text-xs font-semibold">{m.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Writing Canvas Textarea */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#79747E] dark:text-[#938F99]">
                Your Reflection:
              </label>
              <LocationPicker location={location} onChange={setLocation} />
            </div>
            <span className="text-xs text-[#79747E] dark:text-[#938F99]">
              {prompt.length} / 10,000 characters
            </span>
          </div>

          <div className="relative">
            <textarea
              id="journal-prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="What is on your mind today? (e.g. meetings, feelings, personal hurdles, milestones...)"
              rows={6}
              maxLength={10000}
              className="w-full p-5 text-base rounded-2xl bg-[#FAF8FD] dark:bg-[#232128] border border-[#E8E4EE] dark:border-[#36343B] text-[#1C1B1F] dark:text-[#E6E1E5] placeholder-[#79747E] focus:outline-hidden focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 transition-all resize-y leading-relaxed disabled:opacity-60"
            />
          </div>

          {/* Quick toggle for live PII sanitization preview */}
          {prompt.length > 0 && livePreview.scrubCount > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowLiveDlp(!showLiveDlp)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#6750A4] dark:text-[#D0BCFF] hover:underline cursor-pointer"
              >
                <MaterialIcon name={showLiveDlp ? "visibility_off" : "visibility"} size={16} />
                <span>
                  {showLiveDlp
                    ? 'Hide Sanitized Context Preview'
                    : `View Sanitized Context Sent to Gemini (${livePreview.scrubCount} PII scrubbed)`}
                </span>
              </button>

              {showLiveDlp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 text-xs"
                >
                  <span className="font-bold block mb-1">
                    Sanitized Payload (Gemini will only see this):
                  </span>
                  <p className="font-mono text-xs leading-relaxed break-words">
                    {livePreview.sanitizedText}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Inspiration Prompts (Step Cards) */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <MaterialIcon name="lightbulb" size={18} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#79747E] dark:text-[#938F99]">
              Need inspiration? Try a sample entry with PII:
            </span>
          </div>

          <motion.div
            variants={cardsContainerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {INSPIRATION_PROMPTS.map((insp, i) => (
              <motion.button
                variants={cardVariants}
                whileHover={{ y: -3, scale: 1.015, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                type="button"
                key={i}
                onClick={() => handleSelectInspiration(insp.text)}
                disabled={isLoading}
                className="p-4 rounded-2xl bg-[#FAF8FD] dark:bg-[#232128] border border-[#E8E4EE] dark:border-[#36343B] hover:border-[#D0BCFF] text-left transition-colors group cursor-pointer"
              >
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EADDFF] dark:bg-[#381E72]/50 text-[#21005D] dark:text-[#EADDFF] mb-1.5">
                  {insp.category}
                </span>
                <h4 className="font-bold text-xs text-[#1C1B1F] dark:text-[#E6E1E5] group-hover:text-[#6750A4] dark:group-hover:text-[#D0BCFF] line-clamp-1">
                  {insp.title}
                </h4>
                <p className="text-[11px] text-[#79747E] dark:text-[#938F99] mt-1 line-clamp-2 leading-relaxed">
                  {insp.text}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom Submission Bar */}
        <motion.div
          variants={itemVariants}
          className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E4EE] dark:border-[#36343B]"
        >
          <div className="flex items-center gap-2 text-xs text-[#79747E] dark:text-[#938F99]">
            <MaterialIcon name="check_circle" size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Encrypted with Secret Manager &bull; Isolated Firestore Subcollections</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            id="submit-reflection-btn"
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#6750A4] hover:bg-[#563E93] active:bg-[#473082] text-white font-bold text-sm shadow-xs hover:shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <MaterialIcon name="refresh" size={18} className="animate-spin" />
                <span>Synthesizing Reflection...</span>
              </>
            ) : (
              <>
                <MaterialIcon name="auto_awesome" size={18} />
                <span>Generate Reflection</span>
                <MaterialIcon name="send" size={16} className="ml-0.5" />
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
