import type { Metadata, Viewport } from 'next';
import { Libre_Caslon_Text, Inter, Amiri } from 'next/font/google';
import { LangProvider } from '@/components/providers/LangProvider';
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
    <html lang="de" className={`${libreCaslon.variable} ${inter.variable} ${amiri.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="font-body-lg antialiased bg-background text-on-surface">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
