'use client';

import React, { useSyncExternalStore } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

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

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('pgj_theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  if (document.documentElement.classList.contains('dark')) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pgj_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pgj_theme', 'light');
    }
    // Dispatch events so all components update immediately
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('pgj-theme-change', { detail: { isDark: nextDark } }));
  };

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className="flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 bg-[#F3F3FA] hover:bg-[#E8E7EF] dark:bg-[#2B2930] dark:hover:bg-[#36343B] text-[#49454F] dark:text-[#E6E1E5]"
      aria-label="Toggle Theme"
      suppressHydrationWarning
    >
      {isDark ? (
        <MaterialIcon name="light_mode" className="text-amber-400" size={22} />
      ) : (
        <MaterialIcon name="dark_mode" className="text-[#6750A4] dark:text-[#D0BCFF]" size={22} />
      )}
    </button>
  );
}


