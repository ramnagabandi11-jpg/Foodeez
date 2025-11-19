import { Hero } from '@/components/home/Hero';
import { FeaturedRestaurants } from '@/components/home/FeaturedRestaurants';
import { PopularCuisines } from '@/components/home/PopularCuisines';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Stats } from '@/components/home/Stats';
import { AppBanner } from '@/components/home/AppBanner';
import { Testimonials } from '@/components/home/Testimonials';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <Hero />
      <FeaturedRestaurants />
      <PopularCuisines />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <AppBanner />
    </div>
  );
}