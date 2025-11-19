import Image from 'next/image';
import Link from 'next/link';

export function PopularCuisines() {
  const cuisines = [
    {
      id: 'indian',
      name: 'Indian',
      description: 'Authentic Indian flavors',
      image: '/cuisines/indian.jpg',
      restaurantCount: 1250,
    },
    {
      id: 'chinese',
      name: 'Chinese',
      description: 'Szechuan, Cantonese & more',
      image: '/cuisines/chinese.jpg',
      restaurantCount: 890,
    },
    {
      id: 'italian',
      name: 'Italian',
      description: 'Pizza, pasta & more',
      image: '/cuisines/italian.jpg',
      restaurantCount: 645,
    },
    {
      id: 'japanese',
      name: 'Japanese',
      description: 'Sushi, ramen & more',
      image: '/cuisines/japanese.jpg',
      restaurantCount: 432,
    },
    {
      id: 'mexican',
      name: 'Mexican',
      description: 'Tacos, burritos & more',
      image: '/cuisines/mexican.jpg',
      restaurantCount: 378,
    },
    {
      id: 'thai',
      name: 'Thai',
      description: 'Spicy & aromatic dishes',
      image: '/cuisines/thai.jpg',
      restaurantCount: 289,
    },
    {
      id: 'american',
      name: 'American',
      description: 'Burgers, BBQ & more',
      image: '/cuisines/american.jpg',
      restaurantCount: 567,
    },
    {
      id: 'mediterranean',
      name: 'Mediterranean',
      description: 'Healthy & fresh flavors',
      image: '/cuisines/mediterranean.jpg',
      restaurantCount: 234,
    },
  ];

  return (
    <section className="container py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore by Cuisine</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          From local favorites to international delicacies, discover a world of flavors at your fingertips.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cuisines.map((cuisine) => (
          <Link
            key={cuisine.id}
            href={`/restaurants?cuisine=${cuisine.id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-lg shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="aspect-square">
                <Image
                  src={cuisine.image}
                  alt={cuisine.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold text-lg mb-1">{cuisine.name}</h3>
                <p className="text-sm opacity-90 mb-2">{cuisine.description}</p>
                <p className="text-xs opacity-75">
                  {cuisine.restaurantCount.toLocaleString()} restaurants
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href="/restaurants"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          View All Cuisines
        </Link>
      </div>
    </section>
  );
}