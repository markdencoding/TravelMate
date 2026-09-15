import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

/**
 * Layout for unauthenticated pages (login, register).
 * Centered card layout with branding.
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__brand">
          <h1 className="auth-layout__logo">✈️ TravelMate</h1>
          <p className="auth-layout__tagline">Plan your perfect journey</p>
        </div>
        <div className="auth-layout__card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
