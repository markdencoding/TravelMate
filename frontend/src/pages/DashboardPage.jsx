import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '../components/common/EmptyState';
import './DashboardPage.css';
import api from '../services/api';

/**
 * Dashboard page — the main landing page for authenticated users.
 * Per DESIGN.md §17: welcome info, upcoming trips, totals, quick actions.
 * Displays real server connectivity status for foundation verification.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [serverStatus, setServerStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch server health on mount (foundation verification)
  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await api.get('/health');
        setServerStatus(response.data);
      } catch (err) {
        setServerStatus({ success: false, message: 'Cannot reach server' });
      } finally {
        setStatusLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}! 👋
        </h1>
        <p className="page-subtitle">Here's your travel planning overview</p>
      </div>

      {/* Server Status Card (foundation verification) */}
      <div className="dashboard__status-card card">
        <h3>System Status</h3>
        {statusLoading ? (
          <p className="text-muted">Checking server connection...</p>
        ) : serverStatus?.success ? (
          <div className="dashboard__status-items">
            <div className="dashboard__status-item dashboard__status-item--ok">
              <span>✅</span> API Server: Running
            </div>
            <div className={`dashboard__status-item ${
              serverStatus.data?.database === 'connected'
                ? 'dashboard__status-item--ok'
                : 'dashboard__status-item--warn'
            }`}>
              <span>{serverStatus.data?.database === 'connected' ? '✅' : '⚠️'}</span>
              Database: {serverStatus.data?.database || 'Unknown'}
            </div>
          </div>
        ) : (
          <div className="dashboard__status-item dashboard__status-item--error">
            <span>❌</span> Server: Not reachable
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard__section">
        <h3 className="dashboard__section-title">Quick Actions</h3>
        <div className="dashboard__quick-actions">
          <button className="btn btn-primary" disabled title="Coming in next phase">
            ➕ Create Trip
          </button>
          <button className="btn btn-secondary" disabled title="Coming in next phase">
            💰 Add Expense
          </button>
          <button className="btn btn-secondary" disabled title="Coming in next phase">
            📋 Add Activity
          </button>
        </div>
      </div>

      {/* Upcoming Trips (empty state for now) */}
      <div className="dashboard__section">
        <h3 className="dashboard__section-title">Upcoming Trips</h3>
        <EmptyState
          icon="🌍"
          title="No trips yet"
          description="Start planning your next adventure. Create your first trip to get started."
          action={
            <button className="btn btn-primary" disabled title="Coming in next phase">
              Create Your First Trip
            </button>
          }
        />
      </div>
    </div>
  );
}
