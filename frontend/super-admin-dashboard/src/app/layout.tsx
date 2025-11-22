/**
 * Super Admin Dashboard Layout - Complete Platform Management
 */

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { SuperAdminAuthProvider } from '@/contexts/SuperAdminAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Foodeez Super Admin Dashboard',
    template: '%s | Super Admin'
  },
  description: 'Complete management dashboard for Foodeez food delivery platform - System configuration, user management, platform settings',
};

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <SuperAdminAuthProvider>
              <SocketProvider>
                <SidebarProvider>
                  <div className="flex h-screen bg-gray-100">
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
            </SuperAdminAuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}