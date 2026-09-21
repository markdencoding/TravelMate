const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const config = require('../config');
const AppError = require('../utils/AppError');
const emailService = require('./email.service');

const BCRYPT_SALT_ROUNDS = 12; // Matching auth.service.js

/**
 * Request a password reset OTP.
 * Handles rate-limiting and account enumeration prevention.
 * @param {string} rawEmail - User email
 * @returns {Promise<{ message: string }>}
 */
async function requestPasswordReset(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    throw new AppError('A valid email address is required.', 400);
  }

  const email = rawEmail.toLowerCase().trim();
  const genericSuccessMessage = 'If the email is associated with a TravelMate account, a password reset code has been sent.';

  // 1. Enforce 60-second resend cooldown
  const cooldownResult = await db.query(
    `SELECT created_at FROM password_reset_tokens 
     WHERE email = $1 AND created_at > NOW() - ($2 || ' seconds')::INTERVAL 
     ORDER BY created_at DESC LIMIT 1`,
    [email, config.passwordReset.resendCooldownSeconds]
  );

  if (cooldownResult.rows.length > 0) {
    throw new AppError('Please wait before requesting another code.', 429);
  }

  // 2. Look up user by email
  const userResult = await db.query(
    'SELECT id, email, full_name FROM users WHERE email = $1',
    [email]
  );

  // 3. Account enumeration protection: if user does not exist, perform dummy work and return generic message
  if (userResult.rows.length === 0) {
    // Perform dummy bcrypt work to match response timing
    await bcrypt.hash('dummy_otp_work_for_timing', 10);
    return { message: genericSuccessMessage };
  }

  const user = userResult.rows[0];

  // 4. Invalidate any existing unverified reset requests for this user
  await db.query(
    `UPDATE password_reset_tokens 
     SET expires_at = NOW() 
     WHERE user_id = $1 AND verified_at IS NULL AND used_at IS NULL`,
    [user.id]
  );

  // 5. Generate cryptographically secure 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // 6. Hash OTP with bcrypt before storing
  const otpHash = await bcrypt.hash(otp, 10);

  // 7. Store in password_reset_tokens with 10-minute expiry
  await db.query(
    `INSERT INTO password_reset_tokens 
     (user_id, email, otp_hash, expires_at, attempt_count, created_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL, 0, NOW())`,
    [user.id, email, otpHash, config.passwordReset.otpExpiryMinutes]
  );

  // 8. Send the OTP email
  try {
    await emailService.sendPasswordResetEmail(user.email, otp);
  } catch (emailErr) {
    console.error('[PasswordResetService] Failed to send email:', emailErr.message);
    throw new AppError("We couldn't send the verification email right now. Please try again later.", 503);
  }

  return { message: genericSuccessMessage };
}

/**
 * Verify a 6-digit OTP for an email address.
 * Generates and returns a single-use 32-byte reset token.
 * @param {string} rawEmail - User email
 * @param {string} otp - 6-digit numeric OTP
 * @returns {Promise<{ reset_token: string }>}
 */
async function verifyResetOtp(rawEmail, otp) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    throw new AppError('A valid email address is required.', 400);
  }

  if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    throw new AppError('Please enter a valid 6-digit verification code.', 400);
  }

  const email = rawEmail.toLowerCase().trim();

  // Look up most recent unverified, unused token for this email
  const tokenResult = await db.query(
    `SELECT id, user_id, email, otp_hash, expires_at, attempt_count, verified_at, used_at 
     FROM password_reset_tokens 
     WHERE email = $1 AND verified_at IS NULL AND used_at IS NULL 
     ORDER BY created_at DESC LIMIT 1`,
    [email]
  );

  if (tokenResult.rows.length === 0) {
    throw new AppError('This verification code has expired. Please request a new code.', 400);
  }

  const tokenRecord = tokenResult.rows[0];

  // Check if locked due to too many attempts
  if (tokenRecord.attempt_count >= config.passwordReset.maxOtpAttempts) {
    throw new AppError('This verification code has been locked. Please request a new code.', 429);
  }

  // Check expiration
  if (new Date(tokenRecord.expires_at) < new Date()) {
    throw new AppError('This verification code has expired. Please request a new code.', 400);
  }

  // Compare OTP using bcrypt
  const isMatch = await bcrypt.compare(otp, tokenRecord.otp_hash);

  if (!isMatch) {
    const updatedCount = tokenRecord.attempt_count + 1;
    await db.query(
      'UPDATE password_reset_tokens SET attempt_count = $1 WHERE id = $2',
      [updatedCount, tokenRecord.id]
    );

    if (updatedCount >= config.passwordReset.maxOtpAttempts) {
      throw new AppError('Too many incorrect attempts. Please request a new code.', 429);
    }

    throw new AppError('The verification code is incorrect. Please try again.', 400);
  }

  // Generate cryptographically secure 32-byte reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Mark token verified and store reset_token_hash with 15-minute expiry
  await db.query(
    `UPDATE password_reset_tokens 
     SET verified_at = NOW(), 
         reset_token_hash = $1, 
         reset_token_expires_at = NOW() + ($2 || ' minutes')::INTERVAL 
     WHERE id = $3`,
    [resetTokenHash, config.passwordReset.resetTokenExpiryMinutes, tokenRecord.id]
  );

  return { reset_token: resetToken };
}

/**
 * Reset user password using the authorized reset token.
 * @param {string} resetToken - 32-byte hex reset token
 * @param {string} newPassword - New password
 * @returns {Promise<{ message: string }>}
 */
async function resetPassword(resetToken, newPassword) {
  if (!resetToken || typeof resetToken !== 'string') {
    throw new AppError('This password reset session is no longer valid. Please request a new verification code.', 400);
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }

  // Hash provided token to match database hash
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Find matching active reset token
  const tokenResult = await db.query(
    `SELECT id, user_id, email, reset_token_hash, reset_token_expires_at, verified_at, used_at 
     FROM password_reset_tokens 
     WHERE reset_token_hash = $1 AND verified_at IS NOT NULL AND used_at IS NULL`,
    [resetTokenHash]
  );

  if (tokenResult.rows.length === 0) {
    throw new AppError('This password reset session is no longer valid. Please request a new verification code.', 400);
  }

  const tokenRecord = tokenResult.rows[0];

  // Check expiration
  if (new Date(tokenRecord.reset_token_expires_at) < new Date()) {
    throw new AppError('This password reset session has expired. Please request a new code.', 400);
  }

  // Hash new password using bcrypt
  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update user's password in database
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, tokenRecord.user_id]
  );

  // Mark token as used
  await db.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
    [tokenRecord.id]
  );

  // Invalidate any other active reset tokens for this user
  await db.query(
    `UPDATE password_reset_tokens 
     SET used_at = NOW(), expires_at = NOW() 
     WHERE user_id = $1 AND id != $2`,
    [tokenRecord.user_id, tokenRecord.id]
  );

  return { message: 'Password changed successfully.' };
}

module.exports = {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
};
