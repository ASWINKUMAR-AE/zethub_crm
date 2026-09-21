const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  milestone_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending',
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paid_at: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
});

module.exports = Payment;
