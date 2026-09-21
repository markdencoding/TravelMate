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

  // SMTP Email
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'TravelMate <noreply@travelmate.com>',
  },

  // Password Reset
  passwordReset: {
    otpExpiryMinutes: parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES, 10) || 10,
    resetTokenExpiryMinutes: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES, 10) || 15,
    maxOtpAttempts: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS, 10) || 5,
    resendCooldownSeconds: parseInt(process.env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS, 10) || 60,
  },
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
