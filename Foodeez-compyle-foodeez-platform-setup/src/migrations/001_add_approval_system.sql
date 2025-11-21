'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add approval fields to restaurants table
    await queryInterface.addColumn('restaurants', 'isApproved', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('restaurants', 'approvedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('restaurants', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('restaurants', 'rejectionReason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add status fields to users table
    await queryInterface.addColumn('users', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'deactivatedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('users', 'deactivatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'deactivationReason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Create admin_logs table
    await queryInterface.createTable('admin_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resourceType: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resourceId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      oldValues: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      newValues: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.INET,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create rating_summaries table
    await queryInterface.createTable('rating_summaries', {
      restaurantId: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      averageRating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00,
        allowNull: false,
      },
      totalReviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      ratingDistribution: {
        type: Sequelize.JSONB,
        defaultValue: '{"1":0,"2":0,"3":0,"4":0,"5":0}',
        allowNull: false,
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('restaurants', ['isApproved']);
    await queryInterface.addIndex('restaurants', ['approvedAt']);
    await queryInterface.addIndex('users', ['isActive']);
    await queryInterface.addIndex('users', ['deactivatedAt']);
    await queryInterface.addIndex('admin_logs', ['adminId']);
    await queryInterface.addIndex('admin_logs', ['action']);
    await queryInterface.addIndex('admin_logs', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('restaurants', ['isApproved']);
    await queryInterface.removeIndex('restaurants', ['approvedAt']);
    await queryInterface.removeIndex('users', ['isActive']);
    await queryInterface.removeIndex('users', ['deactivatedAt']);
    await queryInterface.removeIndex('admin_logs', ['adminId']);
    await queryInterface.removeIndex('admin_logs', ['action']);
    await queryInterface.removeIndex('admin_logs', ['createdAt']);

    // Drop tables
    await queryInterface.dropTable('rating_summaries');
    await queryInterface.dropTable('admin_logs');

    // Remove columns from restaurants table
    await queryInterface.removeColumn('restaurants', 'isApproved');
    await queryInterface.removeColumn('restaurants', 'approvedBy');
    await queryInterface.removeColumn('restaurants', 'approvedAt');
    await queryInterface.removeColumn('restaurants', 'rejectionReason');

    // Remove columns from users table
    await queryInterface.removeColumn('users', 'isActive');
    await queryInterface.removeColumn('users', 'deactivatedBy');
    await queryInterface.removeColumn('users', 'deactivatedAt');
    await queryInterface.removeColumn('users', 'deactivationReason');
  }
};