import { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import EmptyState from '../../components/common/EmptyState';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) => 
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => 
          prev.map((n) => ({ ...n, is_read: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'trip': return '✈️';
      case 'reminder': return '⏰';
      case 'budget': return '💰';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading notifications...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-error">{error}</div>;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-page max-w-4xl mx-auto">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on your upcoming trips and activities</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="You're all caught up!"
          description="You have no notifications right now."
        />
      ) : (
        <div className="notifications-list flex flex-col gap-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon-wrap" aria-hidden="true">
                {getIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="notification-title">
                    {notification.title}
                  </h3>
                  <span className="notification-time">
                    {formatDate(notification.created_at)}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>
                
                {!notification.is_read && (
                  <button 
                    className="notification-action-btn"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
