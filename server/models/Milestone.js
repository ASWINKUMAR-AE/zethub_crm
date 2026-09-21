const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Milestone = sequelize.define('Milestone', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'submitted', 'approved', 'paid'),
    defaultValue: 'pending',
  },
  deadline: {
    type: DataTypes.DATE,
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Milestone;
