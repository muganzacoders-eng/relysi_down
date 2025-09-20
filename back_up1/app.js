// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const { sequelize } = require('./config/db');
// const errorHandler = require('./utils/errorHandler');
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const classroomRoutes = require('./routes/classroomRoutes');
// const examRoutes = require('./routes/examRoutes');
// const contentRoutes = require('./routes/contentRoutes');
// const counselingRoutes = require('./routes/counselingRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(helmet());
// app.use(morgan('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Database connection
// sequelize.authenticate()
//   .then(() => console.log('Database connected successfully'))
//   .catch(err => console.error('Database connection error:', err));

// // Sync models
// sequelize.sync({ alter: true })
//   .then(() => console.log('Database synced'))
//   .catch(err => console.error('Database sync error:', err));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/classrooms', classroomRoutes);
// app.use('/api/exams', examRoutes);
// app.use('/api/content', contentRoutes);
// app.use('/api/counseling', counselingRoutes);
// app.use('/api/payments', paymentRoutes);

// // Add to app.js after routes
// const swaggerSetup = require('./docs/swagger');
// swaggerSetup(app);

// // Health check
// app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// // Error handling middleware
// app.use(errorHandler);

// module.exports = app;





require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./models'); // Updated import
const errorHandler = require('./utils/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return db.sequelize.sync({ alter: true });
  })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/counseling', require('./routes/counselingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// // Add to app.js after routes
// const swaggerSetup = require('./docs/swagger');
// swaggerSetup(app);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Error handling
app.use(errorHandler);

module.exports = app;