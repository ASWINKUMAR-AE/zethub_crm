require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create MySQL connection config using environment variables for production readiness
const DB_NAME = process.env.DB_NAME || 'zethub_crm';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false, // Set to console.log to see SQL queries
});

const connectDB = async () => {
  try {
    // Check if the database exists, if not, create it
    const connection = await require('mysql2/promise').createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log('Database checked/created.');
    
    // Connect with Sequelize
    await sequelize.authenticate();
    console.log('Sequelize connected properly.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };
