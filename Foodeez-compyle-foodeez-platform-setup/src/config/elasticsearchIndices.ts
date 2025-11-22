import { elasticsearchClient } from '@/config/elasticsearch';
import { Restaurant } from '@/models/postgres';
import { MenuItem } from '@/models/mongodb';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'elasticsearch-indices' },
  transports: [
    new winston.transports.File({ filename: 'elasticsearch-error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Elasticsearch index mappings
const RESTAURANT_INDEX_MAPPING = {
  mappings: {
    properties: {
      restaurant_id: { type: 'keyword' },
      name: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple',
          },
        },
      },
      description: {
        type: 'text',
        analyzer: 'standard',
      },
      cuisine_types: {
        type: 'keyword',
      },
      city: {
        type: 'keyword',
        fields: {
          text: { type: 'text' },
        },
      },
      address: {
        type: 'text',
        analyzer: 'standard',
      },
      average_rating: { type: 'float' },
      is_open: { type: 'boolean' },
      minimum_order_value: { type: 'float' },
      location: { type: 'geo_point' },
      tags: { type: 'keyword' },
      price_range: { type: 'keyword' }, // budget, moderate, expensive
      delivery_time: { type: 'integer' }, // in minutes
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
    },
  },
};

const MENU_ITEM_INDEX_MAPPING = {
  mappings: {
    properties: {
      item_id: { type: 'keyword' },
      restaurant_id: { type: 'keyword' },
      restaurant_name: {
        type: 'text',
        analyzer: 'standard',
      },
      name: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple',
          },
        },
      },
      description: {
        type: 'text',
        analyzer: 'standard',
      },
      category: {
        type: 'keyword',
        fields: {
          text: { type: 'text' },
        },
      },
      price: { type: 'float' },
      is_vegetarian: { type: 'boolean' },
      is_vegan: { type: 'boolean' },
      is_available: { type: 'boolean' },
      tags: { type: 'keyword' },
      rating: { type: 'float' },
      review_count: { type: 'integer' },
      ingredients: { type: 'text', analyzer: 'standard' },
      allergens: { type: 'keyword' },
      spice_level: { type: 'keyword' }, // mild, medium, hot
      preparation_time: { type: 'integer' }, // in minutes
      calories: { type: 'integer' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
    },
  },
};

const ORDER_ANALYTICS_INDEX_MAPPING = {
  mappings: {
    properties: {
      order_id: { type: 'keyword' },
      customer_id: { type: 'keyword' },
      restaurant_id: { type: 'keyword' },
      order_status: { type: 'keyword' },
      total_amount: { type: 'float' },
      item_count: { type: 'integer' },
      delivery_time: { type: 'integer' }, // actual delivery time in minutes
      preparation_time: { type: 'integer' }, // actual preparation time in minutes
      order_type: { type: 'keyword' }, // standard, premium
      payment_method: { type: 'keyword' },
      cuisine_types: { type: 'keyword' },
      order_time: { type: 'date' },
      delivered_at: { type: 'date' },
      customer_location: { type: 'geo_point' },
      restaurant_location: { type: 'geo_point' },
      created_at: { type: 'date' },
    },
  },
};

/**
 * Create Elasticsearch indices with proper mappings
 */
