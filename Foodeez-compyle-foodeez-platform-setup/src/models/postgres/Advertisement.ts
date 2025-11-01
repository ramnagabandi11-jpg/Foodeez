import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AdvertisementAttributes {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  targetUrl: string | null;
  adType: 'banner' | 'popup' | 'carousel' | 'video';
  targetAudience: 'all' | 'customer' | 'restaurant' | 'delivery_partner';
  targetCities: string[];
  priority: number;
  impressionGoal: number | null;
  clickGoal: number | null;
  currentImpressions: number;
  currentClicks: number;
  costPerImpression: number;
  costPerClick: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdvertisementCreationAttributes extends Optional<AdvertisementAttributes, 'id' | 'description' | 'targetUrl' | 'targetAudience' | 'targetCities' | 'priority' | 'impressionGoal' | 'clickGoal' | 'currentImpressions' | 'currentClicks' | 'costPerImpression' | 'costPerClick' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Advertisement extends Model<AdvertisementAttributes, AdvertisementCreationAttributes> implements AdvertisementAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare imageUrl: string;
  declare targetUrl: string | null;
  declare adType: 'banner' | 'popup' | 'carousel' | 'video';
  declare targetAudience: 'all' | 'customer' | 'restaurant' | 'delivery_partner';
  declare targetCities: string[];
  declare priority: number;
  declare impressionGoal: number | null;
  declare clickGoal: number | null;
  declare currentImpressions: number;
  declare currentClicks: number;
  declare costPerImpression: number;
  declare costPerClick: number;
  declare validFrom: Date;
  declare validUntil: Date;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Advertisement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    targetUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    adType: {
      type: DataTypes.ENUM('banner', 'popup', 'carousel', 'video'),
      allowNull: false,
    },
    targetAudience: {
      type: DataTypes.ENUM('all', 'customer', 'restaurant', 'delivery_partner'),
      defaultValue: 'all',
      allowNull: false,
    },
    targetCities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    impressionGoal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    clickGoal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentImpressions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    currentClicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    costPerImpression: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    costPerClick: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'advertisements',
    timestamps: true,
    indexes: [
      {
        fields: ['adType'],
      },
      {
        fields: ['validFrom', 'validUntil'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['priority'],
      },
    ],
  }
);

export default Advertisement;
