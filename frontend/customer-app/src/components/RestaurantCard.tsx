import Link from 'next/link';
import Image from 'next/image';
import { StarIcon, ClockIcon, TruckIcon } from '@heroicons/react/solid';
import type { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const {
    id,
    name,
    cuisineTypes,
    averageRating,
    totalRatings,
    deliveryTime,
    deliveryFee,
    minimumOrder,
    bannerImage,
    logoImage,
    isOpen,
  } = restaurant;

  return (
    <Link href={`/restaurant/${id}`}>
      <div className="card cursor-pointer group">
        {/* Restaurant Banner */}
        <div className="relative h-48 overflow-hidden rounded-t-xl">
          <Image
            src={bannerImage || '/placeholder-restaurant.jpg'}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Restaurant Logo */}
          <div className="absolute bottom-0 left-4 transform translate-y-1/2">
            <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
              <Image
                src={logoImage || '/placeholder-logo.jpg'}
                alt={`${name} logo`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Open/ Closed Badge */}
          <div className="absolute top-4 right-4">
            {isOpen ? (
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Open Now
              </span>
            ) : (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="p-4 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Cuisine Types */}
          <div className="flex flex-wrap gap-1 mb-3">
            {cuisineTypes.slice(0, 3).map((cuisine, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {cuisine}
              </span>
            ))}
            {cuisineTypes.length > 3 && (
              <span className="text-gray-500 text-xs">
                +{cuisineTypes.length - 3} more
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center mb-3">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              ({totalRatings} ratings)
            </span>
          </div>

          {/* Delivery Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{deliveryTime} min</span>
            </div>
            <div className="flex items-center">
              <TruckIcon className="h-4 w-4 mr-1" />
              <span>₹{deliveryFee.toFixed(0)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Min ₹{minimumOrder}
            </div>
          </div>

          {/* Special Offers */}
          {Math.random() > 0.7 && (
            <div className="mt-3 bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-medium">
              20% OFF | Use code FIRST20
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}