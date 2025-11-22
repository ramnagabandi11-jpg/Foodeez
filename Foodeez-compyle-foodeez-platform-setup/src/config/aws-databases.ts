import { Pool } from 'pg';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'foodeez-database-config' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// AWS PostgreSQL (RDS) Configuration
const getPostgresConfig = () => {
  const sslConfig = process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  } : false;

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'foodeez_prod',
    user: process.env.DB_USER || 'foodeez_user',
    password: process.env.DB_PASSWORD || '',
    ssl: sslConfig,
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  };
};

// AWS DocumentDB (MongoDB) Configuration
const getMongoConfig = () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const sslOptions = process.env.NODE_ENV === 'production' ? {
    ssl: true,
    sslValidate: true,
    sslCA: [process.env.DOCUMENTDB_SSL_CA],
    retryWrites: false
  } : {};

  return {
    uri: mongoUri,
    options: {
      maxPoolSize: parseInt(process.env.MONGO_POOL_MAX || '10'),
      minPoolSize: parseInt(process.env.MONGO_POOL_MIN || '2'),
      maxIdleTimeMS: parseInt(process.env.MONGO_IDLE_TIMEOUT || '30000'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SELECTION_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000'),
      bufferMaxEntries: 0,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...sslOptions
    }
  };
};

// AWS ElastiCache (Redis) Configuration
const getRedisConfig = () => {
  const config: any = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
  };

  // Enable TLS for production ElastiCache
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_TLS_ENABLED === 'true') {
    config.tls = {};
    config.port = 6380; // Default TLS port for ElastiCache
  }

  // Cluster mode configuration
  if (process.env.REDIS_CLUSTER_MODE === 'true') {
    config.enableReadyCheck = false;
    config.redisOptions = {
      password: config.password,
      tls: config.tls
    };

    const clusterNodes = process.env.REDIS_CLUSTER_NODES;
    if (clusterNodes) {
      config.clusterNodes = clusterNodes.split(',').map((node: string) => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port) };
      });
    }
  }

  return config;
};

// AWS OpenSearch Service (Elasticsearch) Configuration
const getElasticsearchConfig = () => {
  const host = process.env.ELASTICSEARCH_HOST;
  const port = parseInt(process.env.ELASTICSEARCH_PORT || '443');

  if (!host) {
    throw new Error('ELASTICSEARCH_HOST environment variable is required');
  }

  const node = process.env.NODE_ENV === 'production'
    ? `https://${host}:${port}`
    : `http://${host}:${port}`;

  const auth = process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
    ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    : undefined;

  const ssl = process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    ca: process.env.OPENSEARCH_SSL_CA
  } : undefined;

  return {
    node,
    auth,
    ssl,
    maxRetries: 3,
    requestTimeout: 30000,
    sniffOnStart: true,
    sniffInterval: 300000, // 5 minutes
  };
};

// Connection Pool Management
class DatabaseManager {
  private postgresPool: Pool | null = null;
  private mongoConnection: typeof mongoose | null = null;
  private redisClient: Redis | null = null;
  private elasticsearchClient: ElasticsearchClient | null = null;

  // Initialize PostgreSQL connection
  async initializePostgres() {
    try {
      const config = getPostgresConfig();
      this.postgresPool = new Pool(config);

      // Test connection
      const client = await this.postgresPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.info('✅ PostgreSQL (RDS) connected successfully');
      return this.postgresPool;
    } catch (error) {
      logger.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  // Initialize MongoDB connection
  async initializeMongoDB() {
    try {
      const config = getMongoConfig();
      await mongoose.connect(config.uri, config.options);
      this.mongoConnection = mongoose;

      // Test connection
      await mongoose.connection.db.admin().ping();

      logger.info('✅ MongoDB (DocumentDB) connected successfully');
      return this.mongoConnection;
    } catch (error) {
      logger.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  // Initialize Redis connection
  async initializeRedis() {
    try {
      const config = getRedisConfig();

      if (config.clusterNodes) {
        this.redisClient = new Redis.Cluster(config.clusterNodes, config);
      } else {
        this.redisClient = new Redis(config);
      }

      // Test connection
      await this.redisClient.ping();

      logger.info('✅ Redis (ElastiCache) connected successfully');
      return this.redisClient;
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  // Initialize Elasticsearch connection
  async initializeElasticsearch() {
    try {
      const config = getElasticsearchConfig();
      this.elasticsearchClient = new ElasticsearchClient(config);

      // Test connection
      await this.elasticsearchClient.ping();

      logger.info('✅ Elasticsearch (OpenSearch) connected successfully');
      return this.elasticsearchClient;
    } catch (error) {
      logger.error('❌ Failed to connect to Elasticsearch:', error);
      throw error;
    }
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      postgres: false,
      mongodb: false,
      redis: false,
      elasticsearch: false
    };

    try {
      if (this.postgresPool) {
        const client = await this.postgresPool.connect();
        await client.query('SELECT NOW()');
        client.release();
        health.postgres = true;
      }
    } catch (error) {
      logger.error('PostgreSQL health check failed:', error);
    }

    try {
      if (this.mongoConnection && this.mongoConnection.connection.readyState === 1) {
        await this.mongoConnection.connection.db.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
    }

    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        health.redis = true;
      }
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    try {
      if (this.elasticsearchClient) {
        await this.elasticsearchClient.ping();
        health.elasticsearch = true;
      }
    } catch (error) {
      logger.error('Elasticsearch health check failed:', error);
    }

    return health;
  }

  // Graceful shutdown
  async disconnect() {
    logger.info('🔄 Disconnecting from all databases...');

    try {
      if (this.postgresPool) {
        await this.postgresPool.end();
        logger.info('✅ PostgreSQL disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting PostgreSQL:', error);
    }

    try {
      if (this.mongoConnection) {
        await this.mongoConnection.disconnect();
        logger.info('✅ MongoDB disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error);
    }

    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('✅ Redis disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }

    try {
      if (this.elasticsearchClient) {
        await this.elasticsearchClient.close();
        logger.info('✅ Elasticsearch disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting Elasticsearch:', error);
    }

    logger.info('🔌 All databases disconnected');
  }

  // Getters
  getPostgresPool(): Pool {
    if (!this.postgresPool) {
      throw new Error('PostgreSQL not initialized');
    }
    return this.postgresPool;
  }

  getMongoConnection(): typeof mongoose {
    if (!this.mongoConnection) {
      throw new Error('MongoDB not initialized');
    }
    return this.mongoConnection;
  }

  getRedisClient(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis not initialized');
    }
    return this.redisClient;
  }

  getElasticsearchClient(): ElasticsearchClient {
    if (!this.elasticsearchClient) {
      throw new Error('Elasticsearch not initialized');
    }
    return this.elasticsearchClient;
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();

// Export initialization functions
export const initializeAWSPostgres = () => databaseManager.initializePostgres();
export const initializeAWSMongoDB = () => databaseManager.initializeMongoDB();
export const initializeAWSRedis = () => databaseManager.initializeRedis();
export const initializeAWSElasticsearch = () => databaseManager.initializeElasticsearch();

// Export health check
export const checkDatabaseHealth = () => databaseManager.healthCheck();

// Export disconnect function
export const disconnectDatabases = () => databaseManager.disconnect();

// Export getters
export const getPostgresPool = () => databaseManager.getPostgresPool();
export const getRedisClient = () => databaseManager.getRedisClient();
export const getElasticsearchClient = () => databaseManager.getElasticsearchClient();