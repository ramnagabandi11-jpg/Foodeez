import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface FieldVisitAttributes {
  id: string;
  areaManagerId: string;
  visitType: 'restaurant_onboarding' | 'restaurant_inspection' | 'delivery_partner_meeting' | 'quality_check';
  restaurantId: string | null;
  deliveryPartnerId: string | null;
  scheduledAt: Date;
  completedAt: Date | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  checklistCompleted: Record<string, any>;
  notes: string | null;
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FieldVisitCreationAttributes extends Optional<FieldVisitAttributes, 'id' | 'restaurantId' | 'deliveryPartnerId' | 'completedAt' | 'status' | 'checklistCompleted' | 'notes' | 'photos' | 'latitude' | 'longitude' | 'createdAt' | 'updatedAt'> {}

class FieldVisit extends Model<FieldVisitAttributes, FieldVisitCreationAttributes> implements FieldVisitAttributes {
  declare id: string;
  declare areaManagerId: string;
  declare visitType: 'restaurant_onboarding' | 'restaurant_inspection' | 'delivery_partner_meeting' | 'quality_check';
  declare restaurantId: string | null;
  declare deliveryPartnerId: string | null;
  declare scheduledAt: Date;
  declare completedAt: Date | null;
  declare status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  declare checklistCompleted: Record<string, any>;
  declare notes: string | null;
  declare photos: string[];
  declare latitude: number | null;
  declare longitude: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FieldVisit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    areaManagerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id',
      },
    },
    visitType: {
      type: DataTypes.ENUM('restaurant_onboarding', 'restaurant_inspection', 'delivery_partner_meeting', 'quality_check'),
      allowNull: false,
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
      allowNull: false,
    },
    checklistCompleted: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photos: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'field_visits',
    timestamps: true,
    indexes: [
      {
        fields: ['areaManagerId'],
      },
      {
        fields: ['restaurantId'],
      },
      {
        fields: ['deliveryPartnerId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['scheduledAt'],
      },
    ],
  }
);

export default FieldVisit;
