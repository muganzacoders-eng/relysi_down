require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      socketTimeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
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
    logging: console.log
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      socketTimeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
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
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      socketTimeout: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
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
    logging: false
  }
};