import { useState } from 'react';
import Image from 'next/image';
import { Search, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Mumbai, Maharashtra');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const locations = [
    'Mumbai, Maharashtra',
    'Delhi, NCR',
    'Bangalore, Karnataka',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
  ];

  const popularSearches = [
    'Pizza',
    'Biryani',
    'Burger',
    'Chinese',
    'Dosa',
    'Paneer',
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>

      <div className="relative container py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Favorite Food,
                <span className="text-primary-600"> Delivered Fast</span>
              </h1>
              <p className="text-xl text-gray-600">
                Order from thousands of restaurants across India. Fast delivery, great taste, and amazing deals.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Location Selector */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for food or restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Button
                  type="submit"
                  size="md"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Popular Searches */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Popular Searches:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => {
                      setSearchQuery(search);
                      router.push(`/search?q=${encodeURIComponent(search)}`);
                    }}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-gray-900">4.8</span>
                </div>
                <p className="text-sm text-gray-600">Customer Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="text-2xl font-bold text-gray-900">30min</span>
                </div>
                <p className="text-sm text-gray-600">Avg Delivery</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MapPin className="w-5 h-5 text-secondary-600" />
                  <span className="text-2xl font-bold text-gray-900">50+</span>
                </div>
                <p className="text-sm text-gray-600">Cities</p>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative lg:h-96">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl transform rotate-3"></div>
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              <Image
                src="/hero-food.jpg"
                alt="Delicious food delivery"
                width={600}
                height={400}
                className="w-full h-full object-cover"
                priority
              />
              {/* Overlay with badge */}
              <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                <span className="text-sm font-medium text-primary-600">50% OFF</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}