export const createIndices = async () => {
  try {
    logger.info('Creating Elasticsearch indices...');

    // Create restaurants index
    const restaurantIndexExists = await elasticsearchClient.indices.exists({
      index: 'restaurants_search',
    });

    if (!restaurantIndexExists) {
      await elasticsearchClient.indices.create({
        index: 'restaurants_search',
        body: RESTAURANT_INDEX_MAPPING,
      });
      logger.info('Created restaurants_search index');
    } else {
      logger.info('restaurants_search index already exists');
    }

    // Create menu items index
    const menuItemIndexExists = await elasticsearchClient.indices.exists({
      index: 'menu_items_search',
    });

    if (!menuItemIndexExists) {
      await elasticsearchClient.indices.create({
        index: 'menu_items_search',
        body: MENU_ITEM_INDEX_MAPPING,
      });
      logger.info('Created menu_items_search index');
    } else {
      logger.info('menu_items_search index already exists');
    }

    // Create order analytics index
    const orderAnalyticsIndexExists = await elasticsearchClient.indices.exists({
      index: 'order_analytics',
    });

    if (!orderAnalyticsIndexExists) {
      await elasticsearchClient.indices.create({
        index: 'order_analytics',
        body: ORDER_ANALYTICS_INDEX_MAPPING,
      });
      logger.info('Created order_analytics index');
    } else {
      logger.info('order_analytics index already exists');
    }

    logger.info('Elasticsearch indices creation completed');
  } catch (error) {
    logger.error('Failed to create Elasticsearch indices:', error);
    throw error;
  }
};

/**
 * Bulk index all restaurants
 */
export const bulkIndexRestaurants = async () => {
  try {
    logger.info('Starting bulk indexing of restaurants...');

    const restaurants = await Restaurant.findAll({
      where: { isActive: true },
    });

    if (restaurants.length === 0) {
      logger.info('No restaurants to index');
      return;
    }

    const body = restaurants.flatMap((restaurant) => [
      {
        index: { _index: 'restaurants_search', _id: restaurant.id },
      },
      {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description || '',
        cuisine_types: restaurant.cuisineTypes || [],
        city: restaurant.city || '',
        address: restaurant.address || '',
        average_rating: restaurant.averageRating || 0,
        is_open: restaurant.isOpen || false,
        minimum_order_value: restaurant.minimumOrderValue || 0,
        location: {
          lat: restaurant.latitude || 0,
          lon: restaurant.longitude || 0,
        },
        tags: restaurant.tags || [],
        price_range: determinePriceRange(restaurant.averageOrderValue || 0),
        delivery_time: restaurant.averageDeliveryTime || 30,
        created_at: restaurant.createdAt,
        updated_at: restaurant.updatedAt,
      },
    ]);

    const response = await elasticsearchClient.bulk({ body });

    if (response.body.errors) {
      logger.error('Errors occurred during bulk indexing of restaurants');
      const erroredDocuments = response.body.items
        .filter((item: any) => item.index.error)
        .map((item: any) => ({
          id: item.index._id,
          error: item.index.error,
        }));
      logger.error('Bulk indexing errors:', erroredDocuments);
    } else {
      logger.info(`Successfully indexed ${restaurants.length} restaurants`);
    }
  } catch (error) {
    logger.error('Failed to bulk index restaurants:', error);
    throw error;
  }
};

/**
 * Bulk index all menu items
 */
export const bulkIndexMenuItems = async () => {
  try {
    logger.info('Starting bulk indexing of menu items...');

    const menuItems = await MenuItem.find({ isAvailable: true });

    if (menuItems.length === 0) {
      logger.info('No menu items to index');
      return;
    }

    // Get restaurant names for better search experience
    const restaurantIds = [...new Set(menuItems.map((item) => item.restaurantId))];
    const restaurants = await Restaurant.findAll({
      where: { id: restaurantIds },
      attributes: ['id', 'name'],
    });

    const restaurantMap = new Map(
      restaurants.map((restaurant) => [restaurant.id, restaurant.name])
    );

    const body = menuItems.flatMap((menuItem) => [
      {
        index: { _index: 'menu_items_search', _id: menuItem._id.toString() },
      },
      {
        item_id: menuItem._id.toString(),
        restaurant_id: menuItem.restaurantId,
        restaurant_name: restaurantMap.get(menuItem.restaurantId) || '',
        name: menuItem.name,
        description: menuItem.description || '',
        category: menuItem.category || '',
        price: menuItem.price,
        is_vegetarian: menuItem.isVegetarian || false,
        is_vegan: menuItem.isVegan || false,
        is_available: menuItem.isAvailable || true,
        tags: menuItem.tags || [],
        rating: menuItem.rating || 0,
        review_count: menuItem.reviewCount || 0,
        ingredients: menuItem.ingredients || [],
        allergens: menuItem.allergens || [],
        spice_level: menuItem.spiceLevel || 'medium',
        preparation_time: menuItem.preparationTime || 15,
        calories: menuItem.calories,
        created_at: menuItem.createdAt,
        updated_at: menuItem.updatedAt,
      },
    ]);

    const response = await elasticsearchClient.bulk({ body });

    if (response.body.errors) {
      logger.error('Errors occurred during bulk indexing of menu items');
      const erroredDocuments = response.body.items
        .filter((item: any) => item.index.error)
        .map((item: any) => ({
          id: item.index._id,
          error: item.index.error,
        }));
      logger.error('Bulk indexing errors:', erroredDocuments);
    } else {
      logger.info(`Successfully indexed ${menuItems.length} menu items`);
    }
  } catch (error) {
    logger.error('Failed to bulk index menu items:', error);
    throw error;
  }
};

