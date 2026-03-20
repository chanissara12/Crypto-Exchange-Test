'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Currency extends Model {
    static associate(models) {
      // Currency has many Wallets
      Currency.hasMany(models.Wallet, {
        foreignKey: 'currency_id',
        as: 'wallets',
      });

      // Currency has many Offers as the crypto being sold/bought
      Currency.hasMany(models.Offer, {
        foreignKey: 'crypto_currency_id',
        as: 'cryptoOffers',
      });

      // Currency has many Offers as the fiat payment currency
      Currency.hasMany(models.Offer, {
        foreignKey: 'fiat_currency_id',
        as: 'fiatOffers',
      });
    }
  }

  Currency.init(
    {
      currency_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      currency_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING, // e.g. 'crypto' | 'fiat'
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Currency',
      tableName: 'Currencies',
      timestamps: false,
    }
  );

  return Currency;
};
