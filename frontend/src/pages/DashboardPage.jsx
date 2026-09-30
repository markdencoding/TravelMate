import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboardService';
import api from '../services/api';
import currencyService from '../services/currencyService';
import EmptyState from '../components/common/EmptyState';
import WeatherWidget from '../components/weather/WeatherWidget';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [serverStatus, setServerStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spotlightConvertedBudget, setSpotlightConvertedBudget] = useState(null);

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

  const { total_trips, upcoming_trips, active_trip, next_upcoming_trip } = dashboardData || {};

  // The "Spotlight" trip is either the active one right now, or the next upcoming one
  const spotlightTrip = active_trip || next_upcoming_trip;
  const spotlightBaseCurrency = spotlightTrip?.base_currency || 'PHP';
  const spotlightDestCurrency = spotlightTrip?.destination?.currency || (spotlightBaseCurrency === 'PHP' ? 'JPY' : 'PHP');

  useEffect(() => {
    if (!spotlightTrip?.budget_summary?.total_budget || !spotlightDestCurrency || spotlightBaseCurrency === spotlightDestCurrency) {
      setSpotlightConvertedBudget(null);
      return;
    }
    let isMounted = true;
    currencyService.convert(spotlightTrip.budget_summary.total_budget, spotlightBaseCurrency, spotlightDestCurrency)
      .then(res => {
        if (isMounted && res.success && res.data) {
          setSpotlightConvertedBudget(res.data.converted_amount);
        }
      })
      .catch(err => console.warn('Spotlight conversion err:', err));

    return () => { isMounted = false; };
  }, [spotlightTrip?.budget_summary?.total_budget, spotlightBaseCurrency, spotlightDestCurrency]);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* Compact Dashboard Toolbar (No greeting / welcome banner) */}
      <div className="dashboard-toolbar flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-2">
          <h1 className="dashboard-toolbar__title text-base font-bold text-main m-0">
            Travel Overview
          </h1>
          {active_trip ? (
            <span className="badge bg-success-light text-success text-[11px] font-bold py-0.5 px-2">
              ● Active Trip
            </span>
          ) : upcoming_trips && upcoming_trips.length > 0 ? (
            <span className="badge bg-primary-light text-primary text-[11px] font-bold py-0.5 px-2">
              🗓️ {upcoming_trips.length} Upcoming
            </span>
          ) : null}
        </div>
        <div className="dashboard-toolbar__actions flex items-center gap-2">
          <button 
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3" 
            onClick={() => navigate('/trips/new')}
          >
            <span>➕</span> New Trip
          </button>
          <button 
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3" 
            onClick={() => navigate('/trips')}
          >
            <span>🌍</span> All Trips
          </button>
        </div>
      </div>

      {total_trips === 0 ? (
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
          <div className="dashboard-main flex flex-col gap-3.5">
            
            {/* Spotlight Trip (Active or Next) */}
            {spotlightTrip && (
              <div className="spotlight-card card border-primary p-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="badge bg-primary-light text-primary text-[11px] font-bold uppercase tracking-wider py-0.5 px-2">
                        {active_trip ? '🔥 Active Now' : '🗓️ Next Trip'}
                      </span>
                      {spotlightTrip.primary_destination && (
                        <span className="badge bg-surface-secondary text-main text-[11px] border border-border font-semibold py-0.5 px-2">
                          📍 {spotlightTrip.primary_destination}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-extrabold text-main truncate">
                      <Link to={`/trips/${spotlightTrip.id}`} className="hover:text-primary transition-colors">
                        {spotlightTrip.name}
                      </Link>
                    </h2>
                    <p className="text-muted text-xs mt-0.5 flex items-center gap-1.5">
                      <span>📅</span> {formatDate(spotlightTrip.start_date)} — {formatDate(spotlightTrip.end_date)}
                    </p>
                  </div>
                  <Link to={`/trips/${spotlightTrip.id}`} className="btn btn-primary btn-sm whitespace-nowrap text-xs py-1.5 px-3">
                    Open Trip →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                  {/* Next Activity Box */}
                  <div className="dashboard-inset p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="dashboard-inset__label text-[10px]">Next Activity</span>
                      {spotlightTrip.next_activity && (
                        <span className="text-[11px] font-semibold text-primary">
                          📅 {formatDate(spotlightTrip.next_activity.date)}
                        </span>
                      )}
                    </div>
                    {spotlightTrip.next_activity ? (
                      <div>
                        <div className="font-bold text-sm text-main truncate">{spotlightTrip.next_activity.name}</div>
                        <div className="text-xs text-muted mt-0.5">
                          ⏰ {formatTime(spotlightTrip.next_activity.start_time)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-xs italic py-1">No upcoming activities scheduled.</div>
                    )}
                  </div>

                  {/* Budget & Spending Breakdown Box */}
                  <div className="dashboard-inset p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="dashboard-inset__label text-[10px] mb-0">Budget ({spotlightBaseCurrency})</span>
                      {spotlightConvertedBudget && spotlightDestCurrency !== spotlightBaseCurrency && (
                        <span className="text-[11px] font-bold text-primary">
                          ≈ {currencyService.formatAmount(spotlightConvertedBudget, spotlightDestCurrency)}
                        </span>
                      )}
                    </div>
                    {spotlightTrip.budget_summary ? (
                      <div>
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className={`text-sm font-extrabold ${spotlightTrip.budget_summary.remaining_budget < 0 ? 'text-error' : 'text-success'}`}>
                            {currencyService.formatAmount(spotlightTrip.budget_summary.remaining_budget, spotlightBaseCurrency)} Remaining
                          </span>
                          <span className="text-[11px] text-muted">
                            Total: {currencyService.formatAmount(spotlightTrip.budget_summary.total_budget, spotlightBaseCurrency)}
                          </span>
                        </div>
                        <div className="dashboard-progress-track my-1" style={{ height: '6px' }}>
                          <div 
                            className={`dashboard-progress-bar ${spotlightTrip.budget_summary.remaining_budget < 0 ? 'bg-error' : 'bg-primary'}`}
                            style={{ 
                              width: `${spotlightTrip.budget_summary.total_budget > 0 
                                ? Math.min(100, (spotlightTrip.budget_summary.total_spent / spotlightTrip.budget_summary.total_budget) * 100) 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted">
                          <span>Spent: {currencyService.formatAmount(spotlightTrip.budget_summary.total_spent, spotlightBaseCurrency)}</span>
                          <span>{spotlightTrip.budget_summary.total_budget > 0 ? Math.round((spotlightTrip.budget_summary.total_spent / spotlightTrip.budget_summary.total_budget) * 100) : 0}% used</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-xs italic py-1">No budget set.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Trips List */}
            <div className="dashboard-section card p-4">
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <h3 className="text-base font-bold text-main m-0">Upcoming Adventures</h3>
                </div>
                <Link to="/trips" className="text-xs font-semibold text-primary hover:underline">
                  View all ({total_trips}) →
                </Link>
              </div>
              
              {upcoming_trips && upcoming_trips.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {upcoming_trips.map(trip => (
                    <div key={trip.id} className="dashboard-trip-row py-2 px-3">
                      <div className="min-w-0 pr-2">
                        <Link to={`/trips/${trip.id}`} className="font-bold text-main hover:text-primary truncate block text-xs">
                          {trip.name}
                        </Link>
                        <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {trip.primary_destination && (
                            <span className="font-medium text-main">📍 {trip.primary_destination}</span>
                          )}
                          <span>•</span>
                          <span>📅 {formatDate(trip.start_date)}</span>
                        </div>
                      </div>
                      <Link to={`/trips/${trip.id}`} className="btn btn-ghost btn-sm text-xs py-1 px-2 whitespace-nowrap">
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-xs italic p-3 bg-surface-secondary rounded-lg text-center">
                  No other upcoming trips scheduled. Ready for a new getaway?
                </div>
              )}
            </div>

          </div>
          
          {/* Sidebar */}
          <div className="dashboard-sidebar flex flex-col gap-3.5">
            
            {/* Live Weather Widget & Forecast */}
            {spotlightTrip && spotlightTrip.destination ? (
              <WeatherWidget 
                latitude={spotlightTrip.destination.latitude} 
                longitude={spotlightTrip.destination.longitude} 
                locationName={spotlightTrip.destination.name || spotlightTrip.primary_destination}
                tripDate={spotlightTrip.start_date}
              />
            ) : spotlightTrip ? (
              <div className="weather-widget error card p-3.5 text-center">
                <span className="text-xl block mb-0.5">☁️</span>
                <h4 className="font-bold text-xs text-main">Destination Weather</h4>
                {spotlightTrip.primary_destination && (
                  <span className="text-xs text-muted block mt-0.5">
                    📍 {spotlightTrip.primary_destination}
                  </span>
                )}
                <p className="text-muted text-xs mt-1.5">
                  Weather unavailable.<br/>Add a destination map location to view forecast.
                </p>
              </div>
            ) : null}

            {/* Quick Travel Actions Panel */}
            <div className="dashboard-section card p-3.5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-main text-[11px] uppercase tracking-wider flex items-center gap-1.5 m-0">
                  <span>⚡</span> Quick Actions
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  className="quick-action-tile py-1.5 px-1"
                  onClick={() => navigate('/trips/new')}
                  title="Create New Trip"
                >
                  <span className="quick-action-icon text-base">➕</span>
                  <span className="quick-action-label text-[10px]">New Trip</span>
                </button>
                <button
                  type="button"
                  className="quick-action-tile py-1.5 px-1"
                  onClick={() => navigate('/trips')}
                  title="View All Trips"
                >
                  <span className="quick-action-icon text-base">🌍</span>
                  <span className="quick-action-label text-[10px]">All Trips</span>
                </button>
                <button
                  type="button"
                  className="quick-action-tile py-1.5 px-1"
                  onClick={() => navigate('/reports')}
                  title="View Reports"
                >
                  <span className="quick-action-icon text-base">📊</span>
                  <span className="quick-action-label text-[10px]">Reports</span>
                </button>
                <button
                  type="button"
                  className="quick-action-tile py-1.5 px-1"
                  onClick={() => navigate('/notifications')}
                  title="View Alerts"
                >
                  <span className="quick-action-icon text-base">🔔</span>
                  <span className="quick-action-label text-[10px]">Alerts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
