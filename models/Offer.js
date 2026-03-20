'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Offer extends Model {
    static associate(models) {
      // Offer belongs to a User (creator)
      Offer.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      // Offer belongs to a Currency (crypto being traded)
      Offer.belongsTo(models.Currency, {
        foreignKey: 'crypto_currency_id',
        as: 'cryptoCurrency',
      });

      // Offer belongs to a Currency (fiat used for payment)
      Offer.belongsTo(models.Currency, {
        foreignKey: 'fiat_currency_id',
        as: 'fiatCurrency',
      });

      // Offer has many Transactions
      Offer.hasMany(models.Transaction, {
        foreignKey: 'offer_id',
        as: 'transactions',
      });
    }
  }

  Offer.init(
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
      type: {
        type: DataTypes.STRING, // e.g. 'buy' | 'sell'
        allowNull: false,
      },
      crypto_currency_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
      },
      price: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
      },
      fiat_currency_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
      },
      available: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
      },
      order_limit: {
        type: DataTypes.DECIMAL(20, 3),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      update_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Offer',
      tableName: 'offers',
      timestamps: false,
    }
  );

  return Offer;
};
