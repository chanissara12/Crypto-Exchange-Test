'use strict';

const { Sequelize, DataTypes } = require('sequelize');

// ── Configure your DB connection here ────────────────────────────────────────
const sequelize = new Sequelize('crypto_exchange', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql', // or 'postgres', 'sqlite', etc.
  logging: false,
});

// ── Import model factories ────────────────────────────────────────────────────
const User        = require('./User')(sequelize, DataTypes);
const Currency    = require('./Currency')(sequelize, DataTypes);
const Wallet      = require('./Wallet')(sequelize, DataTypes);
const Offer       = require('./Offer')(sequelize, DataTypes);
const Transaction = require('./Transaction')(sequelize, DataTypes);

const models = { User, Currency, Wallet, Offer, Transaction };

// ── Wire up all associations ──────────────────────────────────────────────────
Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});

module.exports = { sequelize, ...models };
