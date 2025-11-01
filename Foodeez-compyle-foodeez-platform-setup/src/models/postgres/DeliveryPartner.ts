import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface DeliveryPartnerAttributes {
  id: string;
  userId: string;
  dateOfBirth: Date;
  aadhaarNumber: string;
  licenseNumber: string;
  vehicleType: 'bike' | 'scooter' | 'bicycle';
  vehicleNumber: string;
  serviceCity: string;
  serviceLatitude: number;
  serviceLongitude: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  isOnline: boolean;
  isAvailable: boolean;
  acceptanceRate: number;
  totalDeliveries: number;
  averageRating: number;
  totalRatings: number;
  cashInHand: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeliveryPartnerCreationAttributes extends Optional<DeliveryPartnerAttributes, 'id' | 'currentLatitude' | 'currentLongitude' | 'isOnline' | 'isAvailable' | 'acceptanceRate' | 'totalDeliveries' | 'averageRating' | 'totalRatings' | 'cashInHand' | 'createdAt' | 'updatedAt'> {}

class DeliveryPartner extends Model<DeliveryPartnerAttributes, DeliveryPartnerCreationAttributes> implements DeliveryPartnerAttributes {
  declare id: string;
  declare userId: string;
  declare dateOfBirth: Date;
  declare aadhaarNumber: string;
  declare licenseNumber: string;
  declare vehicleType: 'bike' | 'scooter' | 'bicycle';
  declare vehicleNumber: string;
  declare serviceCity: string;
  declare serviceLatitude: number;
  declare serviceLongitude: number;
  declare currentLatitude: number | null;
  declare currentLongitude: number | null;
  declare isOnline: boolean;
  declare isAvailable: boolean;
  declare acceptanceRate: number;
  declare totalDeliveries: number;
  declare averageRating: number;
  declare totalRatings: number;
  declare cashInHand: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

DeliveryPartner.init(
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
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    aadhaarNumber: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
    },
    licenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    vehicleType: {
      type: DataTypes.ENUM('bike', 'scooter', 'bicycle'),
      allowNull: false,
    },
    vehicleNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    serviceCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    serviceLatitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    serviceLongitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currentLatitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    currentLongitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    acceptanceRate: {
      type: DataTypes.FLOAT,
      defaultValue: 100.0,
      allowNull: false,
    },
    totalDeliveries: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    cashInHand: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'delivery_partners',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
      {
        unique: true,
        fields: ['aadhaarNumber'],
      },
      {
        unique: true,
        fields: ['licenseNumber'],
      },
      {
        unique: true,
        fields: ['vehicleNumber'],
      },
      {
        fields: ['currentLatitude', 'currentLongitude'],
      },
      {
        fields: ['isOnline', 'isAvailable'],
      },
      {
        fields: ['serviceCity'],
      },
    ],
  }
);

export default DeliveryPartner;
