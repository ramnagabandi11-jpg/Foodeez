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
    default: 'Foodeez Admin Dashboard',
    template: '%s | Foodeez Admin',
  },
  description: 'Admin dashboard for Foodeez - Complete platform management for restaurants, customers, deliveries, and operations.',
  keywords: [
    'food delivery admin',
    'restaurant management',
    'delivery management',
    'platform administration',
    'Foodeez admin',
    'business analytics',
  ],
  authors: [{ name: 'Foodeez Team' }],
  creator: 'Foodeez',
  publisher: 'Foodeez',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
    title: 'Foodeez Admin Dashboard',
    description: 'Complete platform management for Foodeez food delivery service.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Foodez Admin Dashboard',
      },
    ],
    siteName: 'Foodeez Admin',
  },
  robots: {
    index: false, // Private admin dashboard, don't index
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