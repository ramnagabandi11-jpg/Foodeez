/**
 * Home Page - Foodeez Customer Application
 */

import { Suspense } from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturedRestaurants } from '@/components/sections/FeaturedRestaurants';
import { PopularCuisines } from '@/components/sections/PopularCuisines';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Testimonials } from '@/components/sections/Testimonials';
import { AppDownload } from '@/components/sections/AppDownload';
import { Newsletter } from '@/components/sections/Newsletter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SEO } from '@/components/SEO';

export default function HomePage() {
  return (
    <>
      <SEO
        title="Order Food Online - Delivery from Local Restaurants"
        description="Discover and order from the best local restaurants. Fast delivery, exclusive deals, and amazing food with Foodeez."
        keywords="food delivery, order food online, restaurant delivery, local restaurants"
      />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative">
          <Suspense fallback={<LoadingSpinner />}>
            <HeroSection />
          </Suspense>
        </section>

        {/* Featured Restaurants */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <FeaturedRestaurants />
            </Suspense>
          </div>
        </section>

        {/* Popular Cuisines */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <PopularCuisines />
            </Suspense>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <HowItWorks />
            </Suspense>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <Testimonials />
            </Suspense>
          </div>
        </section>

        {/* App Download */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <AppDownload />
            </Suspense>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <Suspense fallback={<LoadingSpinner />}>
              <Newsletter />
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}