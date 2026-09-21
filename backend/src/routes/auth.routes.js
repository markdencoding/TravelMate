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

const forgotPasswordSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'A valid email address is required.',
  },
};

const verifyResetOtpSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'A valid email address is required.',
  },
  otp: {
    required: true,
    type: 'string',
    pattern: /^\d{6}$/,
    message: 'Please enter a valid 6-digit verification code.',
  },
};

const resetPasswordSchema = {
  reset_token: {
    required: true,
    type: 'string',
    message: 'Reset token is required.',
  },
  new_password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    message: 'Password must be at least 8 characters.',
  },
};

// Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

// Password recovery routes
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', validate(verifyResetOtpSchema), authController.verifyResetOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Development/testing helper to inspect test mailbox preview without exposing credentials
if (process.env.NODE_ENV !== 'production') {
  router.get('/test-preview-url', (req, res) => {
    const lastMail = require('../services/email.service').getLastSentMail();
    res.json({ previewUrl: lastMail?.previewUrl || null, to: lastMail?.to || null });
  });
}

module.exports = router;
