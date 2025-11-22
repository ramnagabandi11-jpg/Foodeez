/**
 * Layout for Foodeez Restaurant Management Portal
 */

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { RestaurantAuthProvider } from '@/contexts/RestaurantAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { SocketProvider } from '@/contexts/SocketContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Foodeez Restaurant Portal',
    template: '%s | Restaurant Portal'
  },
  description: 'Manage your restaurant with Foodeez Restaurant Portal - Complete dashboard for menu management, orders, analytics, and more.',
  icons: {
    icon: '/favicon.ico',
  },
};

interface RestaurantLayoutProps {
  children: ReactNode;
}

export default function RestaurantLayout({ children }: RestaurantLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <RestaurantAuthProvider>
              <SocketProvider>
                <SidebarProvider>
                  <div className="flex h-screen bg-gray-50">
                    {children}
                  </div>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#1f2937',
                        color: '#fff',
                      },
                    }}
                  />
                </SidebarProvider>
              </SocketProvider>
            </RestaurantAuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}