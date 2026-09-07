'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';

export type ThemePreference = 'light' | 'dark' | 'device';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('pgj-theme-change', callback);
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('pgj-theme-change', callback);
    mediaQuery.removeEventListener('change', callback);
  };
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('pgj_theme');
  if (saved === 'light') return 'light';
  if (saved === 'device') return 'device';
  return 'dark'; // Default is dark theme
}

function getResolvedDark(): boolean {
  if (typeof window === 'undefined') return true;
  const pref = getStoredPreference();
  if (pref === 'light') return false;
  if (pref === 'device') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return true; // Default is dark
}

export function ThemeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const preference = useSyncExternalStore(
    subscribe,
    getStoredPreference,
    () => 'dark' as ThemePreference
  );

  const isDark = useSyncExternalStore(
    subscribe,
    getResolvedDark,
    () => true
  );

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Keep DOM class in sync if device system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (getStoredPreference() === 'device') {
        document.documentElement.classList.toggle('dark', e.matches);
        window.dispatchEvent(new CustomEvent('pgj-theme-change', { detail: { isDark: e.matches } }));
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const selectTheme = (newPref: ThemePreference) => {
    localStorage.setItem('pgj_theme', newPref);

    let nextDark = false;
    if (newPref === 'dark') {
      nextDark = true;
      document.documentElement.classList.add('dark');
    } else if (newPref === 'light') {
      nextDark = false;
      document.documentElement.classList.remove('dark');
    } else {
      // Device default
      nextDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', nextDark);
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('pgj-theme-change', { detail: { isDark: nextDark } }));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Single Icon Circle Button - Same Height (h-9 sm:h-10) as Login Button */}
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${preference === 'device' ? 'Device default' : preference === 'dark' ? 'Dark theme' : 'Light theme'}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Toggle theme menu"
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-white/80 dark:bg-[#070A12]/80 border border-slate-200 dark:border-blue-900/50 hover:bg-slate-100/80 dark:hover:bg-[#14204F]/60 text-[#1C1B1F] dark:text-[#E6E1E5] shadow-2xs cursor-pointer shrink-0"
        suppressHydrationWarning
      >
        {isDark ? (
          <MaterialIcon name="dark_mode" size={19} className="text-[#2563EB] dark:text-blue-300" />
        ) : (
          <MaterialIcon name="light_mode" size={19} className="text-amber-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.05, 0.7, 0.1, 1.0] }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[190px] p-1.5 rounded-2xl bg-white/95 dark:bg-[#0E1528]/95 backdrop-blur-xl border border-slate-200 dark:border-blue-900/60 shadow-xl overflow-hidden"
          >
            {/* 1. Light Theme */}
            <button
              type="button"
              onClick={() => selectTheme('light')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                preference === 'light'
                  ? 'bg-blue-50 dark:bg-[#14204F] text-[#2563EB] dark:text-blue-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#14204F]/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MaterialIcon name="light_mode" size={18} className="text-amber-500 shrink-0" />
                <span>Light theme</span>
              </div>
              {preference === 'light' && (
                <MaterialIcon name="check" size={16} className="text-[#2563EB] dark:text-blue-300 shrink-0" />
              )}
            </button>

            {/* 2. Dark Theme */}
            <button
              type="button"
              onClick={() => selectTheme('dark')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                preference === 'dark'
                  ? 'bg-blue-50 dark:bg-[#14204F] text-[#2563EB] dark:text-blue-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#14204F]/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MaterialIcon name="dark_mode" size={18} className="text-[#2563EB] dark:text-blue-300 shrink-0" />
                <span>Dark theme</span>
              </div>
              {preference === 'dark' && (
                <MaterialIcon name="check" size={16} className="text-[#2563EB] dark:text-blue-300 shrink-0" />
              )}
            </button>

            {/* 3. Device Default - Uses Monitor icon (No gemini icon) */}
            <button
              type="button"
              onClick={() => selectTheme('device')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                preference === 'device'
                  ? 'bg-blue-50 dark:bg-[#14204F] text-[#2563EB] dark:text-blue-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#14204F]/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MaterialIcon name="monitor" size={18} className="text-slate-600 dark:text-slate-300 shrink-0" />
                <span>Device default</span>
              </div>
              {preference === 'device' && (
                <MaterialIcon name="check" size={16} className="text-[#2563EB] dark:text-blue-300 shrink-0" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


