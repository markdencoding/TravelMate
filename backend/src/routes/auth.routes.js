const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation schemas
const registerSchema = {
  full_name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Full name is required (2-100 characters).',
  },
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'A valid email address is required.',
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    message: 'Password must be at least 8 characters.',
  },
};

const loginSchema = {
  email: {
    required: true,
    type: 'string',
    message: 'Email is required.',
  },
  password: {
    required: true,
    type: 'string',
    message: 'Password is required.',
  },
};

// Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
