const { sequelize } = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');
const Milestone = require('./models/Milestone');
const Payment = require('./models/Payment');

async function fixDB() {
  try {
    console.log('Authenticating...');
    await sequelize.authenticate();
    
    // Disable FK checks to prevent drop errors
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('Forcing sync (dropping and recreating tables)...');
    await sequelize.sync({ force: true });
    
    console.log('Re-inserting data...');
    await User.bulkCreate([
      {
        id: 1,
        name: "Admin User",
        email: "admin@zethub.com",
        password: "$2b$10$8TAAqoAgNpiT4kRgGryo8edf4.GkY/V0OmA56byWc5bvr5UXRXESW",
        role: "admin",
        createdAt: "2026-03-29T12:19:04.000Z",
        updatedAt: "2026-03-29T12:19:04.000Z"
      },
      {
        id: 2,
        name: "Team Member",
        email: "team@zethub.com",
        password: "$2b$10$8TAAqoAgNpiT4kRgGryo8edf4.GkY/V0OmA56byWc5bvr5UXRXESW",
        role: "team",
        createdAt: "2026-03-29T12:19:04.000Z",
        updatedAt: "2026-03-29T12:19:04.000Z"
      },
      {
        id: 3,
        name: "Client User",
        email: "client@zethub.com",
        password: "$2b$10$8TAAqoAgNpiT4kRgGryo8edf4.GkY/V0OmA56byWc5bvr5UXRXESW",
        role: "client",
        createdAt: "2026-03-29T12:19:05.000Z",
        updatedAt: "2026-03-29T12:19:05.000Z"
      },
      {
        id: 4,
        name: "asw",
        email: "aswinkumarta2006@gmail.com",
        password: "$2b$10$tbR6IW/6GszxCEaEZdIq9uNINLsNnPSNrdozBEHAHZsUj2nQLzwDa",
        role: "client", // Fix empty enum
        createdAt: "2026-03-29T13:11:27.000Z",
        updatedAt: "2026-03-29T13:11:27.000Z"
      }
    ]);

    await Project.bulkCreate([
      {
        id: 10,
        name: "fg",
        client_id: 3,
        status: "pending",
        deadline: "2026-05-06T00:00:00.000Z",
        createdAt: "2026-03-29T12:38:46.000Z",
        updatedAt: "2026-03-29T12:38:46.000Z"
      }
    ]);

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Database fix complete! All tables fresh and clean.');
  } catch (error) {
    console.error('Error fixing DB:', error);
  } finally {
    process.exit();
  }
}

fixDB();
