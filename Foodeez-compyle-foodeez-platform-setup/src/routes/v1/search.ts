import { Router } from 'express';
import { query } from 'express-validator';
import * as searchController from '@/controllers/searchController';
import { optionalAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

/**
 * GET /v1/search/restaurants
 * Search restaurants
 */
router.get(
  '/restaurants',
  optionalAuth,
  [
    query('query').optional().isString(),
    query('city').optional().isString(),
    query('cuisineTypes').optional().isString(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('latitude').optional().isFloat(),
    query('longitude').optional().isFloat(),
    query('radiusKm').optional().isFloat({ min: 1, max: 50 }),
    query('sortBy').optional().isIn(['relevance', 'rating', 'distance']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    validate,
  ],
  searchController.searchRestaurants
);

/**
 * GET /v1/search/menu-items
 * Search menu items
 */
router.get(
  '/menu-items',
  optionalAuth,
  [
    query('query').optional().isString(),
    query('restaurantId').optional().isUUID(),
    query('category').optional().isString(),
    query('isVegetarian').optional().isBoolean(),
    query('isVegan').optional().isBoolean(),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('tags').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    validate,
  ],
  searchController.searchMenuItems
);

/**
 * GET /v1/search/suggestions
 * Get search suggestions
 */
router.get(
  '/suggestions',
  [
    query('query').notEmpty().withMessage('Query is required'),
    query('type').optional().isIn(['restaurant', 'menu_item']),
    validate,
  ],
  searchController.getSearchSuggestions
);

export default router;
