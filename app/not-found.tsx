import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDF8FD] dark:bg-[#131318] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#B06000] dark:text-[#FDD663] flex items-center justify-center mb-6 text-2xl font-bold">
        404
      </div>
      <h1 className="text-2xl font-bold text-[#1C1B1F] dark:text-[#E6E1E5] mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-[#49454F] dark:text-[#CAC4D0] max-w-md mb-6 leading-relaxed">
        The requested resource could not be found or has moved to a confidential destination.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-full bg-[#6750A4] text-white font-medium hover:bg-[#523e85] transition-colors shadow-sm text-sm"
      >
        Return to Journal
      </Link>
    </div>
  );
}
