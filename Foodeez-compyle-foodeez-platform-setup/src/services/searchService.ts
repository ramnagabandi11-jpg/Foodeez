import { elasticsearchClient } from '@/config/elasticsearch';
import { Restaurant } from '@/models/postgres';
import { MenuItem } from '@/models/mongodb';

/**
 * Index restaurant in Elasticsearch
 */
export const indexRestaurant = async (restaurantId: string): Promise<void> => {
  try {
    const restaurant = await Restaurant.findByPk(restaurantId);

    if (!restaurant) {
      return;
    }

    await elasticsearchClient.index({
      index: 'restaurants_search',
      id: restaurant.id,
      body: {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        cuisine_types: restaurant.cuisineTypes,
        city: restaurant.city,
        address: restaurant.address,
        average_rating: restaurant.averageRating,
        is_open: restaurant.isOpen,
        minimum_order_value: restaurant.minimumOrderValue,
        location: {
          lat: restaurant.latitude,
          lon: restaurant.longitude,
        },
      },
    });

    console.log(`Indexed restaurant: ${restaurant.id}`);
  } catch (error) {
    console.error('Failed to index restaurant:', error);
  }
};

/**
 * Index menu item in Elasticsearch
 */
export const indexMenuItem = async (menuItemId: string): Promise<void> => {
  try {
    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem) {
      return;
    }

    await elasticsearchClient.index({
      index: 'menu_items_search',
      id: menuItem._id.toString(),
      body: {
        item_id: menuItem._id.toString(),
        restaurant_id: menuItem.restaurantId,
        name: menuItem.name,
        description: menuItem.description,
        category: menuItem.category,
        price: menuItem.price,
        is_vegetarian: menuItem.isVegetarian,
        is_vegan: menuItem.isVegan,
        tags: menuItem.tags,
        is_available: menuItem.isAvailable,
        rating: menuItem.rating,
      },
    });

    console.log(`Indexed menu item: ${menuItem._id}`);
  } catch (error) {
    console.error('Failed to index menu item:', error);
  }
};

/**
 * Search restaurants
 */
export const searchRestaurants = async (params: {
  query?: string;
  city?: string;
  cuisineTypes?: string[];
  isVegetarianOnly?: boolean;
  minRating?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'relevance' | 'rating' | 'distance';
  limit?: number;
  offset?: number;
}): Promise<{
  restaurants: any[];
  total: number;
}> => {
  const {
    query,
    city,
    cuisineTypes,
    isVegetarianOnly,
    minRating,
    latitude,
    longitude,
    radiusKm = 10,
    sortBy = 'relevance',
    limit = 20,
    offset = 0,
  } = params;

  const must: any[] = [{ term: { is_open: true } }];
  const filter: any[] = [];

  // Text search
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ['name^3', 'description', 'cuisine_types^2'],
        fuzziness: 'AUTO',
      },
    });
  }

  // City filter
  if (city) {
    filter.push({ term: { city: city.toLowerCase() } });
  }

  // Cuisine filter
  if (cuisineTypes && cuisineTypes.length > 0) {
    filter.push({
      terms: { cuisine_types: cuisineTypes.map((c) => c.toLowerCase()) },
    });
  }

  // Rating filter
  if (minRating) {
    filter.push({ range: { average_rating: { gte: minRating } } });
  }

  // Location-based search
  if (latitude && longitude) {
    filter.push({
      geo_distance: {
        distance: `${radiusKm}km`,
        location: {
          lat: latitude,
          lon: longitude,
        },
      },
    });
  }

  // Sort
  const sort: any[] = [];
  if (sortBy === 'rating') {
    sort.push({ average_rating: { order: 'desc' } });
  } else if (sortBy === 'distance' && latitude && longitude) {
    sort.push({
      _geo_distance: {
        location: {
          lat: latitude,
          lon: longitude,
        },
        order: 'asc',
        unit: 'km',
      },
    });
  }

  try {
    const response = await elasticsearchClient.search({
      index: 'restaurants_search',
      body: {
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
        from: offset,
        size: limit,
      },
    });

    const restaurants = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));

    return {
      restaurants,
      total: response.body.hits.total.value,
    };
  } catch (error) {
    console.error('Restaurant search failed:', error);
    return { restaurants: [], total: 0 };
  }
};

/**
 * Search menu items
 */
export const searchMenuItems = async (params: {
  query?: string;
  restaurantId?: string;
  category?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  maxPrice?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<{
  items: any[];
  total: number;
}> => {
  const {
    query,
    restaurantId,
    category,
    isVegetarian,
    isVegan,
    maxPrice,
    tags,
    limit = 20,
    offset = 0,
  } = params;

  const must: any[] = [{ term: { is_available: true } }];
  const filter: any[] = [];

  // Text search
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ['name^3', 'description', 'tags^2'],
        fuzziness: 'AUTO',
      },
    });
  }

  // Restaurant filter
  if (restaurantId) {
    filter.push({ term: { restaurant_id: restaurantId } });
  }

  // Category filter
  if (category) {
    filter.push({ term: { category: category.toLowerCase() } });
  }

  // Dietary filters
  if (isVegetarian) {
    filter.push({ term: { is_vegetarian: true } });
  }
  if (isVegan) {
    filter.push({ term: { is_vegan: true } });
  }

  // Price filter
  if (maxPrice) {
    filter.push({ range: { price: { lte: maxPrice } } });
  }

  // Tags filter
  if (tags && tags.length > 0) {
    filter.push({
      terms: { tags: tags.map((t) => t.toLowerCase()) },
    });
  }

  try {
    const response = await elasticsearchClient.search({
      index: 'menu_items_search',
      body: {
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort: [{ rating: { order: 'desc' } }, { _score: { order: 'desc' } }],
        from: offset,
        size: limit,
      },
    });

    const items = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));

    return {
      items,
      total: response.body.hits.total.value,
    };
  } catch (error) {
    console.error('Menu item search failed:', error);
    return { items: [], total: 0 };
  }
};

/**
 * Get search suggestions (autocomplete)
 */
export const getSearchSuggestions = async (
  query: string,
  type: 'restaurant' | 'menu_item' = 'restaurant'
): Promise<string[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  const index = type === 'restaurant' ? 'restaurants_search' : 'menu_items_search';
  const field = 'name';

  try {
    const response = await elasticsearchClient.search({
      index,
      body: {
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: field,
              size: 10,
              fuzzy: {
                fuzziness: 'AUTO',
              },
            },
          },
        },
      },
    });

    const suggestions = response.body.suggest.suggestions[0].options.map(
      (option: any) => option.text
    );

    return suggestions;
  } catch (error) {
    console.error('Search suggestions failed:', error);
    return [];
  }
};

export default {
  indexRestaurant,
  indexMenuItem,
  searchRestaurants,
  searchMenuItems,
  getSearchSuggestions,
};
