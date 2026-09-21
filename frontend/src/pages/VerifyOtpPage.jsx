import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import './AuthPages.css';

/**
 * Mask an email address for privacy.
 * Example: john.doe@example.com -> j***e@example.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from transient navigation state or local fallback state
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Redirect if no email provided
  useEffect(() => {
    if (!initialEmail) {
      setError('Please start by requesting a verification code with your email.');
    }
  }, [initialEmail]);

  // Resend cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, '');

    // If empty, just clear
    if (!cleanValue) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // Take only the last entered digit
    const digit = cleanValue[cleanValue.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input if available
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Paste of 6 digits
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasteData.length >= 6) {
      const digits = pasteData.slice(0, 6).split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please restart from Forgot Password.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyResetOtp(email.trim(), otpCode);
      const resetToken = response.data?.reset_token;

      if (!resetToken) {
        throw new Error('Reset authorization token not received.');
      }

      setSuccessMsg('Code verified successfully. Proceeding to password reset...');

      // Navigate to /reset-password passing reset_token in transient state
      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            reset_token: resetToken,
            email: email.trim(),
          },
        });
      }, 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid verification code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      await authService.forgotPassword(email.trim());
      setSuccessMsg('A new verification code has been sent to your email.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not resend code. Please try again.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-card-inner">
      {/* Brand */}
      <div className="auth-card__brand">
        <svg className="auth-card__plane" width="28" height="28" viewBox="0 0 24 24" fill="#1e70ff" aria-hidden="true">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(45 12 12)" />
        </svg>
        <span className="auth-card__brand-title">
          <span className="brand-white">Travel</span><span className="brand-blue">Mate</span>
        </span>
      </div>

      <h2 className="auth-card__title">Verify Your Email</h2>
      <p className="auth-card__subtitle">
        We sent a 6-digit verification code to:{' '}
        <span className="auth-highlight-email">{maskEmail(email) || 'your email'}</span>
      </p>

      {error && (
        <div className="auth-card__error" role="alert">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="auth-card__success" role="status">
          <span className="auth-success-icon" aria-hidden="true">✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {!initialEmail && !email ? (
        <div className="text-center py-4">
          <Link to="/forgot-password" className="auth-submit-btn inline-flex">
            Request Verification Code
          </Link>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="auth-card__form">
          <div className="auth-form-group">
            <label className="auth-label text-center block mb-3">Verification Code</label>
            
            {/* 6-digit OTP input grid */}
            <div className="auth-otp-grid" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className={`auth-otp-slot ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={loading}
                  autoFocus={idx === 0}
                  aria-label={`Verification digit ${idx + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn mt-6"
            disabled={loading || otpDigits.join('').length !== 6}
          >
            <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
            {!loading && (
              <svg className="auth-btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            )}
          </button>

          {/* Resend Code option */}
          <div className="auth-resend-row">
            <span className="auth-resend-prompt">Didn't receive the code?</span>{' '}
            {cooldown > 0 ? (
              <span className="auth-resend-cooldown">Resend code in {cooldown}s</span>
            ) : (
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="auth-card__footer">
        <Link to="/forgot-password" className="auth-back-link">
          ← Change Email
        </Link>
      </div>
    </div>
  );
}
