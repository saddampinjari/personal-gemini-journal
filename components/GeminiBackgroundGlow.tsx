'use client';

import React from 'react';
import { motion } from 'motion/react';

export function GeminiBackgroundGlow() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Primary Center Gemini Luminous Halo */}
      <div className="absolute top-[28%] sm:top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] lg:w-[1100px] h-[500px] sm:h-[650px] lg:h-[800px] flex items-center justify-center">
        {/* Outer Atmospheric Aura - Soft Expansion */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.75, 0.95, 0.75],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-[90px] sm:blur-[130px] lg:blur-[160px] opacity-70 dark:opacity-60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D0BCFF]/60 via-[#EADDFF]/40 via-[#6750A4]/15 to-transparent dark:from-[#6750A4]/40 dark:via-[#4F378B]/25 dark:via-[#381E72]/15 dark:to-transparent will-change-transform"
        />

        {/* Secondary Core Chromatic Bloom - Theme Purple with Google AI subtle tones */}
        <motion.div
          animate={{
            scale: [1.05, 0.96, 1.05],
            rotate: [0, 45, 90, 180, 270, 360],
            opacity: [0.6, 0.85, 0.6],
          }}
          transition={{
            scale: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute w-[420px] sm:w-[580px] lg:w-[720px] h-[340px] sm:h-[460px] lg:h-[560px] rounded-full blur-[70px] sm:blur-[95px] opacity-65 dark:opacity-55 bg-gradient-to-tr from-[#6750A4]/35 via-[#7C4DFF]/25 via-[#4285F4]/15 to-[#FFD8E4]/20 dark:from-[#8A50E2]/45 dark:via-[#6750A4]/35 dark:via-[#4285F4]/20 dark:to-[#EADDFF]/15 will-change-transform"
        />

        {/* Dense Radiant Focal Core - Soft radiant bloom in theme color */}
        <motion.div
          animate={{
            scale: [0.95, 1.12, 0.95],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-[240px] sm:w-[320px] lg:w-[400px] h-[180px] sm:h-[240px] lg:h-[300px] rounded-full blur-[45px] sm:blur-[60px] opacity-80 dark:opacity-75 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#8A50E2]/40 via-[#6750A4]/25 to-transparent dark:from-[#D0BCFF]/35 dark:via-[#8A50E2]/30 dark:to-transparent will-change-transform"
        />
      </div>

      {/* Subtle Secondary Ambient Gradient in Lower Viewport for continuity */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[350px] sm:h-[450px] rounded-full blur-[120px] opacity-35 dark:opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D0BCFF]/40 via-[#6750A4]/15 to-transparent dark:from-[#4F378B]/30 dark:via-[#381E72]/15 dark:to-transparent pointer-events-none" />
    </div>
  );
}
