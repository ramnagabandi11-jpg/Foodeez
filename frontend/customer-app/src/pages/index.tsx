import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { SearchIcon, LocationMarkerIcon } from '@heroicons/react/outline';
import { StarIcon, ClockIcon, FireIcon } from '@heroicons/react/solid';
import Layout from '@/components/Layout';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import type { Restaurant, Category } from '@/types';

interface HomePageProps {
  popularRestaurants: Restaurant[];
  categories: Category[];
}

export default function HomePage({ popularRestaurants, categories }: HomePageProps) {
  const [searchLocation, setSearchLocation] = useState('');

  return (
    <>
      <Head>
        <title>Foodeez - Order Food Online</title>
        <meta name="description" content="Order delicious food from your favorite restaurants" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
                Delicious Food Delivered to Your Doorstep
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Order from the best restaurants in your city
              </p>

              {/* Location Search */}
              <div className="bg-white rounded-lg shadow-lg p-2 flex items-center max-w-md mx-auto">
                <LocationMarkerIcon className="h-5 w-5 text-gray-400 ml-3" />
                <input
                  type="text"
                  placeholder="Enter your delivery location"
                  className="flex-1 px-4 py-3 text-gray-900 focus:outline-none"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
                <button className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors">
                  Find Food
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-gray-600">Choose from a variety of cuisines</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>

        {/* Popular Restaurants */}
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Restaurants</h2>
              <p className="text-gray-600">Top-rated restaurants near you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ClockIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Get your food delivered in under 30 minutes</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FireIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fresh Food</h3>
              <p className="text-gray-600">Prepared fresh just for you</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <StarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Quality</h3>
              <p className="text-gray-600">Only the best restaurants on our platform</p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // This would normally fetch from your API
  const popularRestaurants: Restaurant[] = [
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
    },
    {
      id: '2',
      name: 'Pizza Express',
      cuisine: 'Italian',
      averageRating: 4.3,
      totalRatings: 189,
      deliveryTime: '30-40',
      deliveryFee: 1.99,
      minimumOrder: 20,
      bannerImage: '/restaurants/pizza-express.jpg',
      logoImage: '/restaurants/pizza-express-logo.jpg',
      isOpen: true,
    },
    {
      id: '3',
      name: 'Sushi Master',
      cuisine: 'Japanese',
      averageRating: 4.7,
      totalRatings: 156,
      deliveryTime: '35-45',
      deliveryFee: 3.99,
      minimumOrder: 30,
      bannerImage: '/restaurants/sushi-master.jpg',
      logoImage: '/restaurants/sushi-master-logo.jpg',
      isOpen: false,
    },
  ];

  const categories: Category[] = [
    { id: '1', name: 'Pizza', icon: '🍕', count: 45 },
    { id: '2', name: 'Burger', icon: '🍔', count: 32 },
    { id: '3', name: 'Sushi', icon: '🍱', count: 18 },
    { id: '4', name: 'Indian', icon: '🍛', count: 27 },
    { id: '5', name: 'Chinese', icon: '🥡', count: 21 },
    { id: '6', name: 'Mexican', icon: '🌮', count: 15 },
  ];

  return {
    props: {
      popularRestaurants,
      categories,
    },
    revalidate: 60, // Revalidate every minute
  };
}