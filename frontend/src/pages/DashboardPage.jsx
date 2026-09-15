import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import tripService from '../services/tripService';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';
import './DashboardPage.css';

/**
 * Dashboard page — the main landing page for authenticated users.
 * Displays real server connectivity status and actual trip summaries.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [serverStatus, setServerStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);

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

  // Fetch trips summary
  useEffect(() => {
    async function fetchTrips() {
      try {
        const result = await tripService.getTrips();
        if (result.success) {
          setTrips(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch trips for dashboard", err);
      } finally {
        setTripsLoading(false);
      }
    }
    fetchTrips();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}! 👋
        </h1>
        <p className="page-subtitle">Here's your travel planning overview</p>
      </div>

      {/* Server Status Card */}
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
          <button className="btn btn-primary" onClick={() => navigate('/trips/new')}>
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

      {/* Upcoming Trips */}
      <div className="dashboard__section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 className="dashboard__section-title" style={{ marginBottom: 0 }}>Recent Trips</h3>
          <Link to="/trips" className="text-sm">View all</Link>
        </div>
        
        {tripsLoading ? (
          <p className="text-muted">Loading trips...</p>
        ) : trips.length === 0 ? (
          <EmptyState
            icon="🌍"
            title="No trips yet"
            description="Start planning your next adventure. Create your first trip to get started."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/trips/new')}>
                Create Your First Trip
              </button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {trips.slice(0, 3).map(trip => (
              <div key={trip.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0' }}>
                    <Link to={`/trips/${trip.id}`} style={{ textDecoration: 'none', color: 'var(--color-primary)' }}>
                      {trip.name}
                    </Link>
                  </h4>
                  <p className="text-sm text-muted" style={{ margin: 0 }}>
                    {trip.primary_destination && `📍 ${trip.primary_destination} `}
                    {trip.start_date && `📅 ${formatDate(trip.start_date)}`}
                  </p>
                </div>
                <Link to={`/trips/${trip.id}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
