const response = require('../utils/responseHelper');
const db = require('../config/database');

/**
 * GET /api/health
 * Returns server health status and database connectivity.
 */
async function getHealth(req, res, next) {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Test database connection
    const dbConnected = await db.testConnection();
    health.database = dbConnected ? 'connected' : 'not configured';

    return response.success(res, 'TravelMate API is running.', health);
  } catch (err) {
    next(err);
  }
}

module.exports = { getHealth };
