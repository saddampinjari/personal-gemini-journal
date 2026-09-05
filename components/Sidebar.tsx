'use client';

import React, { useState, useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: M3_DECELERATE,
    },
  },
};

export interface JournalItem {
  interactionId: string;
  title: string;
  rawPrompt: string;
  sanitizedPrompt: string;
  reflection: string;
  mood: string;
  piiEntitiesCount: number;
  modelUsed: string;
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
  dlpMetadata?: {
    entitiesDetectedCount: number;
    entityTypes: string[];
  };
  secretMetadata?: {
    source: string;
    isCached: boolean;
  };
  resilienceMetadata?: {
    ladderStepsAttempted: number;
  };
}

interface SidebarProps {
  items: JournalItem[];
  selectedId: string | null;
  onSelect: (item: JournalItem) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  items,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rawPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reflection.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMood =
        selectedMood === 'all' || item.mood?.toLowerCase() === selectedMood.toLowerCase();

      return matchesSearch && matchesMood;
    });
  }, [items, searchQuery, selectedMood]);

  const getMoodBadge = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'grateful':
        return { label: 'Grateful', icon: 'favorite', style: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'anxious':
        return { label: 'Anxious', icon: 'waves', style: 'bg-[#FFD8E4] text-[#31111D] dark:bg-[#632034] dark:text-[#FFD8E4]' };
      case 'energized':
        return { label: 'Energized', icon: 'bolt', style: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' };
      case 'peaceful':
        return { label: 'Peaceful', icon: 'spa', style: 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300' };
      case 'thoughtful':
        return { label: 'Thoughtful', icon: 'lightbulb', style: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300' };
      default:
        return { label: 'Reflective', icon: 'psychology', style: 'bg-blue-100 text-[#14204F] dark:bg-[#14204F]/80 dark:text-blue-200' };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <>
      {/* Sidebar Container: Fixed to left on desktop, slide-in drawer on mobile */}
      <aside
        className={`fixed inset-y-0 lg:top-18 lg:bottom-0 left-0 z-50 lg:z-30 flex flex-col w-80 xl:w-84 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-xl border-r border-slate-200 dark:border-blue-900/40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header & Primary Action */}
        <div className="p-5 border-b border-slate-200 dark:border-blue-900/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1C1B1F] dark:text-[#E6E1E5] tracking-tight">
                Journals
              </h2>
              <p className="text-xs text-[#79747E] dark:text-[#938F99]">
                {items.length} {items.length === 1 ? 'Reflection' : 'Reflections'} Recorded
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggle}
                className="lg:hidden m3-btn-icon"
                aria-label="Close Sidebar"
              >
                <MaterialIcon name="chevron_left" size={20} />
              </button>
            </div>
          </div>

          <button
            id="new-reflection-sidebar-btn"
            onClick={onNew}
            className="m3-btn m3-btn-filled w-full h-11 text-xs"
          >
            <MaterialIcon name="add" size={18} className="text-white" />
            <span>New Reflection</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#79747E] dark:text-[#938F99] flex items-center pointer-events-none">
              <MaterialIcon name="search" size={18} />
            </div>
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts, insights..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-slate-100/90 dark:bg-[#14204F]/30 border border-slate-200 dark:border-blue-900/40 text-[#1C1B1F] dark:text-[#E6E1E5] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
            />
          </div>

          {/* Mood Filter Pills - M3 Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'reflective', 'grateful', 'anxious', 'energized', 'thoughtful'].map((mood) => {
              const isSelected = selectedMood === mood;
              return (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`m3-chip ${isSelected ? 'm3-chip-selected' : ''} capitalize whitespace-nowrap`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* Journal Entries List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="flex justify-center mb-2 text-[#79747E] opacity-50">
                <MaterialIcon name="menu_book" size={32} />
              </div>
              <p className="text-sm font-semibold text-[#1C1B1F] dark:text-[#E6E1E5]">
                No reflections found
              </p>
              <p className="text-xs text-[#79747E] dark:text-[#938F99] mt-1">
                {searchQuery ? 'Try a different search query' : 'Click "New Reflection" to begin'}
              </p>
            </div>
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              key={searchQuery + selectedMood}
              className="space-y-2.5"
            >
              {filteredItems.map((item) => {
                const isSelected = selectedId === item.interactionId;
                const badge = getMoodBadge(item.mood);

                return (
                  <motion.div
                    key={item.interactionId}
                    variants={itemVariants}
                    whileHover={{ y: -2, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(item)}
                    className={`group relative p-4 rounded-2xl cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-[#14204F]/50 border-[#2563EB] shadow-xs backdrop-blur-md'
                        : 'bg-white/90 dark:bg-[#0E1528]/80 backdrop-blur-md border-slate-200 dark:border-blue-900/40 hover:border-blue-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Bar: Mood & Date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.style}`}
                      >
                        <MaterialIcon name={badge.icon} size={14} />
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-[11px] text-[#79747E] dark:text-[#938F99]">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-[#1C1B1F] dark:text-[#E6E1E5] line-clamp-1 tracking-tight">
                      {item.title}
                    </h3>

                    {/* Snippet */}
                    <p className="text-xs text-[#49454F] dark:text-[#CAC4D0] line-clamp-2 mt-1 leading-relaxed">
                      {item.rawPrompt}
                    </p>

                    {item.location?.name && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        <MaterialIcon name="place" size={12} />
                        <span className="truncate max-w-[200px]">{item.location.name}</span>
                      </div>
                    )}

                    {/* Bottom Meta & Delete button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-blue-900/40 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-[#2563EB] dark:text-blue-300 font-medium">
                        <MaterialIcon name="shield" size={14} />
                        <span>{item.piiEntitiesCount} PII scrubbed</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.interactionId);
                        }}
                        title="Delete Reflection"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#79747E] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      >
                        <MaterialIcon name="delete" size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}
