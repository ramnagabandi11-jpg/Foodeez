import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface AdInteractionAttributes {
  id: string;
  advertisementId: string;
  userId: string | null;
  interactionType: 'impression' | 'click';
  deviceType: 'web' | 'ios' | 'android';
  city: string | null;
  metadata: Record<string, any>;
  createdAt?: Date;
}

export interface AdInteractionCreationAttributes extends Optional<AdInteractionAttributes, 'id' | 'userId' | 'city' | 'metadata' | 'createdAt'> {}

class AdInteraction extends Model<AdInteractionAttributes, AdInteractionCreationAttributes> implements AdInteractionAttributes {
  declare id: string;
  declare advertisementId: string;
  declare userId: string | null;
  declare interactionType: 'impression' | 'click';
  declare deviceType: 'web' | 'ios' | 'android';
  declare city: string | null;
  declare metadata: Record<string, any>;
  declare readonly createdAt: Date;
}

AdInteraction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    advertisementId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'advertisements',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    interactionType: {
      type: DataTypes.ENUM('impression', 'click'),
      allowNull: false,
    },
    deviceType: {
      type: DataTypes.ENUM('web', 'ios', 'android'),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ad_interactions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['advertisementId'],
      },
      {
        fields: ['interactionType'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default AdInteraction;
