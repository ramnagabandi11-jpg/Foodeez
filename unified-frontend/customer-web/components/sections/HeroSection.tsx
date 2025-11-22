/**
 * Hero Section - Main landing component
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { useRestaurantSearch } from '@/hooks/useRestaurantSearch';
import { motion } from 'framer-motion';

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Address search hook
  const {
    suggestions: locationSuggestions,
    isLoading: isLocationLoading,
    searchLocation,
  } = useAddressSearch();

  // Restaurant search hook
  const {
    searchRestaurants,
    isLoading: isSearchLoading,
  } = useRestaurantSearch();

  // Handle location search
  const handleLocationSearch = useCallback(async (query: string) => {
    if (query.length < 3) return;
    await searchLocation(query);
  }, [searchLocation]);

  // Debounced location search
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocationQuery(query);
    handleLocationSearch(query);
  }, [handleLocationSearch]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: any) => {
    setSelectedLocation(location);
    setLocationQuery(location.display_name);
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!debouncedSearchQuery && !selectedLocation) return;

    const searchParams = new URLSearchParams();
    if (debouncedSearchQuery) {
      searchParams.set('query', debouncedSearchQuery);
    }
    if (selectedLocation) {
      searchParams.set('lat', selectedLocation.lat);
      searchParams.set('lng', selectedLocation.lon);
      searchParams.set('location', selectedLocation.display_name);
    }

    router.push(`/restaurants?${searchParams.toString()}`);
  }, [debouncedSearchQuery, selectedLocation, router]);

  // Auto search when location is selected
  const handleLocationSelected = useCallback((location: any) => {
    handleLocationSelect(location);
    // Auto search with location
    setTimeout(() => handleSearch(), 100);
  }, [handleLocationSelect, handleSearch]);

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/patterns/food-pattern.svg')] bg-repeat" />
      </div>

      <div className="relative container mx-auto px-4 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
              Delicious Food
              <span className="text-primary"> Delivered Fast</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Order from your favorite local restaurants. Fast delivery, great prices, and amazing food experiences.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={handleLocationChange}
                  placeholder="Enter your location"
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />

                {/* Location Suggestions Dropdown */}
                {locationSuggestions.length > 0 && locationQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelected(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="font-medium text-foreground">{suggestion.display_name}</div>
                        {suggestion.address?.city && (
                          <div className="text-sm text-muted-foreground">
                            {suggestion.address.city}, {suggestion.address.state}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for food or restaurants"
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearchLoading || (!searchQuery && !selectedLocation)}
                className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearchLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Search Food
                  </>
                )}
              </button>
            </div>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium">Popular searches:</span>
              <button
                onClick={() => {
                  setSearchQuery('pizza');
                  handleSearch();
                }}
                className="hover:text-primary transition-colors"
              >
                Pizza
              </button>
              <button
                onClick={() => {
                  setSearchQuery('burger');
                  handleSearch();
                }}
                className="hover:text-primary transition-colors"
              >
                Burger
              </button>
              <button
                onClick={() => {
                  setSearchQuery('sushi');
                  handleSearch();
                }}
                className="hover:text-primary transition-colors"
              >
                Sushi
              </button>
              <button
                onClick={() => {
                  setSearchQuery('chinese');
                  handleSearch();
                }}
                className="hover:text-primary transition-colors"
              >
                Chinese
              </button>
              <button
                onClick={() => {
                  setSearchQuery('indian');
                  handleSearch();
                }}
                className="hover:text-primary transition-colors"
              >
                Indian
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                10,000+
              </div>
              <div className="text-muted-foreground">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                50M+
              </div>
              <div className="text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                30 min
              </div>
              <div className="text-muted-foreground">Avg. Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                4.8★
              </div>
              <div className="text-muted-foreground">Customer Rating</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Images */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[url('/images/hero-bg-right.svg')] bg-contain bg-right-top bg-no-repeat" />
      </div>
      <div className="absolute bottom-0 left-0 w-1/3 h-full opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[url('/images/hero-bg-left.svg')] bg-contain bg-left-bottom bg-no-repeat" />
      </div>
    </section>
  );
}