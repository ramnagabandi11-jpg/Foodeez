import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryPartnerAnalytics extends Document {
  _id: string;
  deliveryPartnerId: string;
  date: Date;
  period: 'daily' | 'weekly' | 'monthly';
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  totalEarnings: number;
  baseFees: number;
  bonuses: number;
  tips: number;
  onlineHours: number;
  activeHours: number;
  averageDeliveryTime: number;
  averageDistancePerDelivery: number;
  totalDistance: number;
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalRatings: number;
  peakHourDeliveries: number;
  lateDeliveries: number;
  cashCollected: number;
  deliveriesByHour: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPartnerAnalyticsSchema = new Schema<IDeliveryPartnerAnalytics>(
  {
    deliveryPartnerId: {
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
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    baseFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    tips: {
      type: Number,
      default: 0,
      min: 0,
    },
    onlineHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageDeliveryTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageDistancePerDelivery: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    peakHourDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveriesByHour: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'delivery_partner_analytics',
  }
);

// Indexes
DeliveryPartnerAnalyticsSchema.index({ deliveryPartnerId: 1, date: -1 });
DeliveryPartnerAnalyticsSchema.index({ deliveryPartnerId: 1, period: 1, date: -1 });

export default mongoose.model<IDeliveryPartnerAnalytics>('DeliveryPartnerAnalytics', DeliveryPartnerAnalyticsSchema);
