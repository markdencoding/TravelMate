const { Pool } = require('pg');
const config = require('./index');

let pool = null;

/**
 * Get or create the PostgreSQL connection pool.
 * Returns null if DATABASE_URL is not configured.
 */
function getPool() {
  if (pool) return pool;

  if (!config.databaseUrl) {
    console.warn('[Database] DATABASE_URL is not configured. Database features will be unavailable.');
    return null;
  }

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase connections
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[Database] Unexpected pool error:', err.message);
  });

  return pool;
}

/**
 * Execute a parameterized SQL query.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<object>} - Query result
 */
async function query(text, params = []) {
  const db = getPool();
  if (!db) {
    throw new Error('Database is not configured. Set DATABASE_URL in your .env file.');
  }

  const start = Date.now();
  const result = await db.query(text, params);
  const duration = Date.now() - start;

  if (config.nodeEnv === 'development') {
    console.log(`[Database] Query executed in ${duration}ms | Rows: ${result.rowCount}`);
  }

  return result;
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const db = getPool();
    if (!db) return false;

    const result = await db.query('SELECT NOW()');
    console.log('[Database] Connection successful:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('[Database] Connection failed:', err.message);
    return false;
  }
}

/**
 * Gracefully close the pool.
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Database] Connection pool closed.');
  }
}

module.exports = {
  query,
  getPool,
  testConnection,
  closePool,
};
