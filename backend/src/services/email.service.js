const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
let lastSentMail = null; // Stored in memory for test verification

/**
 * Check if real SMTP delivery is configured.
 * @returns {boolean}
 */
function isSmtpConfigured() {
  return Boolean(config.smtp.host && config.smtp.user);
}

/**
 * Get or initialize the email transporter.
 * @returns {Promise<object>}
 */
async function getTransporter() {
  if (transporter) return transporter;

  if (isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
    return transporter;
  }

  // Development/testing fallback when SMTP credentials are not yet configured
  if (config.nodeEnv !== 'production') {
    try {
      // Try to create an Ethereal test account for real SMTP message rendering
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('[EmailService] Created test Ethereal SMTP account:', testAccount.user);
      return transporter;
    } catch (etherealErr) {
      console.warn('[EmailService] Could not reach Ethereal; using JSON transport for local test:', etherealErr.message);
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return transporter;
    }
  }

  throw new Error('SMTP email service is not configured.');
}

/**
 * Send a password reset OTP email.
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit numeric OTP
 * @returns {Promise<{ messageId: string, previewUrl?: string }>}
 */
async function sendPasswordResetEmail(toEmail, otp) {
  const mailTransporter = await getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelMate Password Reset Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 36px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .brand { display: flex; align-items: center; margin-bottom: 24px; font-size: 24px; font-weight: 700; color: #ffffff; }
        .brand-blue { color: #1e70ff; }
        h1 { font-size: 20px; margin-bottom: 12px; color: #ffffff; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
        .otp-box { background: rgba(30, 112, 255, 0.12); border: 2px dashed #1e70ff; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 0; }
        .warning-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-top: 24px; }
        .warning-text { font-size: 12px; color: #fca5a5; margin: 0; }
        .footer { font-size: 11px; color: #64748b; text-align: center; margin-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">
          <span>Travel<span class="brand-blue">Mate</span></span>
        </div>
        <h1>Password Reset Verification</h1>
        <p>We received a request to reset your TravelMate account password. Use the verification code below to complete your password reset:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>

        <p><strong>This code will expire in ${config.passwordReset.otpExpiryMinutes} minutes.</strong></p>
        
        <div class="warning-box">
          <p class="warning-text">⚠️ <strong>Security Notice:</strong> Never share this code with anyone. TravelMate support will never ask for your verification code. If you did not request this password reset, please ignore this email.</p>
        </div>

        <div class="footer">
          &copy; ${new Date().getFullYear()} TravelMate. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
TravelMate — Password Reset Verification

We received a request to reset your TravelMate account password.
Your 6-digit verification code is:

${otp}

This code expires in ${config.passwordReset.otpExpiryMinutes} minutes.

Security Notice: Never share this verification code with anyone. TravelMate support will never ask for this code.
If you did not request this password reset, you can safely ignore this email.

— TravelMate
  `.trim();

  const mailOptions = {
    from: config.smtp.from,
    to: toEmail,
    subject: 'TravelMate Password Reset Code',
    text: textContent,
    html: htmlContent,
  };

  const info = await mailTransporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

  lastSentMail = {
    to: toEmail,
    subject: mailOptions.subject,
    messageId: info.messageId,
    previewUrl,
    timestamp: new Date(),
  };

  if (previewUrl) {
    console.log('[EmailService] Test email preview URL:', previewUrl);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}

/**
 * Get the last sent mail summary (for tests).
 * @returns {object|null}
 */
function getLastSentMail() {
  return lastSentMail;
}

/**
 * Reset transporter (for testing).
 */
function resetTransporter() {
  transporter = null;
  lastSentMail = null;
}

module.exports = {
  sendPasswordResetEmail,
  isSmtpConfigured,
  getLastSentMail,
  resetTransporter,
};
