import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformLog extends Document {
  _id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  service: string;
  module: string;
  userId: string | null;
  orderId: string | null;
  requestId: string | null;
  method: string | null;
  url: string | null;
  statusCode: number | null;
  responseTime: number | null;
  ip: string | null;
  userAgent: string | null;
  errorStack: string | null;
  metadata: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const PlatformLogSchema = new Schema<IPlatformLog>(
  {
    level: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
    },
    method: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    responseTime: {
      type: Number,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    errorStack: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'platform_logs',
  }
);

// Indexes
PlatformLogSchema.index({ level: 1, timestamp: -1 });
PlatformLogSchema.index({ service: 1, timestamp: -1 });
PlatformLogSchema.index({ userId: 1, timestamp: -1 });
PlatformLogSchema.index({ orderId: 1, timestamp: -1 });
PlatformLogSchema.index({ timestamp: -1 });

// TTL index - logs expire after 30 days
PlatformLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<IPlatformLog>('PlatformLog', PlatformLogSchema);
