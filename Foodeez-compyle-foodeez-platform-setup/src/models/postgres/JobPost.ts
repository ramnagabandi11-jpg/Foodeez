import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

export interface JobPostAttributes {
  id: string;
  title: string;
  departmentId: string;
  description: string;
  requirements: string;
  location: string;
  salaryRangeMin: number;
  salaryRangeMax: number;
  status: 'open' | 'closed';
  postedDate: Date;
  closedDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobPostCreationAttributes extends Optional<JobPostAttributes, 'id' | 'status' | 'closedDate' | 'createdAt' | 'updatedAt'> {}

class JobPost extends Model<JobPostAttributes, JobPostCreationAttributes> implements JobPostAttributes {
  declare id: string;
  declare title: string;
  declare departmentId: string;
  declare description: string;
  declare requirements: string;
  declare location: string;
  declare salaryRangeMin: number;
  declare salaryRangeMax: number;
  declare status: 'open' | 'closed';
  declare postedDate: Date;
  declare closedDate: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

JobPost.init(
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
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    salaryRangeMin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    salaryRangeMax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      defaultValue: 'open',
      allowNull: false,
    },
    postedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    closedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'job_posts',
    timestamps: true,
    indexes: [
      {
        fields: ['departmentId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['postedDate'],
      },
    ],
  }
);

export default JobPost;
