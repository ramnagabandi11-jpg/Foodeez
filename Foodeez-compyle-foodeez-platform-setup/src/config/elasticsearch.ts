import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  requestTimeout: 5000,
  maxRetries: 3
});

export async function initializeElasticsearch() {
  try {
    const health = await elasticsearchClient.cluster.health();
    logger.info('Elasticsearch connected:', health);

    // Create indices if they don't exist
    await createIndices();

    return elasticsearchClient;
  } catch (error) {
    logger.error('Failed to connect to Elasticsearch:', error);
    throw error;
  }
}

async function createIndices() {
  try {
    // Create restaurants_search index
    const restaurantsIndexExists = await elasticsearchClient.indices.exists({
      index: 'restaurants_search'
    });

    if (!restaurantsIndexExists) {
      await elasticsearchClient.indices.create({
        index: 'restaurants_search',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                autocomplete: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball']
                }
              }
            }
          },
          mappings: {
            properties: {
              restaurant_id: { type: 'keyword' },
              name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                },
                analyzer: 'standard'
              },
              description: { type: 'text' },
              cuisine_types: { type: 'keyword' },
              city: { type: 'keyword' },
              address: { type: 'text' },
              average_rating: { type: 'float' },
              is_open: { type: 'boolean' },
              minimum_order_value: { type: 'float' },
              is_vegetarian_only: { type: 'boolean' },
              location: { type: 'geo_point' },
              popular_items: { type: 'text' },
              tags: { type: 'keyword' }
            }
          }
        }
      });

      logger.info('restaurants_search index created');
    }

    // Create menu_items_search index
    const menuIndexExists = await elasticsearchClient.indices.exists({
      index: 'menu_items_search'
    });

    if (!menuIndexExists) {
      await elasticsearchClient.indices.create({
        index: 'menu_items_search',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          },
          mappings: {
            properties: {
              item_id: { type: 'keyword' },
              restaurant_id: { type: 'keyword' },
              name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: { type: 'text' },
              category: { type: 'keyword' },
              price: { type: 'float' },
              is_vegetarian: { type: 'boolean' },
              is_vegan: { type: 'boolean' },
              tags: { type: 'keyword' },
              is_available: { type: 'boolean' },
              rating: { type: 'float' }
            }
          }
        }
      });

      logger.info('menu_items_search index created');
    }
  } catch (error) {
    logger.error('Failed to create Elasticsearch indices:', error);
    throw error;
  }
}

export async function disconnectElasticsearch() {
  try {
    await elasticsearchClient.close();
    logger.info('Elasticsearch connection closed');
  } catch (error) {
    logger.error('Error closing Elasticsearch connection:', error);
    throw error;
  }
}

export default elasticsearchClient;
