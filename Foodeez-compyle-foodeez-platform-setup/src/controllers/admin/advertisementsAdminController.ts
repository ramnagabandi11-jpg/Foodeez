import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { Op } from 'sequelize';

// Since we don't have Advertisement models in the database schema, I'll create simple in-memory storage
// In a real production system, this would be proper database models with Sequelize

interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'banner' | 'popup' | 'restaurant_spotlight' | 'promo_banner';
  targetAudience: 'all' | 'customers' | 'restaurants' | 'delivery_partners';
  targeting: {
    location?: string[];
    ageRange?: { min: number; max: number };
    userSegments?: string[];
    restaurantCategories?: string[];
  };
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number; // 1-10, higher = more priority
  ctaText?: string;
  ctaLink?: string;
  clickCount: number;
  impressionCount: number;
  budget?: number;
  spentAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// In-memory storage (in production, this would be database tables)
let advertisements: Advertisement[] = [];
let adIdCounter = 1;

// Helper functions
function generateAdId(): string {
  return `ad-${String(adIdCounter++).padStart(4, '0')}`;
}

// GET /v1/admin/advertisements - List all advertisements
export const listAdvertisements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, targetAudience, page = 1, limit = 20 } = req.query;

    let filteredAds = advertisements;

    // Apply filters
    if (status === 'active') {
      filteredAds = filteredAds.filter(ad => ad.isActive);
    } else if (status === 'inactive') {
      filteredAds = filteredAds.filter(ad => !ad.isActive);
    }

    if (type) {
      filteredAds = filteredAds.filter(ad => ad.type === type);
    }

    if (targetAudience) {
      filteredAds = filteredAds.filter(ad => ad.targetAudience === targetAudience);
    }

    // Sort by priority (high to low), then by creation date (newest first)
    filteredAds.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedAds = filteredAds.slice(offset, offset + Number(limit));

    res.status(200).json({
      success: true,
      data: {
        advertisements: paginatedAds,
        pagination: {
          total: filteredAds.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(filteredAds.length / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /v1/admin/advertisements - Create new advertisement
export const createAdvertisement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      imageUrl,
      type,
      targetAudience,
      targeting,
      startDate,
      endDate,
      isActive = true,
      priority = 5,
      ctaText,
      ctaLink,
      budget,
    } = req.body;

    // Validate type
    const validTypes = ['banner', 'popup', 'restaurant_spotlight', 'promo_banner'];
    if (!validTypes.includes(type)) {
      throw new AppError('Invalid advertisement type', 400);
    }

    // Validate target audience
    const validAudiences = ['all', 'customers', 'restaurants', 'delivery_partners'];
    if (!validAudiences.includes(targetAudience)) {
      throw new AppError('Invalid target audience', 400);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      throw new AppError('End date must be after start date', 400);
    }

    // Validate priority
    if (priority < 1 || priority > 10) {
      throw new AppError('Priority must be between 1 and 10', 400);
    }

    const newAd: Advertisement = {
      id: generateAdId(),
      title,
      description,
      imageUrl,
      type,
      targetAudience,
      targeting: targeting || {},
      startDate: start,
      endDate: end,
      isActive,
      priority,
      ctaText,
      ctaLink,
      clickCount: 0,
      impressionCount: 0,
      budget,
      spentAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.id || 'system',
    };

    advertisements.push(newAd);

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: { advertisement: newAd },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /v1/admin/advertisements/:id - Update advertisement
export const updateAdvertisement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const adIndex = advertisements.findIndex(ad => ad.id === id);
    if (adIndex === -1) {
      throw new AppError('Advertisement not found', 404);
    }

    const ad = advertisements[adIndex];

    // Update allowed fields
    const allowedFields = [
      'title', 'description', 'imageUrl', 'type', 'targetAudience', 'targeting',
      'startDate', 'endDate', 'isActive', 'priority', 'ctaText', 'ctaLink', 'budget'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        (ad as any)[field] = field === 'startDate' || field === 'endDate'
          ? new Date(updateData[field])
          : updateData[field];
      }
    });

    ad.updatedAt = new Date();

    advertisements[adIndex] = ad;

    res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      data: { advertisement: ad },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/advertisements/:id/stats - Get advertisement statistics
export const getAdvertisementStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const advertisement = advertisements.find(ad => ad.id === id);
    if (!advertisement) {
      throw new AppError('Advertisement not found', 404);
    }

    // Calculate click-through rate (CTR)
    const ctr = advertisement.impressionCount > 0
      ? (advertisement.clickCount / advertisement.impressionCount) * 100
      : 0;

    // Calculate cost per click (CPC)
    const cpc = advertisement.clickCount > 0 && advertisement.spentAmount
      ? advertisement.spentAmount / advertisement.clickCount
      : 0;

    // Calculate cost per impression (CPM)
    const cpm = advertisement.impressionCount > 0 && advertisement.spentAmount
      ? (advertisement.spentAmount / advertisement.impressionCount) * 1000
      : 0;

    // Calculate budget utilization
    const budgetUtilization = advertisement.budget
      ? (advertisement.spentAmount || 0) / advertisement.budget * 100
      : 0;

    // Check if ad is currently active
    const now = new Date();
    const isCurrentlyActive = advertisement.isActive &&
      now >= advertisement.startDate &&
      now <= advertisement.endDate;

    res.status(200).json({
      success: true,
      data: {
        advertisement: {
          id: advertisement.id,
          title: advertisement.title,
          type: advertisement.type,
          targetAudience: advertisement.targetAudience,
        },
        performance: {
          impressions: advertisement.impressionCount,
          clicks: advertisement.clickCount,
          ctr: Math.round(ctr * 100) / 100,
          budget: advertisement.budget,
          spentAmount: advertisement.spentAmount || 0,
          budgetUtilization: Math.round(budgetUtilization * 100) / 100,
          cpc: Math.round(cpc * 100) / 100,
          cpm: Math.round(cpm * 100) / 100,
        },
        status: {
          isActive: advertisement.isActive,
          isCurrentlyActive,
          startDate: advertisement.startDate,
          endDate: advertisement.endDate,
          daysRemaining: Math.ceil((advertisement.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /v1/admin/advertisements/overview - Advertisement overview dashboard
export const getAdvertisementOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    let filteredAds = advertisements;

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Include ads that were active during the period
      filteredAds = filteredAds.filter(ad =>
        (ad.startDate >= start && ad.startDate <= end) || // Started during period
        (ad.endDate >= start && ad.endDate <= end) ||     // Ended during period
        (ad.startDate <= start && ad.endDate >= end)      // Was active throughout period
      );
    }

    // Calculate overview statistics
    const totalAds = filteredAds.length;
    const activeAds = filteredAds.filter(ad => ad.isActive).length;
    const inactiveAds = totalAds - activeAds;

    // Total impressions and clicks
    const totalImpressions = filteredAds.reduce((sum, ad) => sum + ad.impressionCount, 0);
    const totalClicks = filteredAds.reduce((sum, ad) => sum + ad.clickCount, 0);

    // Average CTR
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Type breakdown
    const typeBreakdown: any = {};
    ['banner', 'popup', 'restaurant_spotlight', 'promo_banner'].forEach(type => {
      const adsOfType = filteredAds.filter(ad => ad.type === type);
      typeBreakdown[type] = {
        count: adsOfType.length,
        impressions: adsOfType.reduce((sum, ad) => sum + ad.impressionCount, 0),
        clicks: adsOfType.reduce((sum, ad) => sum + ad.clickCount, 0),
      };
    });

    // Target audience breakdown
    const audienceBreakdown: any = {};
    ['all', 'customers', 'restaurants', 'delivery_partners'].forEach(audience => {
      const adsOfAudience = filteredAds.filter(ad => ad.targetAudience === audience);
      audienceBreakdown[audience] = adsOfAudience.length;
    });

    // Budget information
    const totalBudget = filteredAds
      .filter(ad => ad.budget)
      .reduce((sum, ad) => sum + (ad.budget || 0), 0);
    const totalSpent = filteredAds
      .filter(ad => ad.spentAmount)
      .reduce((sum, ad) => sum + (ad.spentAmount || 0), 0);

    // Top performing ads (by CTR)
    const adsWithCtr = filteredAds
      .filter(ad => ad.impressionCount > 0)
      .map(ad => ({
        id: ad.id,
        title: ad.title,
        type: ad.type,
        ctr: (ad.clickCount / ad.impressionCount) * 100,
        impressions: ad.impressionCount,
        clicks: ad.clickCount,
      }))
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        overview: {
          totalAds,
          activeAds,
          inactiveAds,
          totalImpressions,
          totalClicks,
          avgCtr: Math.round(avgCtr * 100) / 100,
        },
        breakdown: {
          byType: typeBreakdown,
          byTargetAudience: audienceBreakdown,
        },
        budget: {
          totalBudget,
          totalSpent,
          utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 10000) / 100 : 0,
        },
        topPerforming: adsWithCtr,
      },
    });
  } catch (error) {
    next(error);
  }
};
