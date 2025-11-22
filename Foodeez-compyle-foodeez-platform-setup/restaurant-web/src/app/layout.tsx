import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SidebarProvider } from '@/components/providers/SidebarProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Foodeez Restaurant Dashboard',
    template: '%s | Foodeez Restaurant',
  },
  description: 'Restaurant management dashboard for Foodeez - Manage orders, menu, analytics, and grow your business.',
  keywords: [
    'restaurant management',
    'food delivery',
    'restaurant dashboard',
    'Foodeez restaurant',
    'order management',
    'menu management',
    'restaurant analytics',
  ],
  authors: [{ name: 'Foodeez Team' }],
  creator: 'Foodeez',
  publisher: 'Foodeez',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    title: 'Foodeez Restaurant Dashboard',
    description: 'Manage your restaurant business with Foodeez - Complete order management, menu updates, and analytics.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Foodez Restaurant Dashboard',
      },
    ],
    siteName: 'Foodeez Restaurant',
  },
  robots: {
    index: false, // Private dashboard, don't index
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <QueryProvider>
          <AuthProvider>
            <SidebarProvider>
              <div className="admin-layout h-full">
                {children}
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </SidebarProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}