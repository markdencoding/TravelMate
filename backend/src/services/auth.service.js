const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * @param {string} fullName
 * @param {string} email
 * @param {string} password
 * @returns {object} Created user (without password_hash)
 */
async function register(fullName, email, password) {
  // Check if user already exists
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (existing.rows.length > 0) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, full_name, email, role, created_at`,
    [fullName.trim(), email.toLowerCase().trim(), passwordHash, 'traveler']
  );

  return result.rows[0];
}

/**
 * Authenticate a user and return a JWT token.
 * @param {string} email
 * @param {string} password
 * @returns {object} { user, token }
 */
async function login(email, password) {
  // Find user by email
  const result = await db.query(
    'SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = result.rows[0];

  // Compare password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Generate JWT
  const token = generateToken(user);

  // Return user info without password_hash
  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
}

/**
 * Get user profile by ID.
 * @param {string} userId
 * @returns {object} User record (without password_hash)
 */
async function getUserById(userId) {
  const result = await db.query(
    'SELECT id, full_name, email, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  return result.rows[0];
}

/**
 * Generate a JWT for a user.
 * @param {object} user - User object with id, email, role
 * @returns {string} JWT token
 */
function generateToken(user) {
  if (!config.jwtSecret) {
    throw new AppError('JWT secret is not configured.', 500);
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

module.exports = {
  register,
  login,
  getUserById,
};
