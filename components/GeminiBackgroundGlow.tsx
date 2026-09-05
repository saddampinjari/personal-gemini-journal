'use client';

import React from 'react';
import { motion } from 'motion/react';

export function GeminiBackgroundGlow() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none flex items-center justify-center"
    >
      {/* Primary Gemini Luminous Elliptical Spotlight - Exactly matching Gemini screenshot */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.92, 1, 0.92],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-[120vw] max-w-[1700px] h-[580px] sm:h-[720px] lg:h-[840px] rounded-[100%] blur-[75px] sm:blur-[95px] lg:blur-[120px]
          bg-[radial-gradient(ellipse_70%_45%_at_50%_50%,_rgba(26,44,104,0.95)_0%,_rgba(18,30,76,0.75)_35%,_rgba(10,16,42,0.45)_65%,_transparent_80%)]
          dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_50%,_rgba(28,48,118,0.98)_0%,_rgba(18,30,76,0.80)_35%,_rgba(10,16,42,0.50)_65%,_transparent_85%)]
          will-change-transform"
      />

      {/* Radiant Focal Core - Soft inner sapphire depth */}
      <motion.div
        animate={{
          scale: [0.96, 1.05, 0.96],
          opacity: [0.75, 0.95, 0.75],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-[80vw] max-w-[950px] h-[320px] sm:h-[420px] rounded-[100%] blur-[50px] sm:blur-[70px]
          bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,_rgba(37,99,235,0.40)_0%,_rgba(20,32,79,0.55)_50%,_transparent_75%)]
          dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,_rgba(37,99,235,0.45)_0%,_rgba(20,32,79,0.65)_50%,_transparent_80%)]
          will-change-transform"
      />

      {/* Light Mode Delicate Horizon Ambient Glow */}
      <div className="absolute inset-0 dark:hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,_rgba(219,234,254,0.75)_0%,_rgba(191,219,254,0.40)_40%,_transparent_75%)] pointer-events-none" />
    </div>
  );
}
