import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurantAnalytics extends Document {
  _id: string;
  restaurantId: string;
  date: Date;
  period: 'daily' | 'weekly' | 'monthly';
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  platformFees: number;
  netRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
  topSellingItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByHour: Record<string, number>;
  customerRetentionRate: number;
  newCustomers: number;
  returningCustomers: number;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantAnalyticsSchema = new Schema<IRestaurantAnalytics>(
  {
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    netRevenue: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    averagePreparationTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    topSellingItems: [
      {
        itemId: String,
        itemName: String,
        quantity: Number,
        revenue: Number,
      },
    ],
    ordersByHour: {
      type: Map,
      of: Number,
      default: {},
    },
    customerRetentionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    newCustomers: {
      type: Number,
      default: 0,
      min: 0,
    },
    returningCustomers: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'restaurant_analytics',
  }
);

// Indexes
RestaurantAnalyticsSchema.index({ restaurantId: 1, date: -1 });
RestaurantAnalyticsSchema.index({ restaurantId: 1, period: 1, date: -1 });

export default mongoose.model<IRestaurantAnalytics>('RestaurantAnalytics', RestaurantAnalyticsSchema);
