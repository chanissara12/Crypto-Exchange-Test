'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User has many Wallets
      User.hasMany(models.Wallet, {
        foreignKey: 'user_id',
        as: 'wallets',
      });

      // User has many Offers (as the offer creator)
      User.hasMany(models.Offer, {
        foreignKey: 'user_id',
        as: 'offers',
      });

      // User has many Transactions (as buyer/initiator)
      User.hasMany(models.Transaction, {
        foreignKey: 'user_id',
        as: 'transactions',
      });

      // User has many Transactions (as trader/counterparty)
      User.hasMany(models.Transaction, {
        foreignKey: 'trader_id',
        as: 'trades',
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      user_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: false,
    }
  );

  return User;
};
