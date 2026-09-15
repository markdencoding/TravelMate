import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

/**
 * Login page.
 * Authenticates user via POST /api/auth/login.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to connect. Please check your connection and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2 className="auth-page__title">Welcome back</h2>
      <p className="auth-page__subtitle">Sign in to your account</p>

      {error && (
        <div className="auth-page__error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-page__form">
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="form-label">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            className="form-input"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-page__footer">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
