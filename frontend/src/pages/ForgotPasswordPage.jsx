import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './AuthPages.css';

/**
 * ForgotPasswordPage — Request password recovery OTP.
 * Privacy-preserving: Returns generic message without exposing account existence.
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      const msg = response.message || 'If the email is associated with a TravelMate account, a password reset code has been sent.';
      setSuccessMessage(msg);

      // Navigate to OTP verification page after short delay, passing email in transient state
      setTimeout(() => {
        navigate('/verify-reset-otp', { state: { email: email.trim() } });
      }, 1200);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to request password reset code. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-inner">
      {/* Brand inside the card */}
      <div className="auth-card__brand">
        <svg className="auth-card__plane" width="28" height="28" viewBox="0 0 24 24" fill="#1e70ff" aria-hidden="true">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(45 12 12)" />
        </svg>
        <span className="auth-card__brand-title">
          <span className="brand-white">Travel</span><span className="brand-blue">Mate</span>
        </span>
      </div>

      <h2 className="auth-card__title">Forgot Password</h2>
      <p className="auth-card__subtitle">Enter the email address associated with your TravelMate account to receive a 6-digit verification code.</p>

      {error && (
        <div className="auth-card__error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="auth-card__success" role="status">
          <span className="auth-success-icon" aria-hidden="true">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-card__form" noValidate>
        <div className="auth-form-group">
          <label htmlFor="reset-email" className="auth-label">Email Address</label>
          <div className="auth-input-container">
            <span className="auth-field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </span>
            <input
              id="reset-email"
              name="email"
              type="email"
              className="auth-input"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          <span>{loading ? 'Sending Code...' : 'Send Reset Code'}</span>
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
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
