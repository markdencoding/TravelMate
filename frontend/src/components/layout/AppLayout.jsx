import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AppLayout.css';

/**
 * Main application layout for authenticated pages.
 * Includes sidebar navigation and header.
 * Per DESIGN.md §23: Dashboard, My Trips, Notifications, Profile, Logout.
 */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="app-layout__overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`app-layout__sidebar ${sidebarOpen ? 'app-layout__sidebar--open' : ''}`}>
        <div className="app-layout__sidebar-header">
          <h2 className="app-layout__brand">✈️ TravelMate</h2>
        </div>

        <nav className="app-layout__nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="app-layout__nav-icon">📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/trips"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="app-layout__nav-icon">🗺️</span>
            My Trips
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="app-layout__nav-icon">🔔</span>
            Notifications
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="app-layout__nav-icon">👤</span>
            Profile
          </NavLink>
        </nav>

        <div className="app-layout__sidebar-footer">
          <div className="app-layout__user-info">
            <span className="app-layout__user-name">{user?.full_name || 'Traveler'}</span>
            <span className="app-layout__user-email">{user?.email || ''}</span>
          </div>
          <button className="btn btn-ghost btn-block" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-layout__main">
        {/* Mobile header */}
        <header className="app-layout__header">
          <button
            className="app-layout__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="app-layout__header-title">TravelMate</span>
        </header>

        {/* Page content */}
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
