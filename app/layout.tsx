import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/store/AuthContext';
import { Toaster } from 'react-hot-toast';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'APEX — Workout Tracker',
  description: 'Seu personal trainer inteligente. Treine melhor, evolua mais rápido.',
  manifest: '/manifest.json',
  icons: { apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'APEX Workout Tracker',
    description: 'Plataforma premium de treino e evolução física',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head />
      <body className={`${syne.variable} ${dmSans.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#f4f4f5',
                border: '1px solid #27272a',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
              },
              success: { iconTheme: { primary: '#f97316', secondary: '#18181b' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
