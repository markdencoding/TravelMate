import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboardService';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';
import WeatherWidget from '../components/weather/WeatherWidget';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [serverStatus, setServerStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch server health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await api.get('/health');
        setServerStatus(response.data);
      } catch (err) {
        setServerStatus({ success: false, message: 'Cannot reach server' });
      }
    }
    checkHealth();
  }, []);

  // Fetch dashboard aggregate data
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await dashboardService.getDashboard();
        if (result.success) {
          setDashboardData(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // timeString from PG is like "14:30:00"
    const [h, m] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(h, 10), parseInt(m, 10));
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading dashboard...</div>;
  }

  const { total_trips, upcoming_trips, active_trip, next_upcoming_trip } = dashboardData || {};

  // The "Spotlight" trip is either the active one right now, or the next upcoming one
  const spotlightTrip = active_trip || next_upcoming_trip;

  return (
    <div className="dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your upcoming trips and stats</p>
        </div>
      </div> {total_trips === 0 ? (
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
        <div className="dashboard-grid">
          
          {/* Main Column */}
          <div className="dashboard-main flex flex-col gap-6">
            
            {/* Spotlight Trip (Active or Next) */}
            {spotlightTrip && (
              <div className="spotlight-card card border-primary p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="badge bg-primary-light text-primary mb-2 inline-block">
                      {active_trip ? '🔥 Active Now' : '🗓️ Next Upcoming'}
                    </span>
                    <h2 className="text-2xl font-bold">
                      <Link to={`/trips/${spotlightTrip.id}`} className="hover:text-primary transition-colors">
                        {spotlightTrip.name}
                      </Link>
                    </h2>
                    <p className="text-muted mt-1">
                      {formatDate(spotlightTrip.start_date)} — {formatDate(spotlightTrip.end_date)}
                    </p>
                  </div>
                  <Link to={`/trips/${spotlightTrip.id}`} className="btn btn-primary btn-sm">
                    Open Trip
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Next Activity Box */}
                  <div className="dashboard-inset">
                    <h4 className="dashboard-inset__label">Next Activity</h4>
                    {spotlightTrip.next_activity ? (
                      <div>
                        <div className="font-bold text-lg">{spotlightTrip.next_activity.name}</div>
                        <div className="text-sm text-primary mt-1">
                          📅 {formatDate(spotlightTrip.next_activity.date)} at {formatTime(spotlightTrip.next_activity.start_time)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-sm italic">No upcoming activities scheduled.</div>
                    )}
                  </div>

                  {/* Budget Box */}
                  <div className="dashboard-inset">
                    <h4 className="dashboard-inset__label">Budget</h4>
                    {spotlightTrip.budget_summary ? (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Spent: ${spotlightTrip.budget_summary.total_spent.toFixed(2)}</span>
                          <span className="font-bold">Total: ${spotlightTrip.budget_summary.total_budget.toFixed(2)}</span>
                        </div>
                        <div className="dashboard-progress-track">
                          <div 
                            className={`dashboard-progress-bar ${spotlightTrip.budget_summary.remaining_budget < 0 ? 'bg-error' : 'bg-primary'}`}
                            style={{ 
                              width: `${spotlightTrip.budget_summary.total_budget > 0 
                                ? Math.min(100, (spotlightTrip.budget_summary.total_spent / spotlightTrip.budget_summary.total_budget) * 100) 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <div className={`text-xs mt-2 font-bold ${spotlightTrip.budget_summary.remaining_budget < 0 ? 'text-error' : 'text-success'}`}>
                          Remaining: ${spotlightTrip.budget_summary.remaining_budget.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-sm italic">No budget set.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Trips List */}
            <div className="dashboard-section card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Upcoming Trips</h3>
                <Link to="/trips" className="text-sm text-primary hover:underline">View all ({total_trips})</Link>
              </div>
              
              {upcoming_trips && upcoming_trips.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {upcoming_trips.map(trip => (
                    <div key={trip.id} className="dashboard-trip-row">
                      <div>
                        <Link to={`/trips/${trip.id}`} className="font-bold hover:text-primary">
                          {trip.name}
                        </Link>
                        <div className="text-sm text-muted">
                          {trip.primary_destination && `📍 ${trip.primary_destination} • `}
                          {formatDate(trip.start_date)}
                        </div>
                      </div>
                      <Link to={`/trips/${trip.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted italic">No other upcoming trips.</div>
              )}
            </div>

          </div>
          
          {/* Sidebar */}
          <div className="dashboard-sidebar flex flex-col gap-6">
            
            {/* Weather Widget */}
            {spotlightTrip && spotlightTrip.destination ? (
              <WeatherWidget 
                latitude={spotlightTrip.destination.latitude} 
                longitude={spotlightTrip.destination.longitude} 
              />
            ) : spotlightTrip ? (
              <div className="weather-widget error">
                <p className="text-muted text-sm text-center">
                  Weather unavailable.<br/>Add a destination map location to view weather.
                </p>
              </div>
            ) : null}

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <button className="btn btn-primary w-full text-left justify-start" onClick={() => navigate('/trips/new')}>
                  ➕ Create New Trip
                </button>
                <button className="btn btn-secondary w-full text-left justify-start" onClick={() => navigate('/trips')}>
                  🌍 View All Trips
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
