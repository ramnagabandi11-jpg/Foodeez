import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
  tags: string[];
  preparationTime: number;
  isAvailable: boolean;
  customizations: Array<{
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    options: Array<{
      name: string;
      price: number;
      isDefault: boolean;
    }>;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  allergens: string[];
  rating: number;
  totalRatings: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    isVegetarian: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    isGlutenFree: {
      type: Boolean,
      default: false,
    },
    spiceLevel: {
      type: String,
      enum: ['none', 'mild', 'medium', 'hot', 'extra_hot'],
      default: 'none',
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    customizations: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ['single', 'multiple'], required: true },
        required: { type: Boolean, default: false },
        options: [
          {
            name: { type: String, required: true },
            price: { type: Number, required: true, default: 0 },
            isDefault: { type: Boolean, default: false },
          },
        ],
      },
    ],
    nutrition: {
      type: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
      },
      default: null,
    },
    allergens: {
      type: [String],
      default: [],
    },
    rating: {
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
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'menu_items',
  }
);

// Indexes
MenuItemSchema.index({ restaurantId: 1, category: 1 });
MenuItemSchema.index({ restaurantId: 1, isAvailable: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
