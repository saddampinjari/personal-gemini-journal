'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: M3_DECELERATE,
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: M3_DECELERATE,
    },
  },
};

interface ReflectionViewerProps {
  title: string;
  reflection: string;
  mood: string;
  modelUsed: string;
  piiEntitiesCount: number;
  latencyMs: number;
  createdAt: string;
  onScrollToInspector?: () => void;
}

export function ReflectionViewer({
  title,
  reflection,
  mood,
  modelUsed,
  piiEntitiesCount,
  latencyMs,
  createdAt,
  onScrollToInspector,
}: ReflectionViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reflection);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const content = `# ${title}\n*Created: ${new Date(createdAt).toLocaleString()}*\n*Mood: ${mood}* | *Model: ${modelUsed}*\n\n${reflection}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-reflection-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      id="reflection-viewer-card"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-[#1D1B20] rounded-3xl border border-[#E3E2E6] dark:border-[#49454F] shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Reflection Header: Clean, Spacious, Matching Security HUD */}
      <motion.div
        variants={itemVariants}
        className="p-5 sm:p-7 border-b border-[#E8E4EE] dark:border-[#36343B] bg-[#F7F5FA] dark:bg-[#1E1B24]"
      >
        {/* Row 1: Title, Meta, and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] border border-[#D0BCFF] dark:border-[#6750A4] shadow-xs shrink-0">
              <MaterialIcon name="auto_awesome" size={24} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg sm:text-xl text-[#1C1B1F] dark:text-[#E6E1E5] tracking-tight">
                  {title || 'AI Journal Reflection'}
                </h3>
                <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EADDFF] dark:bg-[#381E72]/60 text-[#21005D] dark:text-[#EADDFF]">
                  {mood || 'Reflective'}
                </span>
              </div>
              <p className="text-xs text-[#79747E] dark:text-[#938F99] mt-1">
                Recorded {new Date(createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
            {onScrollToInspector && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onScrollToInspector}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#25232A] hover:bg-[#EADDFF] dark:hover:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs transition-colors cursor-pointer"
              >
                <MaterialIcon name="verified_user" size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Security HUD</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="copy-reflection-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-[#25232A] hover:bg-[#F5F2F9] dark:hover:bg-[#2C2932] text-[#1C1B1F] dark:text-[#E6E1E5] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs transition-colors cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? (
                <MaterialIcon name="check" size={16} className="text-emerald-500" />
              ) : (
                <MaterialIcon name="content_copy" size={16} />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="export-reflection-btn"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#6750A4] hover:bg-[#563E93] text-white shadow-xs transition-colors cursor-pointer"
              title="Export Markdown file"
            >
              <MaterialIcon name="file_download" size={16} />
              <span>Export</span>
            </motion.button>
          </div>
        </div>

        {/* Row 2: 3 Informative Meta Stat Cards Matching Security HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {/* Card 1: Active Model */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <MaterialIcon name="memory" size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5] font-mono truncate">
                {modelUsed || 'gemini-3.6-flash'}
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99]">
                Active Gemini Model
              </div>
            </div>
          </div>

          {/* Card 2: Latency */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <MaterialIcon name="schedule" size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5]">
                {latencyMs > 0 ? `${latencyMs} ms` : 'Sub-second'}
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99]">
                Roundtrip Latency
              </div>
            </div>
          </div>

          {/* Card 3: PII Scanned & Redacted */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#25232A] border border-[#E8E4EE] dark:border-[#383440] shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-[#EADDFF] dark:bg-[#381E72]/60 text-[#21005D] dark:text-[#EADDFF] flex items-center justify-center shrink-0">
              <MaterialIcon name="shield" size={18} className="text-[#6750A4] dark:text-[#D0BCFF]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1C1B1F] dark:text-[#E6E1E5]">
                {piiEntitiesCount > 0 ? `${piiEntitiesCount} Entities Sanitized` : 'Zero Identifiers Leaked'}
              </div>
              <div className="text-[11px] text-[#79747E] dark:text-[#938F99]">
                DLP Privacy Gateway
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reflection Content */}
      <motion.div variants={itemVariants} className="p-6 sm:p-9 space-y-4">
        <div className="prose prose-slate dark:prose-invert max-w-none text-[#1C1B1F] dark:text-[#E6E1E5] text-sm sm:text-base leading-relaxed space-y-3 font-sans">
          {reflection.split('\n\n').map((paragraph, index) => {
            // Check if bullet points
            if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
              const items = paragraph.split('\n').map((item) => item.replace(/^[-*]\s+/, ''));
              return (
                <ul key={index} className="list-disc pl-5 space-y-1.5 text-sm">
                  {items.map((it, i) => (
                    <li key={i} className="leading-relaxed">
                      {it}
                    </li>
                  ))}
                </ul>
              );
            }

            // Heading check
            if (paragraph.startsWith('### ') || paragraph.startsWith('## ') || paragraph.startsWith('# ')) {
              const headingText = paragraph.replace(/^#+\s+/, '');
              return (
                <h4
                  key={index}
                  className="font-semibold text-[#1C1B1F] dark:text-[#E6E1E5] text-base mt-4 mb-2 flex items-center gap-2"
                >
                  <span className="w-1.5 h-4 bg-[#6750A4] rounded-full"></span>
                  <span>{headingText}</span>
                </h4>
              );
            }

            return (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

