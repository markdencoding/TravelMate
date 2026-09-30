import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import './NotificationBell.css';

export default function NotificationBell({ unreadCount, onUpdateUnread }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Fetch recent notifications when dropdown opens
  const fetchRecent = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data.slice(0, 5)); // show up to 5 most recent
      }
    } catch (err) {
      console.warn('Failed to load notifications preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open) {
      fetchRecent();
    }
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onUpdateUnread) onUpdateUnread(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        if (onUpdateUnread) onUpdateUnread(Math.max(0, unreadCount - 1));
      } catch (err) {
        console.warn('Failed to mark notification read:', err);
      }
    }
    setOpen(false);
    navigate('/notifications');
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const d = new Date(dateStr);
      const diffSec = Math.floor((now - d) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'trip': return { icon: '✈️', badgeClass: 'notif-badge-trip' };
      case 'reminder': return { icon: '📅', badgeClass: 'notif-badge-reminder' };
      case 'budget': return { icon: '💰', badgeClass: 'notif-badge-budget' };
      default: return { icon: '🔔', badgeClass: 'notif-badge-default' };
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`notification-bell-btn ${open ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        title="Notifications"
      >
        <svg 
          className="notification-bell-icon" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="notification-dropdown animate-scale-in" role="dialog" aria-label="Notifications preview">
          {/* Header */}
          <div className="notification-dropdown__header flex justify-between items-center px-3.5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-main m-0">Notifications</h4>
              {unreadCount > 0 && (
                <span className="notification-unread-count-tag text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="notification-mark-all-btn text-[11px] font-semibold text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="notification-dropdown__list">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted">
                <div className="notification-loading-spinner mb-2">⏳</div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted flex flex-col items-center justify-center">
                <span className="text-2xl mb-1.5 opacity-80">🎉</span>
                <span className="font-semibold text-main">All caught up!</span>
                <span className="text-[11px] opacity-75 mt-0.5">No new notifications at this time.</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon, badgeClass } = getTypeStyle(notif.type);
                const isUnread = !notif.is_read;

                return (
                  <div
                    key={notif.id}
                    className={`notification-dropdown__item px-3.5 py-2.5 flex gap-2.5 items-start cursor-pointer border-b border-border transition-colors ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                  >
                    <div className={`notification-item-icon-wrap ${badgeClass}`} aria-hidden="true">
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1.5 mb-0.5">
                        <h5 className={`text-xs m-0 truncate ${isUnread ? 'font-bold text-main' : 'font-medium text-main'}`}>
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-muted whitespace-nowrap flex-shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 m-0 leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="notification-unread-dot" title="Unread" aria-label="Unread notification" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notification-dropdown__footer p-2 text-center border-t border-border">
            <Link
              to="/notifications"
              className="notification-view-all-link text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1 py-1"
              onClick={() => setOpen(false)}
            >
              <span>View all notifications</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
