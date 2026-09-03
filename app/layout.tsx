import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Gemini Journal',
  description: 'Enterprise Zero-Trust AI Journal featuring a client-side de-identification Privacy Gateway, Secret Manager integration, and resilient Gemini model fallback ladder deployed on Google Cloud Run.',
  openGraph: {
    title: 'Personal Gemini Journal',
    description: 'Enterprise Zero-Trust AI Journal featuring a client-side de-identification Privacy Gateway, Secret Manager integration, and resilient Gemini model fallback ladder deployed on Google Cloud Run.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Gemini Journal',
    description: 'Enterprise Zero-Trust AI Journal featuring a client-side de-identification Privacy Gateway, Secret Manager integration, and resilient Gemini model fallback ladder deployed on Google Cloud Run.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('pgj_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen font-sans selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:bg-indigo-400/30 dark:selection:text-indigo-100">
        {children}
      </body>
    </html>
  );
}
