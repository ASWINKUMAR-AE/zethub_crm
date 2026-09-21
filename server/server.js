require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, sequelize } = require('./config/db');

// Models (to ensure they load and sync)
require('./models');

const app = express();
const PORT = process.env.PORT || 8000;

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================== DB ==================
const startDB = async () => {
  await connectDB();
  await sequelize.sync({ alter: true });
  console.log('Database connected and synced.');
};
startDB();

// ================== ROUTES ==================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/admin/projects', require('./routes/projectRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// ================== HEALTH ==================
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CRM Server is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on port ${PORT}`);
});
