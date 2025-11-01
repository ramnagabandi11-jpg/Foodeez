import { Request, Response, NextFunction } from 'express';
import * as searchService from '@/services/searchService';
import { IApiResponse } from '@/types';
import { HTTP_STATUS } from '@/utils/constants';

/**
 * GET /search/restaurants
 * Search restaurants
 */
export const searchRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      query,
      city,
      cuisineTypes,
      minRating,
      latitude,
      longitude,
      radiusKm,
      sortBy,
      limit,
      offset,
    } = req.query;

    const { restaurants, total } = await searchService.searchRestaurants({
      query: query as string,
      city: city as string,
      cuisineTypes: cuisineTypes ? (cuisineTypes as string).split(',') : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
      sortBy: sortBy as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    const response: IApiResponse = {
      success: true,
      data: { restaurants, total },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /search/menu-items
 * Search menu items
 */
export const searchMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      query,
      restaurantId,
      category,
      isVegetarian,
      isVegan,
      maxPrice,
      tags,
      limit,
      offset,
    } = req.query;

    const { items, total } = await searchService.searchMenuItems({
      query: query as string,
      restaurantId: restaurantId as string,
      category: category as string,
      isVegetarian: isVegetarian === 'true',
      isVegan: isVegan === 'true',
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    const response: IApiResponse = {
      success: true,
      data: { items, total },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /search/suggestions
 * Get search suggestions
 */
export const getSearchSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, type } = req.query;

    const suggestions = await searchService.getSearchSuggestions(
      query as string,
      type as any
    );

    const response: IApiResponse = {
      success: true,
      data: { suggestions },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  searchRestaurants,
  searchMenuItems,
  getSearchSuggestions,
};
