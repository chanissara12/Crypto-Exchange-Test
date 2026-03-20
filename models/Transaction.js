'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      // Transaction belongs to a User (buyer/initiator)
      Transaction.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      // Transaction belongs to a User (trader/counterparty)
      Transaction.belongsTo(models.User, {
        foreignKey: 'trader_id',
        as: 'trader',
      });

      // Transaction belongs to an Offer
      Transaction.belongsTo(models.Offer, {
        foreignKey: 'offer_id',
        as: 'offer',
      });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      trader_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      offer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'offers', key: 'id' },
      },
      price: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
      },
      fee: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
      },
      update_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      timestamps: false,
    }
  );

  return Transaction;
};
