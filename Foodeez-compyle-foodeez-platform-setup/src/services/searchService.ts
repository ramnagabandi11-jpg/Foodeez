import { elasticsearchClient } from '@/config/elasticsearch';
import { Restaurant } from '@/models/postgres';
import { MenuItem } from '@/models/mongodb';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'search-service' },
  transports: [
    new winston.transports.File({ filename: 'search-error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

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

/**
 * Advanced search with AI-powered recommendations
 */
export const advancedSearch = async (params: {
  query?: string;
  location?: { latitude: number; longitude: number };
  radiusKm?: number;
  filters?: {
    city?: string;
    cuisineTypes?: string[];
    minRating?: number;
    maxPrice?: number;
    priceRange?: string[];
    dietary?: string[]; // vegetarian, vegan, gluten-free
    features?: string[]; // delivery, pickup, reservation
    openNow?: boolean;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}): Promise<{
  results: any[];
  total: number;
  aggregations?: any;
  suggestions?: string[];
}> => {
  const {
    query,
    location,
    radiusKm = 10,
    filters = {},
    sort,
    limit = 20,
    offset = 0,
  } = params;

  try {
    const must: any[] = [];
    const filter: any[] = [];

    // Text search with boosted fields
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            'name^4',
            'description^2',
            'cuisine_types^3',
            'tags^2',
            'address',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'and',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Apply filters
    if (filters.openNow !== undefined) {
      filter.push({ term: { is_open: filters.openNow } });
    }

    if (filters.city) {
      filter.push({ term: { city: filters.city.toLowerCase() } });
    }

    if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
      filter.push({
        terms: { cuisine_types: filters.cuisineTypes.map((c) => c.toLowerCase()) },
      });
    }

    if (filters.minRating) {
      filter.push({ range: { average_rating: { gte: filters.minRating } } });
    }

    if (filters.priceRange && filters.priceRange.length > 0) {
      filter.push({ terms: { price_range: filters.priceRange } });
    }

    // Location-based filtering
    if (location && location.latitude && location.longitude) {
      filter.push({
        geo_distance: {
          distance: `${radiusKm}km`,
          location: {
            lat: location.latitude,
            lon: location.longitude,
          },
        },
      });
    }

    // Sorting
    let sortOptions: any[] = [
      { _score: { order: 'desc' } }, // Default relevance sort
    ];

    if (sort) {
      sortOptions.unshift({
        [sort.field]: { order: sort.order },
      });
    } else if (location && location.latitude && location.longitude) {
      // Sort by distance if location is provided
      sortOptions.unshift({
        _geo_distance: {
          location: {
            lat: location.latitude,
            lon: location.longitude,
          },
          order: 'asc',
          unit: 'km',
        },
      });
    }

    // Aggregations for filters
    const aggs: any = {
      cuisine_types: {
        terms: { field: 'cuisine_types', size: 20 },
      },
      price_ranges: {
        terms: { field: 'price_range', size: 5 },
      },
      rating_ranges: {
        range: {
          field: 'average_rating',
          ranges: [
            { key: '4+', to: 5 },
            { key: '3+', to: 4 },
            { key: '2+', to: 3 },
            { key: '1+', to: 2 },
          ],
        },
      },
    };

    const searchBody: any = {
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort: sortOptions,
      from: offset,
      size: limit,
      aggs,
    };

    const response = await elasticsearchClient.search({
      index: 'restaurants_search',
      body: searchBody,
    });

    const results = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      distance: hit.sort && hit.sort.length > 1 ? hit.sort[hit.sort.length - 1] : null,
      ...hit._source,
    }));

    // Process aggregations
    const aggregations = {
      cuisineTypes: response.body.aggregations.cuisine_types.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
      })),
      priceRanges: response.body.aggregations.price_ranges.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
      })),
      ratingRanges: response.body.aggregations.rating_ranges.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
      })),
    };

    // Get search suggestions
    const suggestions = query ? await getSearchSuggestions(query, 'restaurant') : [];

    return {
      results,
      total: response.body.hits.total.value,
      aggregations,
      suggestions,
    };
  } catch (error) {
    logger.error('Advanced search failed:', error);
    return { results: [], total: 0 };
  }
};

/**
 * Trending restaurants based on recent orders and ratings
 */
