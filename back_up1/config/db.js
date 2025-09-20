const { Sequelize } = require('sequelize');
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, NODE_ENV } = process.env;

const dialectOptions = {};

// Apply SSL settings for all environments except local development
if (NODE_ENV !== 'local') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

// Add connection timeout and keep-alive settings for all environments
Object.assign(dialectOptions, {
  connectTimeout: 60000, // 60 seconds
  socketTimeout: 60000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
});

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
    // Add connection retry settings
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /ENETUNREACH/,
        /EAI_AGAIN/,
        /Connection terminated/,
        /Connection reset by peer/,
      ],
      max: 3
    }
  },
  dialectOptions,
  // Add query logging in development
  benchmark: NODE_ENV === 'development'
});

module.exports = sequelize;