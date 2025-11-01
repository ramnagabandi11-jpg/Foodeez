import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface RestaurantAttributes {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  fssaiNumber: string;
  ownerName: string;
  ownerPhone: string;
  businessEmail: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  cuisineTypes: string[];
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  averageRating: number;
  totalRatings: number;
  averagePreparationTime: number;
  minimumOrderValue: number;
  subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  trialEndsAt: Date | null;
  bannerImageUrl: string | null;
  logoImageUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestaurantCreationAttributes extends Optional<RestaurantAttributes, 'id' | 'description' | 'cuisineTypes' | 'isOpen' | 'averageRating' | 'totalRatings' | 'averagePreparationTime' | 'minimumOrderValue' | 'subscriptionStatus' | 'trialEndsAt' | 'bannerImageUrl' | 'logoImageUrl' | 'createdAt' | 'updatedAt'> {}

class Restaurant extends Model<RestaurantAttributes, RestaurantCreationAttributes> implements RestaurantAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare description: string | null;
  declare fssaiNumber: string;
  declare ownerName: string;
  declare ownerPhone: string;
  declare businessEmail: string;
  declare address: string;
  declare city: string;
  declare state: string;
  declare pincode: string;
  declare latitude: number;
  declare longitude: number;
  declare cuisineTypes: string[];
  declare openingTime: string;
  declare closingTime: string;
  declare isOpen: boolean;
  declare averageRating: number;
  declare totalRatings: number;
  declare averagePreparationTime: number;
  declare minimumOrderValue: number;
  declare subscriptionStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  declare trialEndsAt: Date | null;
  declare bannerImageUrl: string | null;
  declare logoImageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Restaurant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fssaiNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    ownerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ownerPhone: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    businessEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    cuisineTypes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    openingTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    closingTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    averageRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    averagePreparationTime: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
    },
    minimumOrderValue: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('trial', 'active', 'suspended', 'cancelled'),
      defaultValue: 'trial',
      allowNull: false,
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bannerImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    logoImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'restaurants',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
      {
        unique: true,
        fields: ['fssaiNumber'],
      },
      {
        fields: ['subscriptionStatus'],
      },
      {
        fields: ['isOpen'],
      },
      {
        fields: ['city'],
      },
      {
        fields: ['latitude', 'longitude'],
      },
    ],
  }
);

export default Restaurant;