export const getTrendingRestaurants = async (params: {
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
}): Promise<any[]> => {
  const { city, latitude, longitude, radiusKm = 15, limit = 10 } = params;

  try {
    const filter: any[] = [{ term: { is_open: true } }];

    if (city) {
      filter.push({ term: { city: city.toLowerCase() } });
    }

    if (latitude && longitude) {
      filter.push({
        geo_distance: {
          distance: `${radiusKm}km`,
          location: { lat: latitude, lon: longitude },
        },
      });
    }

    const response = await elasticsearchClient.search({
      index: 'restaurants_search',
      body: {
        query: {
          bool: {
            filter,
            must: [
              {
                function_score: {
                  query: { match_all: {} },
                  functions: [
                    {
                      gauss: {
                        average_rating: {
                          origin: 5,
                          scale: 1,
                          offset: 3,
                        },
                      },
                    },
                    {
                      gauss: {
                        updated_at: {
                          origin: 'now',
                          scale: '30d',
                          offset: '7d',
                        },
                      },
                    },
                  ],
                  score_mode: 'multiply',
                  boost_mode: 'replace',
                },
              },
            ],
          },
        },
        sort: [
          { _score: { order: 'desc' } },
          { average_rating: { order: 'desc' } },
        ],
        size: limit,
      },
    });

    return response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));
  } catch (error) {
    logger.error('Failed to get trending restaurants:', error);
    return [];
  }
};

/**
 * Personalized recommendations based on user preferences
 */
export const getPersonalizedRecommendations = async (params: {
  customerId: string;
  location?: { latitude: number; longitude: number };
  limit?: number;
}): Promise<any[]> => {
  const { customerId, location, limit = 10 } = params;

  try {
    // In a real implementation, this would use user's order history,
    // preferences, and behavior to generate recommendations

    // For now, we'll use a simplified approach based on popular items
    const filter: any[] = [{ term: { is_open: true } }];

    if (location && location.latitude && location.longitude) {
      filter.push({
        geo_distance: {
          distance: '20km',
          location: { lat: location.latitude, lon: location.longitude },
        },
      });
    }

    const response = await elasticsearchClient.search({
      index: 'restaurants_search',
      body: {
        query: {
          bool: {
            filter,
            must: [
              {
                function_score: {
                  query: { match_all: {} },
                  functions: [
                    {
                      field_value_factor: {
                        field: 'average_rating',
                        modifier: 'log1p',
                        factor: 2,
                      },
                    },
                    {
                      random_score: {
                        seed: customerId,
                      },
                    },
                  ],
                  score_mode: 'multiply',
                  boost_mode: 'replace',
                },
              },
            ],
          },
        },
        sort: [{ _score: { order: 'desc' } }],
        size: limit,
      },
    });

    return response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));
  } catch (error) {
    logger.error('Failed to get personalized recommendations:', error);
    return [];
  }
};

/**
 * Search analytics and insights
 */
export const getSearchAnalytics = async (params: {
  startDate?: Date;
  endDate?: Date;
  city?: string;
}): Promise<any> => {
  const { startDate, endDate, city } = params;

  try {
    const boolQuery: any = {};

    if (startDate || endDate) {
      boolQuery.must = [];
      if (startDate) {
        boolQuery.must.push({ range: { created_at: { gte: startDate } } });
      }
      if (endDate) {
        boolQuery.must.push({ range: { created_at: { lte: endDate } } });
      }
    }

    if (city) {
      boolQuery.filter = [{ term: { city: city.toLowerCase() } }];
    }

    const query = Object.keys(boolQuery).length > 0 ? { bool: boolQuery } : { match_all: {} };

    const response = await elasticsearchClient.search({
      index: 'restaurants_search',
      body: {
        query,
        aggs: {
          popular_cuisines: {
            terms: { field: 'cuisine_types', size: 10 },
          },
          price_distribution: {
            terms: { field: 'price_range', size: 5 },
          },
          rating_distribution: {
            range: {
              field: 'average_rating',
              ranges: [
                { key: 'excellent', to: 5 },
                { key: 'good', to: 4 },
                { key: 'average', to: 3 },
                { key: 'below_average', to: 2 },
              ],
            },
          },
          total_restaurants: {
            value_count: { field: 'restaurant_id' },
          },
        },
        size: 0,
      },
    });

    return {
      totalRestaurants: response.body.aggregations.total_restaurants.value,
      popularCuisines: response.body.aggregations.popular_cuisines.buckets,
      priceDistribution: response.body.aggregations.price_distribution.buckets,
      ratingDistribution: response.body.aggregations.rating_distribution.buckets,
    };
  } catch (error) {
    logger.error('Failed to get search analytics:', error);
    return {};
  }
};

export default {
  indexRestaurant,
  indexMenuItem,
  searchRestaurants,
  searchMenuItems,
  getSearchSuggestions,
  advancedSearch,
  getTrendingRestaurants,
  getPersonalizedRecommendations,
  getSearchAnalytics,
};
