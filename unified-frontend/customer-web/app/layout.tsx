/**
 * Root Layout Component for Foodeez Customer Application
 */

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import { HeadlessUiProvider } from '@/providers/HeadlessUiProvider';
import { Script } from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Foodeez - Food Delivery Platform',
    template: '%s | Foodeez'
  },
  description: 'Order delicious food from your favorite restaurants with Foodeez. Fast delivery, great prices, and amazing restaurants.',
  keywords: ['food delivery', 'restaurant', 'ordering', 'delivery', 'Foodeez'],
  authors: [{ name: 'Foodeez Team' }],
  creator: 'Foodeez',
  publisher: 'Foodeez',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://foodeez.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Foodeez - Food Delivery Platform',
    description: 'Order delicious food from your favorite restaurants',
    url: '/',
    siteName: 'Foodeez',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Foodeez Food Delivery',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foodeez - Food Delivery Platform',
    description: 'Order delicious food from your favorite restaurants',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#ef4444" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ef4444" />

        {/* Critical CSS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS for immediate rendering */
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                font-family: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .loading-skeleton {
                background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
              }
              @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Hotjar */}
        {process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <Script
            id="hotjar"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
                })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
              `,
            }}
          />
        )}

        {/* Providers */}
        <HeadlessUiProvider>
          <QueryProvider>
            <ThemeProvider>
              <LocationProvider>
                <AuthProvider>
                  <CartProvider>
                    <NotificationProvider>
                      {/* Main Content */}
                      <div className="min-h-screen bg-background">
                        {children}
                      </div>

                      {/* Global Toast Container */}
                      <Toaster
                        position="top-right"
                        toastOptions={{
                          duration: 4000,
                          style: {
                            background: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          },
                          success: {
                            iconTheme: {
                              primary: 'hsl(var(--success))',
                              secondary: 'white',
                            },
                          },
                          error: {
                            iconTheme: {
                              primary: 'hsl(var(--destructive))',
                              secondary: 'white',
                            },
                          },
                        }}
                      />
                    </NotificationProvider>
                  </CartProvider>
                </AuthProvider>
              </LocationProvider>
            </ThemeProvider>
          </QueryProvider>
        </HeadlessUiProvider>

        {/* Service Worker Registration */}
        <Script
          id="service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}