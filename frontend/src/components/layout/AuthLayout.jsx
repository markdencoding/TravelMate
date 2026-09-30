import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TouristAttractionCarousel from '../auth/TouristAttractionCarousel';
import { getInitialTheme, saveThemePreference } from '../../utils/themeUtils';
import './AuthLayout.css';

/**
 * Layout for unauthenticated pages (login, register).
 * Continuous cinematic background with floating frosted glass card matching reference image.
 */
export default function AuthLayout() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      saveThemePreference(next);
      return next;
    });
  };

  return (
    <div className="auth-layout" data-auth-theme={theme}>
      {/* Full-screen continuous background slideshow */}
      <div className="auth-layout__slideshow">
        <TouristAttractionCarousel theme={theme} />
      </div>

      {/* Atmospheric gradient overlay for enhanced readability */}
      <div className="auth-layout__fade" aria-hidden="true"></div>

      {/* Top Header spanning entire viewport width */}
      <header className="auth-layout__header">
        {/* Top Left Branding */}
        <div className="auth-layout__brand">
          <div className="auth-brand-logo">
            <svg className="auth-plane-icon" width="28" height="28" viewBox="0 0 24 24" fill="#1e70ff" aria-hidden="true">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(45 12 12)" />
            </svg>
            <span className="auth-brand-name">
              <span className="brand-white">Travel</span><span className="brand-blue">Mate</span>
            </span>
          </div>
          <span className="auth-brand-tagline">Your Journey. Our Priority.</span>
        </div>

        {/* Top Right Navigation & Theme Toggle */}
        <div className="auth-layout__header-right">
          <nav className="auth-nav-links" aria-label="Quick links">
            <span className="auth-nav-item">Discover</span>
            <span className="auth-nav-bullet" aria-hidden="true">•</span>
            <span className="auth-nav-item">Plan</span>
            <span className="auth-nav-bullet" aria-hidden="true">•</span>
            <span className="auth-nav-item">Explore</span>
          </nav>

          {/* Theme Toggle Pill */}
          <button 
            type="button"
            className="auth-theme-pill" 
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className={`theme-pill-thumb ${theme === 'dark' ? 'dark' : 'light'}`}></div>
            <span className={`pill-icon sun ${theme === 'light' ? 'active' : ''}`} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="1" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </span>
            <span className={`pill-icon moon ${theme === 'dark' ? 'active' : ''}`} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </span>
          </button>
        </div>
      </header>

      {/* Hero Section (Center Left) */}
      <section className="auth-layout__hero" aria-label="Hero section">
        <span className="auth-hero-eyebrow">TRAVEL  •  EXPLORE  •  DISCOVER</span>
        <h1 className="auth-hero-heading">
          Explore the World<br />
          With <span className="hero-blue">TravelMate</span>
        </h1>
        <p className="auth-hero-subtext">
          Plan your dream trips, discover amazing destinations,<br />
          and create unforgettable memories.
        </p>
      </section>

      {/* Right Floating Authentication Panel */}
      <main className="auth-layout__panel" role="main">
        <div className="auth-layout__card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
