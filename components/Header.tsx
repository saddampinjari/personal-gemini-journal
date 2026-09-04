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
      className="fixed top-0 left-0 right-0 z-40 w-full bg-white/90 dark:bg-[#19171D]/90 backdrop-blur-md border-b border-[#E8E4EE] dark:border-[#36343B] transition-colors duration-200"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.06 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6750A4] to-[#795BBD] text-white shadow-xs shadow-purple-900/10 cursor-pointer"
          >
            <MaterialIcon name="auto_awesome" size={22} className="text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-[#1C1B1F] dark:text-[#E6E1E5] text-lg sm:text-xl tracking-tight">
                Personal Gemini Journal
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EADDFF] dark:bg-[#381E72]/70 text-[#21005D] dark:text-[#EADDFF]">
                Zero-Trust
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-[#79747E] dark:text-[#938F99] tracking-normal">
              Private AI Reflection &bull; Google Cloud Run
            </p>
          </div>
        </div>

        {/* View Switcher (Visible when user is authenticated) */}
        {user && onTabChange && (
          <div className="flex items-center bg-[#F5F2F9] dark:bg-[#232128] p-1 rounded-full border border-[#E8E4EE] dark:border-[#36343B]">
            <button
              onClick={() => onTabChange('journal')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-white dark:bg-[#322F37] text-[#6750A4] dark:text-[#D0BCFF] shadow-xs'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-white'
              }`}
            >
              <MaterialIcon name="menu_book" size={16} />
              <span>Workspace</span>
            </button>

            <button
              onClick={() => onTabChange('map')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-[#322F37] text-[#6750A4] dark:text-[#D0BCFF] shadow-xs'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-white'
              }`}
            >
              <MaterialIcon name="map" size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Map View</span>
            </button>

            <button
              onClick={() => onTabChange('inspector')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-white dark:bg-[#322F37] text-[#6750A4] dark:text-[#D0BCFF] shadow-xs'
                  : 'text-[#49454F] dark:text-[#CAC4D0] hover:text-[#1C1B1F] dark:hover:text-white'
              }`}
            >
              <MaterialIcon name="verified_user" size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Security HUD</span>
              {scrubCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF]">
                  {scrubCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Right Section: Status, Theme, Account */}
        <div className="flex items-center gap-3">
          {/* Subtle Live Shield Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway Fortified</span>
          </div>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E8E4EE] dark:border-[#36343B]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F2F9] dark:bg-[#232128] border border-[#E8E4EE] dark:border-[#36343B] text-[#1C1B1F] dark:text-[#E6E1E5] text-xs font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-[#6750A4] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </span>
                {user.isDemoUser && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] text-[10px] font-bold">
                    Demo
                  </span>
                )}
              </motion.div>

              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-full hover:bg-[#F5F2F9] dark:hover:bg-[#232128] text-[#49454F] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                aria-label="Sign Out"
              >
                <MaterialIcon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="header-sign-in-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#6750A4] hover:bg-[#563E93] text-white shadow-xs transition-colors cursor-pointer"
            >
              <MaterialIcon name="person" size={18} />
              <span>Sign In</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

