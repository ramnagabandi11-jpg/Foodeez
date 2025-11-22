import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface RatingSummaryAttributes {
  restaurantId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  lastUpdated: Date;
}

export interface RatingSummaryCreationAttributes extends Optional<RatingSummaryAttributes, 'averageRating' | 'totalReviews' | 'ratingDistribution' | 'lastUpdated'> {}

class RatingSummary extends Model<RatingSummaryAttributes, RatingSummaryCreationAttributes> implements RatingSummaryAttributes {
  declare restaurantId: string;
  declare averageRating: number;
  declare totalReviews: number;
  declare ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  declare readonly lastUpdated: Date;
}

RatingSummary.init(
  {
    restaurantId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    ratingDistribution: {
      type: DataTypes.JSONB,
      defaultValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      allowNull: false,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'rating_summaries',
    timestamps: false,
  }
);

export default RatingSummary;