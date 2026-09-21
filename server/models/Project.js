const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  projectType: {
    type: DataTypes.ENUM('React', 'React Native', 'Full Stack', 'Backend', 'Other'),
    allowNull: true,
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clientContact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  teamMembers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  techStack: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Project;
