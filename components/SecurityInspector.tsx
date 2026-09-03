'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { DetectedEntity } from '@/lib/privacy-gateway/dlp';

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;
const M3_ACCELERATE = [0.3, 0.0, 0.8, 0.15] as const;

const hudGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const hudCardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: M3_DECELERATE },
  },
};

interface SecurityInspectorProps {
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
  onBackToJournal?: () => void;
}

export function SecurityInspector({
  rawPrompt,
  sanitizedPrompt,
  piiEntities = [],
  piiCountScrubbed = 0,
  tokenMap = {},
  modelUsed,
  fallbackTrail = [],
  latencyMs,
  secretSource = 'Google Cloud Secret Manager',
  secretCached = true,
  storedFirestoreDoc,
  onBackToJournal,
}: SecurityInspectorProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'sanitized' | 'firestore' | 'hud'>('sanitized');
  const [copied, setCopied] = useState(false);

  const copyFirestoreJson = () => {
    if (storedFirestoreDoc) {
      navigator.clipboard.writeText(JSON.stringify(storedFirestoreDoc, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'PERSON':
        return 'bg-[#EADDFF] text-[#21005D] dark:bg-[#381E72]/50 dark:text-[#EADDFF] border-[#D0BCFF] dark:border-[#6750A4]';
      case 'EMAIL':
        return 'bg-[#E8DEF8] text-[#21005D] dark:bg-[#381E72]/40 dark:text-[#EADDFF] border-[#D0BCFF] dark:border-[#6750A4]';
      case 'PHONE':
        return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'LOCATION':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'SSN':
      case 'CREDIT_CARD':
        return 'bg-[#FFD8E4] text-[#31111D] dark:bg-[#632034] dark:text-[#FFD8E4] border-[#FFD8E4] dark:border-[#632034]';
      default:
        return 'bg-[#E8DEF8] text-[#21005D] dark:bg-[#381E72]/50 dark:text-[#EADDFF] border-[#D0BCFF] dark:border-[#6750A4]';
    }
  };

  return (
    <div
      id="security-inspector-card"
      className="bg-white dark:bg-[#1D1B20] rounded-3xl border border-[#E3E2E6] dark:border-[#383440] shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Top Header Section with Spacious Metrics & Material 3 Navigation */}
      <div className="p-5 sm:p-7 border-b border-[#E3E2E6] dark:border-[#383440] bg-[#F7F5FA] dark:bg-[#1E1B24]">
        {/* Row 1: Title, Subtitle, and Back Button / Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] border border-[#D0BCFF] dark:border-[#6750A4] shadow-xs shrink-0">
              <MaterialIcon name="shield" size={24} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-lg sm:text-xl tracking-tight">
                  Live Security HUD & Zero-Trust Inspector
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Zero Client Credentials
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#49454F] dark:text-[#CAC4D0] mt-1">
                Real-time inspection of client-sanitized DLP payloads, Secret Manager keys, and isolated Firestore documents.
              </p>
            </div>
          </div>

          {/* Right Action: Return to Journal or Active Pill */}
          {onBackToJournal ? (
            <button
              onClick={onBackToJournal}
              className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#2B2930] hover:bg-[#EADDFF] dark:hover:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] border border-[#E3E2E6] dark:border-[#49454F] transition-all shadow-xs cursor-pointer shrink-0"
            >
              <MaterialIcon name="chevron_left" size={16} />
              <span>Back to Journal</span>
            </button>
          ) : (
            <div className="self-start sm:self-center hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EADDFF]/80 dark:bg-[#381E72]/60 text-[#21005D] dark:text-[#EADDFF] border border-[#D0BCFF] dark:border-[#6750A4] shrink-0">
              <MaterialIcon name="verified_user" size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
              <span>Subcollection Tenant Guard</span>
            </div>
          )}
        </div>

        {/* Row 2: 3 High-Visibility Architectural Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {/* Metric 1: PII Scrub Count */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E3E2E6] dark:border-[#383440] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#EADDFF] dark:bg-[#381E72]/60 text-[#21005D] dark:text-[#EADDFF] flex items-center justify-center shrink-0">
              <MaterialIcon name="shield" size={20} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5] flex items-center gap-1.5">
                <span>{piiCountScrubbed} Entities Scrubbed</span>
                {piiCountScrubbed > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99] truncate">
                Client-Side DLP De-Identified
              </div>
            </div>
          </div>

          {/* Metric 2: Active Gemini Model */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E3E2E6] dark:border-[#383440] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <MaterialIcon name="memory" size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5] font-mono truncate">
                {modelUsed || 'gemini-3.6-flash'}
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99] truncate">
                Tier 1 Resilient Model Ladder
              </div>
            </div>
          </div>

          {/* Metric 3: Secret Manager Key */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E3E2E6] dark:border-[#383440] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#E8DEF8] dark:bg-[#381E72]/40 text-[#21005D] dark:text-[#EADDFF] flex items-center justify-center shrink-0">
              <MaterialIcon name="vpn_key" size={20} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5] truncate">
                Secret Manager
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99] truncate">
                {secretCached ? 'Warm In-Memory Cache' : 'Dynamic Cloud Fetch'}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: 4 Clean, Uncrowded Material 3 Segmented Inspection Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
          {/* Tab 1: Sanitized Context */}
          <button
            id="tab-sanitized"
            onClick={() => setActiveTab('sanitized')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'sanitized'
                ? 'bg-[#6750A4] text-white border-[#6750A4] shadow-sm ring-2 ring-[#6750A4]/30'
                : 'bg-white dark:bg-[#25232A] hover:bg-[#F3EEFA] dark:hover:bg-[#2F2C35] text-[#49454F] dark:text-[#CAC4D0] border-[#E3E2E6] dark:border-[#383440]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <MaterialIcon
                name="shield"
                size={18}
                className={activeTab === 'sanitized' ? 'text-white' : 'text-[#6750A4] dark:text-[#D0BCFF]'}
              />
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'sanitized'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF]'
                }`}
              >
                DLP
              </span>
            </div>
            <div className={`text-xs font-bold ${activeTab === 'sanitized' ? 'text-white' : 'text-[#1C1B1F] dark:text-[#E6E1E5]'}`}>
              Redacted Context
            </div>
            <div className={`text-[11px] mt-0.5 truncate ${activeTab === 'sanitized' ? 'text-white/80' : 'text-[#79747E] dark:text-[#938F99]'}`}>
              Transmitted to Gemini
            </div>
          </button>

          {/* Tab 2: Raw Input & PII */}
          <button
            id="tab-raw"
            onClick={() => setActiveTab('raw')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-[#6750A4] text-white border-[#6750A4] shadow-sm ring-2 ring-[#6750A4]/30'
                : 'bg-white dark:bg-[#25232A] hover:bg-[#F3EEFA] dark:hover:bg-[#2F2C35] text-[#49454F] dark:text-[#CAC4D0] border-[#E3E2E6] dark:border-[#383440]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <MaterialIcon
                name="visibility"
                size={18}
                className={activeTab === 'raw' ? 'text-white' : 'text-[#6750A4] dark:text-[#D0BCFF]'}
              />
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'raw'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#FFD8E4] dark:bg-[#632034] text-[#31111D] dark:text-[#FFD8E4]'
                }`}
              >
                {piiEntities.length}
              </span>
            </div>
            <div className={`text-xs font-bold ${activeTab === 'raw' ? 'text-white' : 'text-[#1C1B1F] dark:text-[#E6E1E5]'}`}>
              Raw Input & PII
            </div>
            <div className={`text-[11px] mt-0.5 truncate ${activeTab === 'raw' ? 'text-white/80' : 'text-[#79747E] dark:text-[#938F99]'}`}>
              {piiEntities.length} entity tags detected
            </div>
          </button>

          {/* Tab 3: Stored Firestore Document */}
          <button
            id="tab-firestore"
            onClick={() => setActiveTab('firestore')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'firestore'
                ? 'bg-[#6750A4] text-white border-[#6750A4] shadow-sm ring-2 ring-[#6750A4]/30'
                : 'bg-white dark:bg-[#25232A] hover:bg-[#F3EEFA] dark:hover:bg-[#2F2C35] text-[#49454F] dark:text-[#CAC4D0] border-[#E3E2E6] dark:border-[#383440]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <MaterialIcon
                name="dns"
                size={18}
                className={activeTab === 'firestore' ? 'text-white' : 'text-[#6750A4] dark:text-[#D0BCFF]'}
              />
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'firestore'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#E8DEF8] dark:bg-[#381E72]/50 text-[#21005D] dark:text-[#EADDFF]'
                }`}
              >
                RBAC
              </span>
            </div>
            <div className={`text-xs font-bold ${activeTab === 'firestore' ? 'text-white' : 'text-[#1C1B1F] dark:text-[#E6E1E5]'}`}>
              Firestore Record
            </div>
            <div className={`text-[11px] mt-0.5 truncate ${activeTab === 'firestore' ? 'text-white/80' : 'text-[#79747E] dark:text-[#938F99]'}`}>
              Tenant isolated subcollection
            </div>
          </button>

          {/* Tab 4: Privacy & Resilience Telemetry HUD */}
          <button
            id="tab-hud"
            onClick={() => setActiveTab('hud')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'hud'
                ? 'bg-[#6750A4] text-white border-[#6750A4] shadow-sm ring-2 ring-[#6750A4]/30'
                : 'bg-white dark:bg-[#25232A] hover:bg-[#F3EEFA] dark:hover:bg-[#2F2C35] text-[#49454F] dark:text-[#CAC4D0] border-[#E3E2E6] dark:border-[#383440]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <MaterialIcon
                name="insights"
                size={18}
                className={activeTab === 'hud' ? 'text-white' : 'text-[#6750A4] dark:text-[#D0BCFF]'}
              />
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'hud'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                Ladder
              </span>
            </div>
            <div className={`text-xs font-bold ${activeTab === 'hud' ? 'text-white' : 'text-[#1C1B1F] dark:text-[#E6E1E5]'}`}>
              System Telemetry
            </div>
            <div className={`text-[11px] mt-0.5 truncate ${activeTab === 'hud' ? 'text-white/80' : 'text-[#79747E] dark:text-[#938F99]'}`}>
              4-tier fallback & latency
            </div>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {/* Tab 1: Sanitized Context Sent to Gemini */}
          {activeTab === 'sanitized' && (
            <motion.div
              key="tab-sanitized"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: M3_DECELERATE }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-sm font-semibold text-[#1C1B1F] dark:text-[#E6E1E5]">
                    Exact De-Identified Payload Transmitted to Gemini SDK
                  </h4>
                </div>
                <span className="text-xs text-[#49454F] dark:text-[#CAC4D0] font-mono">
                  No Raw PII Crosses the Boundary
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#141218] text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap border border-[#49454F] shadow-inner overflow-x-auto">
                {sanitizedPrompt ? (
                  sanitizedPrompt.split(/(\[[A-Z_]+_\d+\])/g).map((segment, idx) => {
                    if (segment.match(/^\[[A-Z_]+_\d+\]$/)) {
                      return (
                        <span
                          key={idx}
                          className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-[#FFD8E4] text-[#31111D] font-bold border border-[#FFD8E4]"
                          title="Surrogate Token (Protected by DLP Engine)"
                        >
                          {segment}
                        </span>
                      );
                    }
                    return <span key={idx} className="text-[#E6E1E5]">{segment}</span>;
                  })
                ) : (
                  <span className="text-[#CAC4D0] italic">No prompt entered yet. Compose a journal reflection to inspect de-identification.</span>
                )}
              </div>

              {/* Token Mapping Table */}
              {Object.keys(tokenMap).length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-[#F3F3FA] dark:bg-[#211F26] border border-[#E3E2E6] dark:border-[#49454F]">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-[#21005D] dark:text-[#EADDFF] mb-2.5">
                    Surrogate Token Translation Dictionary (Server-Side In-Memory Only)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(tokenMap).map(([surrogate, original]) => (
                      <div
                        key={surrogate}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#2B2930] border border-[#E3E2E6] dark:border-[#49454F] text-xs"
                      >
                        <span className="font-mono font-bold text-[#6750A4] dark:text-[#D0BCFF]">
                          {surrogate}
                        </span>
                        <span className="text-[#49454F] text-[11px]">maps to</span>
                        <span className="font-medium text-[#1C1B1F] dark:text-[#E6E1E5] truncate max-w-[100px]">
                          &ldquo;{original}&rdquo;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 2: Raw Input & Detected PII */}
          {activeTab === 'raw' && (
            <motion.div
              key="tab-raw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: M3_DECELERATE }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#1C1B1F] dark:text-[#E6E1E5]">
                  Original User Input with Detected Sensitive Entity Tags
                </h4>
                <span className="text-xs text-[#49454F] dark:text-[#CAC4D0]">
                  {piiEntities.length} sensitive patterns detected
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F3F3FA] dark:bg-[#211F26] border border-[#E3E2E6] dark:border-[#49454F] text-sm text-[#1C1B1F] dark:text-[#E6E1E5] whitespace-pre-wrap leading-relaxed">
                {rawPrompt || <span className="text-[#49454F] italic">No prompt provided.</span>}
              </div>

              {/* Entity badges list */}
              {piiEntities.length > 0 ? (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-[#49454F] dark:text-[#CAC4D0]">
                    Detected Entity Breakdown
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {piiEntities.map((entity) => (
                      <div
                        key={entity.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${getBadgeColor(
                          entity.type
                        )}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-black/40 font-mono text-[10px]">
                            {entity.type}
                          </span>
                          <span className="font-medium">&ldquo;{entity.original}&rdquo;</span>
                        </div>
                        <span className="font-mono text-[11px] opacity-80 font-bold">
                          {entity.surrogate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#F3F3FA] dark:bg-[#211F26] text-center text-xs text-[#49454F]">
                  No high-risk PII detected in current entry.
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 3: Stored Firestore Document */}
          {activeTab === 'firestore' && (
            <motion.div
              key="tab-firestore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: M3_DECELERATE }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#1C1B1F] dark:text-[#E6E1E5]">
                    Isolated Cloud Firestore Document Path
                  </h4>
                  <p className="text-xs text-[#6750A4] dark:text-[#D0BCFF] font-mono mt-0.5">
                    /users/&#123;userId&#125;/interactions/&#123;interactionId&#125;
                  </p>
                </div>

                <button
                  onClick={copyFirestoreJson}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#F3F3FA] hover:bg-[#E8E7EF] dark:bg-[#2B2930] dark:hover:bg-[#36343B] text-[#49454F] dark:text-[#CAC4D0] border border-[#E3E2E6] dark:border-[#49454F] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <MaterialIcon name="check" size={15} className="text-emerald-500" />
                  ) : (
                    <MaterialIcon name="content_copy" size={15} />
                  )}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#141218] text-[#E6E1E5] font-mono text-xs overflow-x-auto border border-[#49454F] leading-relaxed max-h-96">
                {storedFirestoreDoc
                  ? JSON.stringify(storedFirestoreDoc, null, 2)
                  : JSON.stringify(
                      {
                        userId: 'authenticated_user_uid',
                        interactionId: 'inter_sample_123',
                        title: 'Sample Journal Entry',
                        rawPrompt: rawPrompt || 'My meeting in Seattle with Sarah...',
                        sanitizedPrompt: sanitizedPrompt || 'My meeting [LOCATION_1] with [PERSON_1]...',
                        reflection: 'Your reflection will be persisted securely here.',
                        piiEntitiesCount: piiCountScrubbed,
                        modelUsed: modelUsed || 'gemini-3.6-flash',
                        latencyMs: latencyMs || 410,
                        createdAt: new Date().toISOString(),
                      },
                      null,
                      2
                    )}
              </pre>
            </motion.div>
          )}

          {/* Tab 4: Telemetry & Resilience HUD */}
          {activeTab === 'hud' && (
            <motion.div
              key="tab-hud"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: M3_DECELERATE }}
              className="space-y-5"
            >
              {/* 4-Stat Grid */}
              <motion.div
                variants={hudGridVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {/* Stat 1: PII Scrubbed */}
                <motion.div
                  variants={hudCardVariants}
                  className="p-4 rounded-2xl bg-[#EADDFF]/60 dark:bg-[#381E72]/40 border border-[#D0BCFF] dark:border-[#6750A4]/60"
                >
                  <div className="flex items-center justify-between text-[#21005D] dark:text-[#EADDFF] mb-1">
                    <span className="text-xs font-semibold">PII Scrub Count</span>
                    <MaterialIcon name="shield" size={16} />
                  </div>
                  <div className="text-2xl font-bold text-[#21005D] dark:text-[#EADDFF]">
                    {piiCountScrubbed}
                  </div>
                  <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] mt-1 block">
                    Zero PII sent to AI backend
                  </span>
                </motion.div>

                {/* Stat 2: Secret Manager */}
                <motion.div
                  variants={hudCardVariants}
                  className="p-4 rounded-2xl bg-[#F3F3FA] dark:bg-[#2B2930] border border-[#E3E2E6] dark:border-[#49454F]"
                >
                  <div className="flex items-center justify-between text-[#49454F] dark:text-[#CAC4D0] mb-1">
                    <span className="text-xs font-semibold">Secret Management</span>
                    <MaterialIcon name="vpn_key" size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
                  </div>
                  <div className="text-sm font-bold text-[#1C1B1F] dark:text-[#E6E1E5] truncate">
                    {secretSource}
                  </div>
                  <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] mt-1 block">
                    In-Memory Cached: {secretCached ? 'YES (Warm Start)' : 'Loaded'}
                  </span>
                </motion.div>

                {/* Stat 3: Resolved Model */}
                <motion.div
                  variants={hudCardVariants}
                  className="p-4 rounded-2xl bg-[#E8DEF8] dark:bg-[#381E72]/40 border border-[#D0BCFF] dark:border-[#6750A4]/60"
                >
                  <div className="flex items-center justify-between text-[#21005D] dark:text-[#EADDFF] mb-1">
                    <span className="text-xs font-semibold">Active Gemini Model</span>
                    <MaterialIcon name="memory" size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
                  </div>
                  <div className="text-sm font-bold text-[#21005D] dark:text-[#EADDFF] truncate">
                    {modelUsed || 'gemini-3.6-flash'}
                  </div>
                  <span className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] mt-1 block">
                    Step 1 in Resilient Ladder
                  </span>
                </motion.div>

                {/* Stat 4: Roundtrip Latency */}
                <motion.div
                  variants={hudCardVariants}
                  className="p-4 rounded-2xl bg-[#FFD8E4]/60 dark:bg-[#31111D]/60 border border-[#FFD8E4] dark:border-[#632034]"
                >
                  <div className="flex items-center justify-between text-[#31111D] dark:text-[#FFD8E4] mb-1">
                    <span className="text-xs font-semibold">Roundtrip Latency</span>
                    <MaterialIcon name="schedule" size={16} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-[#31111D] dark:text-[#FFD8E4]">
                    {latencyMs > 0 ? `${latencyMs}ms` : '—'}
                  </div>
                  <span className="text-[11px] text-[#31111D]/80 dark:text-[#FFD8E4]/80 mt-1 block">
                    DLP + Inference + Detokenize
                  </span>
                </motion.div>
              </motion.div>

              {/* Model Fallback Ladder Visualizer */}
              <div className="p-4 rounded-2xl bg-[#F3F3FA] dark:bg-[#211F26] border border-[#E3E2E6] dark:border-[#49454F]">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#1C1B1F] dark:text-[#E6E1E5] mb-3 flex items-center gap-2">
                  <MaterialIcon name="insights" size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
                  <span>4-Tier Resilient Gemini Fallback Ladder Status</span>
                </h5>

                <motion.div
                  variants={hudGridVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2"
                >
                  {[
                    { name: 'gemini-3.6-flash', tier: 'Primary Model', step: 1 },
                    { name: 'gemini-3.1-flash-lite', tier: 'High-Availability Lite', step: 2 },
                    { name: 'gemini-flash-latest', tier: 'Dynamic Alias', step: 3 },
                    { name: 'gemini-3.7-flash', tier: 'Deep Reasoning', step: 4 },
                  ].map((item) => {
                    const isCurrent = modelUsed === item.name;
                    return (
                      <motion.div
                        key={item.name}
                        variants={hudCardVariants}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#EADDFF] dark:bg-[#381E72]/70 border-[#D0BCFF] dark:border-[#6750A4] text-[#21005D] dark:text-[#EADDFF] font-semibold'
                            : 'bg-white dark:bg-[#2B2930] border-[#E3E2E6] dark:border-[#49454F] text-[#49454F] dark:text-[#CAC4D0]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider font-bold opacity-75">
                            Step {item.step}
                          </span>
                          {isCurrent ? (
                            <MaterialIcon name="check_circle" size={15} className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#E3E2E6] dark:bg-[#49454F]"></span>
                          )}
                        </div>
                        <div className="font-mono text-xs font-semibold">{item.name}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">{item.tier}</div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
