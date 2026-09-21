import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve reset authorization token from transient navigation state
  const resetToken = location.state?.reset_token;
  const email = location.state?.email;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Requirements checks
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!resetToken) {
      setError('This password reset session is no longer valid. Please request a new verification code.');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(resetToken, password);
      setIsSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If token is missing, render invalid session card
  if (!resetToken && !isSuccess) {
    return (
      <div className="auth-card-inner text-center">
        <div className="auth-card__brand justify-center">
          <svg className="auth-card__plane" width="28" height="28" viewBox="0 0 24 24" fill="#1e70ff" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(45 12 12)" />
          </svg>
          <span className="auth-card__brand-title">
            <span className="brand-white">Travel</span><span className="brand-blue">Mate</span>
          </span>
        </div>

        <div className="auth-status-icon warning" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        <h2 className="auth-card__title text-center">Session Invalid or Expired</h2>
        <p className="auth-card__subtitle text-center">
          This password reset session is no longer valid. Please request a new verification code to continue.
        </p>

        <Link to="/forgot-password" className="auth-submit-btn justify-center mt-6 text-decoration-none">
          Request New Code
        </Link>
      </div>
    );
  }

  // Success state view
  if (isSuccess) {
    return (
      <div className="auth-card-inner text-center">
        <div className="auth-card__brand justify-center">
          <svg className="auth-card__plane" width="28" height="28" viewBox="0 0 24 24" fill="#1e70ff" aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(45 12 12)" />
          </svg>
          <span className="auth-card__brand-title">
            <span className="brand-white">Travel</span><span className="brand-blue">Mate</span>
          </span>
        </div>

        <div className="auth-status-icon success" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <h2 className="auth-card__title text-center">Password Changed Successfully</h2>
        <p className="auth-card__subtitle text-center">
          Your TravelMate password has been updated. You can now sign in with your new credentials.
        </p>

        <button
          type="button"
          className="auth-submit-btn justify-center mt-6"
          onClick={() => navigate('/login')}
        >
          <span>Return to Login</span>
          <svg className="auth-btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    );
  }

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

      <h2 className="auth-card__title">Create a New Password</h2>
      <p className="auth-card__subtitle">
        {email ? `Resetting password for ${email}.` : 'Enter and confirm your new password below.'}
      </p>

      {error && (
        <div className="auth-card__error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-card__form" noValidate>
        {/* New Password */}
        <div className="auth-form-group">
          <label htmlFor="new-password" className="auth-label">New Password</label>
          <div className="auth-input-container">
            <span className="auth-field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              id="new-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input has-toggle"
              placeholder="Enter at least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="auth-form-group">
          <label htmlFor="confirm-password" className="auth-label">Confirm New Password</label>
          <div className="auth-input-container">
            <span className="auth-field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              id="confirm-password"
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              className="auth-input has-toggle"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Live Requirements Checklist */}
        <div className="auth-requirements-box">
          <div className="auth-req-title">Password Requirements:</div>
          <div className={`auth-req-item ${hasMinLength ? 'met' : ''}`}>
            <span className="auth-req-icon">{hasMinLength ? '✓' : '○'}</span>
            <span>At least 8 characters long</span>
          </div>
          <div className={`auth-req-item ${passwordsMatch ? 'met' : ''}`}>
            <span className="auth-req-icon">{passwordsMatch ? '✓' : '○'}</span>
            <span>Passwords match</span>
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit-btn mt-6"
          disabled={loading || !hasMinLength || !passwordsMatch}
        >
          <span>{loading ? 'Changing Password...' : 'Change Password'}</span>
          {!loading && (
            <svg className="auth-btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          )}
        </button>
      </form>

      <div className="auth-card__footer">
        <Link to="/login" className="auth-back-link">
          ← Cancel and Return to Login
        </Link>
      </div>
    </div>
  );
}
