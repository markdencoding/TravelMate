const path = require('path');

// Load .env from project root (one level up from backend/)
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Database (Supabase PostgreSQL)
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // External APIs
  mapsApiKey: process.env.MAPS_API_KEY || '',
  weatherApiKey: process.env.WEATHER_API_KEY || '',
};

// Validate critical config in production
if (config.nodeEnv === 'production') {
  const required = ['databaseUrl', 'jwtSecret'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable for: ${key}`);
    }
  }
}

module.exports = config;
