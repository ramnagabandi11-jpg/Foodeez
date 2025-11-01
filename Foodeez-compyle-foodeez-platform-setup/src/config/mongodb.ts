import mongoose from 'mongoose';
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

export async function initializeMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://root:mongodb@localhost:27017/foodeez?authSource=admin';

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2
    });

    logger.info('MongoDB database connected successfully');
    return mongoose;
  } catch (error) {
    logger.error('Failed to connect to MongoDB database:', error);
    throw error;
  }
}

export async function disconnectMongoDB() {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
}

export default mongoose;
