import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { createApp } from '../src/app';

// Load environment variables
dotenv.config();

// Create Express app
const app = createApp();

// Export for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Handle the request with Express app
    app(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}