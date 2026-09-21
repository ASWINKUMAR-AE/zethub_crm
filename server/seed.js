const bcrypt = require('bcrypt');
const { connectDB, sequelize } = require('./config/db');
require('./models'); // Loads models via index
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await connectDB();
    await sequelize.sync(); // ensure tables are created

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      { name: 'Admin User', email: 'admin@zethub.com', password: hashedPassword, role: 'admin' },
      { name: 'Team Member', email: 'team@zethub.com', password: hashedPassword, role: 'team' },
      { name: 'Client User', email: 'client@zethub.com', password: hashedPassword, role: 'client' },
    ];

    for (let u of users) {
      const exists = await User.findOne({ where: { email: u.email } });
      if (!exists) {
        await User.create(u);
        console.log(`Created ${u.role}: ${u.email} / password123`);
      } else {
        console.log(`User ${u.email} already exists.`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();
