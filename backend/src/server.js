const app = require('./app');
const config = require('./config');
const db = require('./config/database');

const PORT = config.port;

async function start() {
  console.log('========================================');
  console.log('  TravelMate API Server');
  console.log('========================================');
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  CORS Origin: ${config.corsOrigin}`);
  console.log('----------------------------------------');

  // Test database connection
  const dbConnected = await db.testConnection();
  if (dbConnected) {
    console.log('  Database:    Connected ✓');
  } else {
    console.log('  Database:    Not configured (set DATABASE_URL in .env)');
  }

  // Check API keys
  console.log(`  Maps API:    ${config.mapsApiKey ? 'Configured ✓' : 'Not configured'}`);
  console.log(`  Weather API: ${config.weatherApiKey ? 'Configured ✓' : 'Not configured'}`);
  console.log(`  JWT Secret:  ${config.jwtSecret ? 'Configured ✓' : 'Not configured'}`);
  console.log('========================================');

  app.listen(PORT, () => {
    console.log(`\n  Server listening on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Shutting down...');
  await db.closePool();
  process.exit(0);
});

start();
