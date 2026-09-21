const { sequelize } = require('../config/db');

const User = require('./User');
const Project = require('./Project');
const Milestone = require('./Milestone');
const Payment = require('./Payment');

// Define Relationships

// Project & User (Client)
Project.belongsTo(User, { as: 'Client', foreignKey: 'client_id' });
User.hasMany(Project, { foreignKey: 'client_id' });

// Milestone & Project
Milestone.belongsTo(Project, { foreignKey: 'project_id' });
Project.hasMany(Milestone, { foreignKey: 'project_id' });

// Milestone & User (Assigned To)
Milestone.belongsTo(User, { as: 'AssignedTeam', foreignKey: 'assigned_to' });
User.hasMany(Milestone, { foreignKey: 'assigned_to' });

// Payment & Milestone
Payment.belongsTo(Milestone, { foreignKey: 'milestone_id' });
Milestone.hasOne(Payment, { foreignKey: 'milestone_id' });

// Payment & User (Client)
Payment.belongsTo(User, { as: 'Client', foreignKey: 'client_id' });
User.hasMany(Payment, { foreignKey: 'client_id' });

module.exports = {
  sequelize,
  User,
  Project,
  Milestone,
  Payment,
};
