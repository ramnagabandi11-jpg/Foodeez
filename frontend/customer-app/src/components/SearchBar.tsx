import { useState, useEffect as React_useEffect } from 'react';
import { useRouter } from 'next/router';
import { SearchIcon, XIcon } from '@heroicons/react/outline';
import { useDebounce } from '@/hooks/useDebounce';
import type { Restaurant, MenuItem } from '@/types';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showResults?: boolean;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search for restaurants or dishes...',
  onSearch,
  showResults = false,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<{
    restaurants: Restaurant[];
    menuItems: MenuItem[];
  }>({ restaurants: [], menuItems: [] });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults({ restaurants: [], menuItems: [] });
      return;
    }

    setIsLoading(true);
    try {
      // This would make an actual API call
      // const response = await searchAPI.search(searchQuery);
      // setResults(response);

      // Mock results for now
      const mockResults = {
        restaurants: [
          {
            id: '1',
            name: 'Burger Palace',
            cuisine: 'American',
            averageRating: 4.5,
            totalRatings: 234,
            deliveryTime: '25-35',
            deliveryFee: 2.99,
            minimumOrder: 15,
            bannerImage: '/restaurants/burger-palace.jpg',
            logoImage: '/restaurants/burger-palace-logo.jpg',
            isOpen: true,
            address: '',
            city: '',
            latitude: 0,
            longitude: 0,
            description: '',
            cuisineTypes: ['American'],
            openingTime: '',
            closingTime: '',
          },
        ],
        menuItems: [
          {
            id: '1',
            name: 'Classic Burger',
            description: 'Juicy beef patty with lettuce, tomato, and our special sauce',
            price: 12.99,
            category: 'Burgers',
            imageUrl: '/menu-items/classic-burger.jpg',
            isAvailable: true,
            isVegetarian: false,
            spicyLevel: 'none',
            nutritionInfo: {
              calories: 650,
              protein: 35,
              carbs: 45,
              fat: 28,
              fiber: 2,
            },
          },
        ],
      };
      setResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (debouncedQuery) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ restaurants: [], menuItems: [] });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="input pl-10 pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          )}

          {/* No Results */}
          {!isLoading && results.restaurants.length === 0 && results.menuItems.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}

          {/* Restaurant Results */}
          {!isLoading && results.restaurants.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Restaurants</h3>
              <div className="space-y-2">
                {results.restaurants.slice(0, 3).map((restaurant) => (
                  <a
                    key={restaurant.id}
                    href={`/restaurant/${restaurant.id}`}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setIsFocused(false)}
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={restaurant.logoImage || '/placeholder-logo.jpg'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {restaurant.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {restaurant.cuisineTypes.join(', ')} • {restaurant.deliveryTime} min
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      ⭐ {restaurant.averageRating}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Menu Item Results */}
          {!isLoading && results.menuItems.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Dishes</h3>
              <div className="space-y-2">
                {results.menuItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl || '/placeholder-food.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.category}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{item.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View All Results */}
          {!isLoading && (results.restaurants.length > 0 || results.menuItems.length > 0) && (
            <div className="p-4 border-t border-gray-200">
              <a
                href={`/search?q=${encodeURIComponent(query)}`}
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setIsFocused(false)}
              >
                View all results
              </a>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isFocused && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsFocused(false)}
        />
      )}
    </div>
  );
}