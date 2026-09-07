'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    isDemoUser?: boolean;
  } | null;
  onSignOut: () => void;
  onOpenAuth: () => void;
  activeTab?: 'journal' | 'map' | 'inspector';
  onTabChange?: (tab: 'journal' | 'map' | 'inspector') => void;
  scrubCount?: number;
}

const M3_DECELERATE = [0.05, 0.7, 0.1, 1.0] as const;

export function Header({
  user,
  onSignOut,
  onOpenAuth,
  activeTab = 'journal',
  onTabChange,
  scrubCount = 0,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: M3_DECELERATE }}
      className="fixed top-0 left-0 right-0 z-40 w-full bg-white/80 dark:bg-[#14204F]/80 backdrop-blur-xl border-b border-slate-200 dark:border-blue-900/40 transition-colors duration-200"
    >
      <div className="w-full px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.06 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#14204F] to-[#2563EB] text-white shadow-xs shadow-blue-950/20 cursor-pointer shrink-0"
          >
            <MaterialIcon name="auto_awesome" size={20} className="text-white" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-sm sm:text-base lg:text-xl tracking-tight whitespace-nowrap">
                <span className="hidden sm:inline">Personal Gemini </span>Journal
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-[#14204F] text-[#14204F] dark:text-blue-200 border border-blue-200 dark:border-blue-700/60 whitespace-nowrap shrink-0">
                Zero-Trust
              </span>
            </div>
            <p className="hidden lg:block text-[11px] text-[#79747E] dark:text-[#938F99] tracking-normal">
              Private AI Reflection &bull; Google Cloud Run
            </p>
          </div>
        </div>

        {/* View Switcher (Visible when user is authenticated) - M3 Segmented Button Group */}
        {user && onTabChange && (
          <div className="flex items-center bg-slate-100/90 dark:bg-[#070A12]/90 backdrop-blur-md p-1 rounded-full border border-slate-200 dark:border-blue-900/40 shrink-0">
            <button
              onClick={() => onTabChange('journal')}
              title="Workspace"
              className={`flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-white dark:bg-[#14204F] text-[#2563EB] dark:text-blue-300 shadow-xs border border-blue-100 dark:border-blue-700/50'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-white'
              }`}
            >
              <MaterialIcon name="menu_book" size={16} />
              <span className="hidden md:inline">Workspace</span>
            </button>

            <button
              onClick={() => onTabChange('map')}
              title="Map View"
              className={`flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-[#14204F] text-[#2563EB] dark:text-blue-300 shadow-xs border border-blue-100 dark:border-blue-700/50'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-white'
              }`}
            >
              <MaterialIcon name="map" size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">Map View</span>
            </button>

            <button
              onClick={() => onTabChange('inspector')}
              title="Security HUD"
              className={`flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-white dark:bg-[#14204F] text-[#2563EB] dark:text-blue-300 shadow-xs border border-blue-100 dark:border-blue-700/50'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-white'
              }`}
            >
              <MaterialIcon name="verified_user" size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Security HUD</span>
              {scrubCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-[#14204F] text-[#14204F] dark:text-blue-200">
                  {scrubCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Right Section: Status, Theme, Account */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Subtle Live Shield Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway Fortified</span>
          </div>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-blue-900/40">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-100/80 dark:bg-[#070A12]/80 backdrop-blur-md border border-slate-200 dark:border-blue-900/40 text-[#1C1B1F] dark:text-[#E6E1E5] text-xs font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-[#14204F] dark:bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate hidden md:inline">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </span>
                {user.isDemoUser && (
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-[#14204F] text-[#14204F] dark:text-blue-200 text-[10px] font-bold">
                    Demo
                  </span>
                )}
              </motion.div>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign Out"
                className="m3-btn-icon hover:text-rose-600 dark:hover:text-rose-400"
                aria-label="Sign Out"
              >
                <MaterialIcon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <button
              id="header-sign-in-btn"
              onClick={onOpenAuth}
              className="m3-btn m3-btn-filled text-xs h-9 sm:h-10 px-3.5 sm:px-5"
            >
              <MaterialIcon name="person" size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

