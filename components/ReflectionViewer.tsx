'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';

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
    transition: {
      duration: 0.22,
      ease: M3_SMOOTH,
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
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  } | null;
  conversation?: Array<{
    role: 'user' | 'model';
    content: string;
    createdAt?: string;
  }>;
  onFollowUpSubmit?: (followUpPrompt: string) => Promise<void>;
  isFollowUpLoading?: boolean;
  onScrollToInspector?: () => void;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*[^*]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      tokens.push(
        <strong key={match.index} className="font-bold text-[#1C1B1F] dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      tokens.push(
        <em key={match.index} className="italic text-[#4B5563] dark:text-[#94A3B8]">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

interface MarkdownBlock {
  type: 'heading' | 'ul' | 'ol' | 'p';
  level?: number;
  text?: string;
  items?: string[];
}

function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const lines = rawText.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({
        type: 'p',
        text: currentParagraph.join(' '),
      });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push({
        type: currentList.type,
        items: currentList.items,
      });
      currentList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading check: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    // Unordered bullet item: - ... or * ...
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered list item: 1. ...
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[1]);
      continue;
    }

    // Regular line in paragraph
    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function FormattedMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-4 text-[#1C1B1F] dark:text-[#E6E1E5] text-sm sm:text-base leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          return (
            <div
              key={idx}
              className={`pt-3 pb-1.5 border-b border-slate-200/80 dark:border-blue-900/40 ${
                idx === 0 ? 'pt-0' : 'mt-6'
              }`}
            >
              <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-blue-600 dark:bg-blue-400 inline-block shrink-0" />
                <span>{renderInlineMarkdown(block.text || '')}</span>
              </h4>
            </div>
          );
        }

        if (block.type === 'ul' && block.items) {
          return (
            <ul key={idx} className="space-y-2.5 pl-1 my-2">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="flex-1 text-[#334155] dark:text-[#CBD5E1]">
                    {renderInlineMarkdown(item)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol' && block.items) {
          return (
            <ol key={idx} className="space-y-2.5 pl-1 my-2">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0 mt-0.5">
                    {itemIdx + 1}
                  </span>
                  <span className="flex-1 text-[#334155] dark:text-[#CBD5E1]">
                    {renderInlineMarkdown(item)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
            {renderInlineMarkdown(block.text || '')}
          </p>
        );
      })}
    </div>
  );
}

