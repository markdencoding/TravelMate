/**
 * Phase 10.1 — Comprehensive Password Reset API Test Suite
 * Tests the complete secure OTP and password reset backend workflow:
 * 1. Forgot password with unknown email
 * 2. Forgot password with valid email
 * 3. Account enumeration protection
 * 4. 60-second resend cooldown
 * 5. OTP generated and stored hashed
 * 6. OTP is not returned in API response
 * 7. Invalid OTP
 * 8. Failed attempt increment
 * 9. 5-attempt lock
 * 10. Expired OTP rejection
 * 11. Successful OTP verification
 * 12. Reset token generated
 * 13. Reset token expiration
 * 14. Password reset success
 * 15. Old password fails
 * 16. New password succeeds
 * 17. Reset token cannot be reused
 * 18. Previous reset tokens invalidated
 * 19. Invalid reset token fails
 * 20. Weak password fails
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');
const authService = require('./src/services/auth.service');
const passwordResetService = require('./src/services/passwordReset.service');
const emailService = require('./src/services/email.service');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('--- RUNNING PHASE 10.1 PASSWORD RESET API TESTS ---');

  const testEmail = `pwdreset_${Date.now()}@travelmate.com`;
  const originalPassword = 'InitialPassword123!';
  const newPassword = 'NewSecretPassword456!';
  const unknownEmail = `unknown_${Date.now()}@travelmate.com`;

  try {
    // 0. Setup: Create test user
    const user = await authService.register('Password Test User', testEmail, originalPassword);
    assert(user && user.id, 'Setup test user created');

    // Test 1 & 2 & 3: Account Enumeration Protection
    const unknownRes = await passwordResetService.requestPasswordReset(unknownEmail);
    const validRes = await passwordResetService.requestPasswordReset(testEmail);

    assert(
      unknownRes.message === validRes.message,
      'Test 1, 2, 3: Identical generic response for unknown and valid email (enumeration protected)'
    );
    assert(
      !unknownRes.otp && !validRes.otp && !validRes.reset_token,
      'Test 6: OTP is NOT returned in API response'
    );

    // Test 4: 60-second resend cooldown
    let cooldownCaught = false;
    try {
      await passwordResetService.requestPasswordReset(testEmail);
    } catch (err) {
      if (err.statusCode === 429 && err.message.includes('Please wait')) {
        cooldownCaught = true;
      }
    }
    assert(cooldownCaught, 'Test 4: 60-second resend cooldown enforced (429)');

    // Test 5: OTP generated and stored securely hashed
    const tokenRecord = await db.query(
      'SELECT id, otp_hash, attempt_count, expires_at FROM password_reset_tokens WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [testEmail]
    );
    assert(tokenRecord.rows.length === 1, 'Test 5: Password reset token record created in DB');
    const storedHash = tokenRecord.rows[0].otp_hash;
    assert(storedHash.startsWith('$2'), 'Test 5: OTP is stored securely hashed with bcrypt (never plaintext)');

    // Test 7 & 8: Invalid OTP and failed attempt increment
    let invalidOtpCaught = false;
    try {
      await passwordResetService.verifyResetOtp(testEmail, '000000');
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('incorrect')) {
        invalidOtpCaught = true;
      }
    }
    assert(invalidOtpCaught, 'Test 7: Invalid OTP correctly rejected (400)');

    const recordAfterAttempt = await db.query(
      'SELECT attempt_count FROM password_reset_tokens WHERE id = $1',
      [tokenRecord.rows[0].id]
    );
    assert(recordAfterAttempt.rows[0].attempt_count === 1, 'Test 8: Failed attempt counter incremented to 1');

    // Test 9: 5-attempt lock
    // Set attempt_count to 4 in database to test 5th attempt lock
    await db.query('UPDATE password_reset_tokens SET attempt_count = 4 WHERE id = $1', [tokenRecord.rows[0].id]);
    let fifthAttemptLockCaught = false;
    try {
      await passwordResetService.verifyResetOtp(testEmail, '111111');
    } catch (err) {
      if (err.statusCode === 429 && (err.message.includes('Too many') || err.message.includes('locked'))) {
        fifthAttemptLockCaught = true;
      }
    }
    assert(fifthAttemptLockCaught, 'Test 9a: 5th incorrect attempt triggers rate-limit lock (429)');

    // Verify subsequent attempt is rejected with locked code message
    let lockedCaught = false;
    try {
      await passwordResetService.verifyResetOtp(testEmail, '222222');
    } catch (err) {
      if (err.statusCode === 429 && err.message.includes('locked')) {
        lockedCaught = true;
      }
    }
    assert(lockedCaught, 'Test 9b: Subsequent attempt rejected as locked code (429)');

    // Test 10: Expired OTP rejection
    // Create an expired token record
    const expiredEmail = `expired_${Date.now()}@travelmate.com`;
    await authService.register('Expired Test', expiredEmail, originalPassword);
    const expiredOtpHash = await bcrypt.hash('123456', 10);
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, email, otp_hash, expires_at, attempt_count, created_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '1 minute', 0, NOW() - INTERVAL '15 minutes')`,
      [user.id, expiredEmail, expiredOtpHash]
    );

    let expiredCaught = false;
    try {
      await passwordResetService.verifyResetOtp(expiredEmail, '123456');
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('expired')) {
        expiredCaught = true;
      }
    }
    assert(expiredCaught, 'Test 10: Expired OTP is rejected (400)');

    // Test 11 & 12: Successful OTP verification & reset token issuance
    // Generate a fresh known OTP for testEmail
    const knownOtp = '849201';
    const knownOtpHash = await bcrypt.hash(knownOtp, 10);
    // Remove old tokens for testEmail to bypass cooldown & lockout for testing
    await db.query('DELETE FROM password_reset_tokens WHERE email = $1', [testEmail]);
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, email, otp_hash, expires_at, attempt_count, created_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', 0, NOW())`,
      [user.id, testEmail, knownOtpHash]
    );

    const verifyRes = await passwordResetService.verifyResetOtp(testEmail, knownOtp);
    assert(verifyRes && verifyRes.reset_token, 'Test 11 & 12: OTP verified and 32-byte reset token issued');
    const resetToken = verifyRes.reset_token;
    assert(typeof resetToken === 'string' && resetToken.length === 64, 'Test 12: Reset token is 32-byte hex string (64 characters)');

    // Test 13: Reset token expiration rejection
    const expiredResetToken = 'a'.repeat(64);
    const expiredTokenHash = require('crypto').createHash('sha256').update(expiredResetToken).digest('hex');
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, email, otp_hash, expires_at, verified_at, reset_token_hash, reset_token_expires_at)
       VALUES ($1, $2, 'dummy', NOW(), NOW(), $3, NOW() - INTERVAL '1 minute')`,
      [user.id, testEmail, expiredTokenHash]
    );

    let expiredTokenCaught = false;
    try {
      await passwordResetService.resetPassword(expiredResetToken, newPassword);
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('expired')) {
        expiredTokenCaught = true;
      }
    }
    assert(expiredTokenCaught, 'Test 13: Expired reset token rejected (400)');

    // Test 20: Weak password rejection
    let weakPasswordCaught = false;
    try {
      await passwordResetService.resetPassword(resetToken, 'short');
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('8 characters')) {
        weakPasswordCaught = true;
      }
    }
    assert(weakPasswordCaught, 'Test 20: Weak password (< 8 chars) rejected (400)');

    // Test 14: Password reset success
    const resetRes = await passwordResetService.resetPassword(resetToken, newPassword);
    assert(resetRes && resetRes.message.includes('successfully'), 'Test 14: Password reset completed successfully');

    // Test 15: Old password fails
    let oldLoginFailed = false;
    try {
      await authService.login(testEmail, originalPassword);
    } catch (err) {
      if (err.statusCode === 401) {
        oldLoginFailed = true;
      }
    }
    assert(oldLoginFailed, 'Test 15: Old password login rejected (401)');

    // Test 16: New password succeeds
    const newLoginRes = await authService.login(testEmail, newPassword);
    assert(newLoginRes && newLoginRes.token && newLoginRes.user.email === testEmail, 'Test 16: New password login succeeds (200)');

    // Test 17: Reset token cannot be reused
    let tokenReuseCaught = false;
    try {
      await passwordResetService.resetPassword(resetToken, 'AnotherPassword789!');
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('no longer valid')) {
        tokenReuseCaught = true;
      }
    }
    assert(tokenReuseCaught, 'Test 17: Reset token cannot be reused (single-use enforced)');

    // Test 18: Previous reset tokens are invalidated
    const activeTokens = await db.query(
      'SELECT id FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()',
      [user.id]
    );
    assert(activeTokens.rows.length === 0, 'Test 18: All prior reset tokens for user are invalidated');

    // Test 19: Invalid / malformed reset token fails
    let invalidTokenCaught = false;
    try {
      await passwordResetService.resetPassword('malformed_invalid_token_123', newPassword);
    } catch (err) {
      if (err.statusCode === 400) {
        invalidTokenCaught = true;
      }
    }
    assert(invalidTokenCaught, 'Test 19: Invalid/malformed reset token rejected (400)');

    console.log('\n========================================');
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log('========================================');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    await db.closePool();
  }
}

runTests();
