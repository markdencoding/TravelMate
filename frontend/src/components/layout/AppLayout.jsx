import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import NotificationBell from './NotificationBell';
import './AppLayout.css';

/**
 * Main application layout for authenticated pages.
 * Includes unified sidebar navigation, header with theme toggle, and main content area.
 */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('travelmate-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('travelmate-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await notificationService.getUnreadCount();
        if (res.success) {
          setUnreadCount(res.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    }
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'app-layout--collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="app-layout__overlay" onClick={closeMobileMenu} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside 
        className={`app-layout__sidebar ${mobileMenuOpen ? 'app-layout__sidebar--mobile-open' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="app-layout__sidebar-header">
          <div className="app-layout__brand" title="TravelMate">
            <svg 
              className="app-layout__brand-icon" 
              width="26" 
              height="26" 
              viewBox="0 0 24 24" 
              fill="#1e70ff" 
              aria-hidden="true"
            >
              <path 
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                transform="rotate(45 12 12)" 
              />
            </svg>
            {!sidebarCollapsed && (
              <span className="app-layout__brand-text">
                <span className="brand-text">Travel</span><span className="brand-blue">Mate</span>
              </span>
            )}
          </div>
          <button 
            className="app-layout__collapse-btn desktop-only"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <polyline points="13 17 18 12 13 7" />
              ) : (
                <polyline points="11 17 6 12 11 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="app-layout__nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeMobileMenu}
            title="Dashboard"
          >
            <svg className="app-layout__nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            {!sidebarCollapsed && <span className="app-layout__nav-text">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/trips"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeMobileMenu}
            title="My Trips"
          >
            <svg className="app-layout__nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            {!sidebarCollapsed && <span className="app-layout__nav-text">My Trips</span>}
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeMobileMenu}
            title="Notifications"
          >
            <span className={`app-layout__nav-icon-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
              <svg className="app-layout__nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {!sidebarCollapsed && <span className="app-layout__nav-text">Notifications</span>}
              {unreadCount > 0 && (
                <span className="app-layout__badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `app-layout__nav-link ${isActive ? 'app-layout__nav-link--active' : ''}`}
            onClick={closeMobileMenu}
            title="Profile"
          >
            <svg className="app-layout__nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {!sidebarCollapsed && <span className="app-layout__nav-text">Profile</span>}
          </NavLink>
        </nav>

        <div className="app-layout__sidebar-footer">
          {!sidebarCollapsed ? (
            <div className="app-layout__user-card">
              <div className="app-layout__avatar" aria-hidden="true">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="app-layout__user-info">
                <span className="app-layout__user-name">{user?.full_name || 'Traveler'}</span>
                <span className="app-layout__user-email">{user?.email || ''}</span>
              </div>
            </div>
          ) : (
            <div className="app-layout__avatar app-layout__avatar--collapsed" title={user?.email} aria-label={user?.full_name || 'User Profile'}>
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <button 
            className={`btn btn-ghost app-layout__logout-btn ${sidebarCollapsed ? 'app-layout__logout-btn--collapsed' : 'btn-block'}`} 
            onClick={handleLogout} 
            title="Logout"
            aria-label="Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-layout__main">
        {/* Top Header */}
        <header className="app-layout__header">
          <div className="app-layout__header-left">
            <button
              className="app-layout__menu-btn mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="app-layout__header-brand mobile-only">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1e70ff" aria-hidden="true">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(45 12 12)" />
              </svg>
              <span className="app-layout__header-brand-name">
                <span className="brand-text">Travel</span><span className="brand-blue">Mate</span>
              </span>
            </div>
          </div>
          
          <div className="app-layout__header-right flex items-center gap-3">
            {/* Notification Bell with Dropdown */}
            <NotificationBell unreadCount={unreadCount} onUpdateUnread={setUnreadCount} />

            {/* Theme Toggle Pill */}
            <button 
              type="button"
              className="app-header-theme-pill" 
              onClick={toggleTheme} 
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className={`theme-pill-icon ${theme === 'light' ? 'active' : ''}`} title="Light mode">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
              <span className={`theme-pill-icon ${theme === 'dark' ? 'active' : ''}`} title="Dark mode">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
            </button>
          </div>
        </header>

        {/* Main page content wrapper */}
        <main className="app-layout__content">
          <div className="app-layout__content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