export function ReflectionViewer({
  title,
  reflection,
  mood,
  modelUsed,
  piiEntitiesCount,
  latencyMs,
  createdAt,
  location,
  conversation,
  onFollowUpSubmit,
  isFollowUpLoading = false,
  onScrollToInspector,
}: ReflectionViewerProps) {
  const [copied, setCopied] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

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
      className="bg-white/95 dark:bg-[#0E1528]/85 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-blue-900/40 shadow-sm overflow-hidden transition-all duration-200"
    >
      {/* Reflection Header: Clean, Spacious, Matching Security HUD */}
      <motion.div
        variants={itemVariants}
        className="p-5 sm:p-7 border-b border-slate-200 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-[#14204F]/40 dark:to-transparent backdrop-blur-md"
      >
        {/* Title, Metadata, and Action Buttons Block */}
        <div className="flex items-start gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 dark:bg-[#14204F] text-[#14204F] dark:text-blue-200 border border-blue-200 dark:border-blue-700/60 shadow-xs shrink-0">
            <MaterialIcon name="auto_awesome" size={24} className="text-[#2563EB] dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg sm:text-xl text-[#1C1B1F] dark:text-[#E6E1E5] tracking-tight">
                {title || 'AI Journal Reflection'}
              </h3>
              <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-[#14204F]/80 text-[#14204F] dark:text-blue-200 shrink-0">
                {mood || 'Reflective'}
              </span>
              {location?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-[#14204F]/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shrink-0">
                  <MaterialIcon name="place" size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>{location.name}</span>
                  <span className="text-[10px] text-blue-500 font-mono">(DLP Masked)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#79747E] dark:text-[#938F99] mt-1">
              Recorded {new Date(createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>

            {/* Action buttons - Cleanly Inline Below Title */}
            <div className="flex items-center gap-2.5 flex-wrap mt-3.5">
              {onScrollToInspector && (
                <button
                  onClick={onScrollToInspector}
                  className="m3-btn m3-btn-tonal text-xs h-9 px-4"
                >
                  <MaterialIcon name="verified_user" size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Security HUD</span>
                </button>
              )}

              <button
                id="copy-reflection-btn"
                onClick={handleCopy}
                className="m3-btn m3-btn-outlined text-xs h-9 px-4"
                title="Copy to clipboard"
              >
                {copied ? (
                  <MaterialIcon name="check" size={16} className="text-emerald-500" />
                ) : (
                  <MaterialIcon name="content_copy" size={16} />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                id="export-reflection-btn"
                onClick={handleExport}
                className="m3-btn m3-btn-filled text-xs h-9 px-4"
                title="Export Markdown file"
              >
                <MaterialIcon name="file_download" size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: 3 Informative Meta Stat Cards Matching Security HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {/* Card 1: Active Model */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 dark:bg-[#0B1120]/70 backdrop-blur-md border border-slate-200 dark:border-blue-900/40 shadow-2xs">
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
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 dark:bg-[#0B1120]/70 backdrop-blur-md border border-slate-200 dark:border-blue-900/40 shadow-2xs">
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
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 dark:bg-[#0B1120]/70 backdrop-blur-md border border-slate-200 dark:border-blue-900/40 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-[#14204F]/80 text-[#14204F] dark:text-blue-200 flex items-center justify-center shrink-0">
              <MaterialIcon name="shield" size={18} className="text-[#2563EB] dark:text-blue-300" />
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
        <FormattedMarkdown content={reflection} />

        {/* Multi-turn Conversational Dialogue Thread */}
        {conversation && conversation.length > 2 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-blue-900/40 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MaterialIcon name="forum" size={20} className="text-[#2563EB] dark:text-blue-300" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#1C1B1F] dark:text-[#E6E1E5]">
                Continued Multi-Turn Dialogue
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-[#14204F]/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                {Math.floor((conversation.length - 2) / 2) + 1} Exchanges
              </span>
            </div>

            <div className="space-y-3">
              {conversation.slice(2).map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ml-4 sm:ml-8'
                      : 'bg-blue-50/70 dark:bg-[#14204F]/40 border-blue-200 dark:border-blue-900/40 text-[#1C1B1F] dark:text-[#E6E1E5] mr-4 sm:mr-8 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <MaterialIcon
                        name={msg.role === 'user' ? 'person' : 'auto_awesome'}
                        size={14}
                        className={msg.role === 'user' ? 'text-slate-500' : 'text-[#2563EB] dark:text-blue-300'}
                      />
                      <span>{msg.role === 'user' ? 'You' : 'Gemini Companion'}</span>
                    </span>
                    {msg.createdAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {msg.role === 'model' ? (
                    <FormattedMarkdown content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Multi-Turn Follow-Up Composer */}
        {onFollowUpSubmit && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#79747E] dark:text-[#938F99] flex items-center gap-1.5">
                <MaterialIcon name="chat" size={16} className="text-[#2563EB] dark:text-blue-300" />
                <span>Delve Deeper with Gemini</span>
              </span>
              <span className="text-[11px] text-slate-400">Multi-Turn Session</span>
            </div>

            {/* Quick Inspiration chips for follow-up */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'How can I reframe this constructively?',
                'What boundaries can I set to protect my energy?',
                'What underlying pattern might I be missing?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFollowUpText(suggestion)}
                  className="m3-chip text-[11px] h-7"
                >
                  <MaterialIcon name="lightbulb" size={12} className="text-[#2563EB] dark:text-blue-300" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!followUpText.trim() || isFollowUpLoading) return;
                const text = followUpText.trim();
                setFollowUpText('');
                await onFollowUpSubmit(text);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                disabled={isFollowUpLoading}
                placeholder="Ask a follow-up question or explore this thought further..."
                className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-full bg-slate-50/60 dark:bg-[#070A12]/60 border border-slate-200 dark:border-blue-900/40 text-[#1C1B1F] dark:text-[#E6E1E5] placeholder-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!followUpText.trim() || isFollowUpLoading}
                className="m3-btn m3-btn-filled text-xs sm:text-sm h-10 px-5"
              >
                {isFollowUpLoading ? (
                  <>
                    <MaterialIcon name="refresh" size={16} className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>Reply</span>
                    <MaterialIcon name="send" size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

