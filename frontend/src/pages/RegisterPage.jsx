import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

/**
 * Registration page.
 * Creates a new user via POST /api/auth/register.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      if (result.success) {
        navigate('/login', {
          state: { message: 'Account created successfully! Please sign in.' },
        });
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to create account. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Create your account</h2>
      <p className="auth-page__subtitle">Start planning your next adventure</p>

      {error && (
        <div className="auth-page__error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-page__form">
        <div className="form-group">
          <label htmlFor="register-name" className="form-label">Full Name</label>
          <input
            id="register-name"
            name="full_name"
            type="text"
            className="form-input"
            placeholder="John Doe"
            value={formData.full_name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-email" className="form-label">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-password" className="form-label">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            className="form-input"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-confirm" className="form-label">Confirm Password</label>
          <input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            className="form-input"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="auth-page__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
