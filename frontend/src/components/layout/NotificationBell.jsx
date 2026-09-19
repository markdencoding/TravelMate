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

  const getIcon = (type) => {
    switch (type) {
      case 'trip': return '✈️';
      case 'reminder': return '📅';
      case 'budget': return '💰';
      default: return '🔔';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-btn"
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
        <div className="notification-dropdown animate-fade-in" role="dialog" aria-label="Notifications preview">
          <div className="notification-dropdown__header flex justify-between items-center p-3 border-b border-border">
            <h4 className="font-bold text-sm">Notifications</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  Mark all read
                </button>
              )}
              <Link
                to="/notifications"
                className="text-xs text-primary font-semibold hover:underline"
                onClick={() => setOpen(false)}
              >
                View All
              </Link>
            </div>
          </div>

          <div className="notification-dropdown__list">
            {loading ? (
              <div className="p-4 text-center text-xs text-muted">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">
                <span>🎉</span> No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-dropdown__item p-3 flex gap-2.5 items-start cursor-pointer border-b border-border transition-colors ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notif)}
                >
                  <span className="notification-dropdown__icon text-base leading-none mt-0.5">
                    {getIcon(notif.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="text-xs font-bold text-main truncate">{notif.title}</h5>
                      <span className="text-[10px] text-muted whitespace-nowrap">{formatTime(notif.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 mt-0.5 leading-snug">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <span className="notification-unread-dot" title="Unread" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="notification-dropdown__footer p-2 text-center bg-surface-secondary">
            <Link
              to="/notifications"
              className="text-xs text-primary font-medium hover:underline block py-0.5"
              onClick={() => setOpen(false)}
            >
              See all notifications in Notification Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
