'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      // Wallet belongs to a User
      Wallet.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      // Wallet belongs to a Currency
      Wallet.belongsTo(models.Currency, {
        foreignKey: 'currency_id',
        as: 'currency',
      });
    }
  }

  Wallet.init(
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      currency_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
      },
      balance: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0,
      },
      update_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Wallet',
      tableName: 'wallets',
      timestamps: false,
    }
  );

  return Wallet;
};
