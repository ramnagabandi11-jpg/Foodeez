import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface RatingReviewAttributes {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  restaurantRating: number;
  foodRating: number;
  deliveryRating: number | null;
  reviewText: string | null;
  reviewImages: string[];
  isVerified: boolean;
  isVisible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RatingReviewCreationAttributes extends Optional<RatingReviewAttributes, 'id' | 'deliveryPartnerId' | 'deliveryRating' | 'reviewText' | 'reviewImages' | 'isVerified' | 'isVisible' | 'createdAt' | 'updatedAt'> {}

class RatingReview extends Model<RatingReviewAttributes, RatingReviewCreationAttributes> implements RatingReviewAttributes {
  declare id: string;
  declare orderId: string;
  declare customerId: string;
  declare restaurantId: string;
  declare deliveryPartnerId: string | null;
  declare restaurantRating: number;
  declare foodRating: number;
  declare deliveryRating: number | null;
  declare reviewText: string | null;
  declare reviewImages: string[];
  declare isVerified: boolean;
  declare isVisible: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RatingReview.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
    },
    deliveryPartnerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'delivery_partners',
        key: 'id',
      },
    },
    restaurantRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    foodRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    deliveryRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewImages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ratings_reviews',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['orderId'],
      },
      {
        fields: ['restaurantId'],
      },
      {
        fields: ['deliveryPartnerId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default RatingReview;
