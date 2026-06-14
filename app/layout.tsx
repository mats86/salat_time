import type { Metadata, Viewport } from 'next';
import { Libre_Caslon_Text, Inter, Amiri } from 'next/font/google';
import { LangProvider } from '@/components/providers/LangProvider';
import { CacheWarmup } from '@/components/layout/CacheWarmup';
import { ServiceWorkerBootstrap } from '@/components/layout/ServiceWorkerBootstrap';
import './globals.css';

const libreCaslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-libre-caslon',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

export const metadata: Metadata = {
  title: 'Salat Zeit | صلاة',
  description: 'Islamic prayer times and mosque finder',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Salat Zeit',
  },
};

export const viewport: Viewport = {
  themeColor: '#061f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${libreCaslon.variable} ${inter.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="font-body-lg antialiased bg-background text-on-surface"
        suppressHydrationWarning
      >
        <LangProvider>
          <ServiceWorkerBootstrap />
          <CacheWarmup />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
