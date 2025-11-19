import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, MapPin, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Restaurant } from '@/lib/api';
import { restaurantAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { cartUtils } from '@/store/cartStore';

export function FeaturedRestaurants() {
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['featured-restaurants'],
    queryFn: async () => {
      const response = await restaurantAPI.listRestaurants({
        limit: 12,
        sortBy: 'rating',
      });
      return response.data;
    },
  });

  const categories = [
    { id: 'all', name: 'All', count: 0 },
    { id: 'indian', name: 'Indian', count: 0 },
    { id: 'chinese', name: 'Chinese', count: 0 },
    { id: 'italian', name: 'Italian', count: 0 },
    { id: 'japanese', name: 'Japanese', count: 0 },
    { id: 'mexican', name: 'Mexican', count: 0 },
  ];

  const filteredRestaurants = restaurants?.filter((restaurant) => {
    if (activeCategory === 'all') return true;
    return restaurant.cuisineType.some((cuisine) =>
      cuisine.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }) || [];

  if (isLoading) {
    return (
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Restaurants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Restaurants</h2>
          <p className="text-gray-600">Unable to load restaurants at this time.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Restaurants</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover top-rated restaurants in your area. From local favorites to international cuisines.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No restaurants found in this category.</p>
        </div>
      )}

      {/* View All Button */}
      <div className="text-center mt-12">
        <Button asChild>
          <Link href="/restaurants">View All Restaurants</Link>
        </Button>
      </div>
    </section>
  );
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { addItem } = useCartStore.getState();

  return (
    <div className="group card overflow-hidden hover:shadow-medium transition-all duration-300">
      <Link href={`/restaurants/${restaurant.id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={restaurant.imageUrl || '/restaurant-placeholder.jpg'}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {restaurant.isAvailableNow ? (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Open Now
            </div>
          ) : (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Closed
            </div>
          )}
          {restaurant.rating >= 4.5 && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-medium">
              Top Rated
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/restaurants/${restaurant.id}`}>
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">
            {restaurant.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 mb-3 text-ellipsis-2">
          {restaurant.description}
        </p>

        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
            <span className="text-gray-400">({restaurant.ratingCount})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{restaurant.avgDeliveryTime}min</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <IndianRupee className="w-4 h-4" />
            <span>{restaurant.deliveryFee} delivery</span>
          </div>
          <div className="text-sm text-gray-600">
            Min. {cartUtils.formatPrice(restaurant.minimumOrderAmount)}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {restaurant.cuisineType.slice(0, 3).map((cuisine) => (
            <span
              key={cuisine}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {cuisine}
            </span>
          ))}
          {restaurant.cuisineType.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{restaurant.cuisineType.length - 3} more
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full"
          disabled={!restaurant.isAvailableNow}
          onClick={() => {
            // Add a sample item to cart (in real app, would navigate to restaurant page)
            const sampleItem = {
              id: `sample-${restaurant.id}`,
              restaurantId: restaurant.id,
              name: 'Sample Item',
              description: 'Sample description',
              price: 299,
              isAvailable: restaurant.isAvailableNow,
              isVeg: true,
              preparationTime: 20,
              spiceLevel: 'medium' as const,
              allergens: [],
              nutritionInfo: { calories: 250, protein: 12, carbs: 30, fat: 8 },
            };
            addItem(sampleItem, 1);
          }}
        >
          {restaurant.isAvailableNow ? 'Quick Add' : 'Currently Closed'}
        </Button>
      </div>
    </div>
  );
}