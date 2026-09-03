'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDF8FD] dark:bg-[#131318] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#BA1A1A] dark:text-[#FFB4AB] flex items-center justify-center mb-6 text-2xl font-bold">
        !
      </div>
      <h1 className="text-2xl font-bold text-[#1C1B1F] dark:text-[#E6E1E5] mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-[#49454F] dark:text-[#CAC4D0] max-w-md mb-6 leading-relaxed">
        An unexpected error occurred while rendering this session.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-full bg-[#6750A4] text-white font-medium hover:bg-[#523e85] transition-colors shadow-sm text-sm cursor-pointer"
      >
        Try Again
      </button>
    </div>
  );
}