/**
 * Rebuild all search indices
 */
export const rebuildAllIndices = async () => {
  try {
    logger.info('Starting rebuild of all search indices...');

    // Delete existing indices
    await deleteIndices();

    // Create new indices with updated mappings
    await createIndices();

    // Index all data
    await bulkIndexRestaurants();
    await bulkIndexMenuItems();

    logger.info('Search indices rebuild completed successfully');
  } catch (error) {
    logger.error('Failed to rebuild search indices:', error);
    throw error;
  }
};

/**
 * Delete search indices
 */
export const deleteIndices = async () => {
  try {
    const indices = ['restaurants_search', 'menu_items_search', 'order_analytics'];

    for (const index of indices) {
      const exists = await elasticsearchClient.indices.exists({ index });
      if (exists) {
        await elasticsearchClient.indices.delete({ index });
        logger.info(`Deleted index: ${index}`);
      }
    }
  } catch (error) {
    logger.error('Failed to delete indices:', error);
    throw error;
  }
};

/**
 * Get index statistics
 */
export const getIndexStats = async () => {
  try {
    const indices = ['restaurants_search', 'menu_items_search', 'order_analytics'];
    const stats: any = {};

    for (const index of indices) {
      const exists = await elasticsearchClient.indices.exists({ index });
      if (exists) {
        const response = await elasticsearchClient.indices.stats({ index });
        stats[index] = {
          doc_count: response.body.indices[index]?.total?.docs?.count || 0,
          store_size: response.body.indices[index]?.total?.store?.size_in_bytes || 0,
        };
      } else {
        stats[index] = { doc_count: 0, store_size: 0 };
      }
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get index stats:', error);
    throw error;
  }
};

/**
 * Optimize indices for better performance
 */
export const optimizeIndices = async () => {
  try {
    logger.info('Optimizing search indices...');

    const indices = ['restaurants_search', 'menu_items_search', 'order_analytics'];

    for (const index of indices) {
      const exists = await elasticsearchClient.indices.exists({ index });
      if (exists) {
        await elasticsearchClient.indices.forcemerge({
          index,
          max_num_segments: 1,
        });
        logger.info(`Optimized index: ${index}`);
      }
    }

    logger.info('Index optimization completed');
  } catch (error) {
    logger.error('Failed to optimize indices:', error);
    throw error;
  }
};

// Helper function to determine price range
function determinePriceRange(averageOrderValue: number): string {
  if (averageOrderValue < 200) return 'budget';
  if (averageOrderValue < 500) return 'moderate';
  return 'expensive';
}

export default {
  createIndices,
  bulkIndexRestaurants,
  bulkIndexMenuItems,
  rebuildAllIndices,
  deleteIndices,
  getIndexStats,
  optimizeIndices,
};