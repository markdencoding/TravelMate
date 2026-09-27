import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dashboardService from '../services/dashboardService';
import api from '../services/api';
import currencyService from '../services/currencyService';
import EmptyState from '../components/common/EmptyState';
import WeatherWidget from '../components/weather/WeatherWidget';
import CurrencyConverter from '../components/currency/CurrencyConverter';
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
      {/* Travel Command Center Header (No generic 'Dashboard' title) */}
      <div className="dashboard-command-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-primary-light text-primary text-xs font-bold uppercase tracking-wider">
              ✈️ Travel Command Center
            </span>
            {active_trip && (
              <span className="badge bg-success-light text-success text-xs font-bold">
                ● Live Trip Active
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-main">
            Welcome back, {user?.name?.split(' ')[0] || user?.name || 'Traveler'}!
          </h2>
          <p className="text-muted text-sm mt-0.5">
            {total_trips > 0 
              ? `${total_trips} total ${total_trips === 1 ? 'trip' : 'trips'} planned • ${upcoming_trips?.length || 0} upcoming adventures`
              : 'Start your journey by creating your first trip.'}
          </p>
        </div>
        <div className="dashboard-header-actions flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            className="btn btn-primary flex items-center gap-2" 
            onClick={() => navigate('/trips/new')}
          >
            <span>➕</span> Create New Trip
          </button>
          <button 
            type="button"
            className="btn btn-secondary flex items-center gap-2" 
            onClick={() => navigate('/trips')}
          >
            <span>🌍</span> View All Trips
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
          <div className="dashboard-main flex flex-col gap-6">
            
            {/* Spotlight Trip (Active or Next) */}
            {spotlightTrip && (
              <div className="spotlight-card card border-primary p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="badge bg-primary-light text-primary text-xs font-bold uppercase tracking-wider">
                        {active_trip ? '🔥 Active Now' : '🗓️ Next Upcoming'}
                      </span>
                      {spotlightTrip.primary_destination && (
                        <span className="badge bg-surface-secondary text-main text-xs border border-border font-semibold">
                          📍 {spotlightTrip.primary_destination}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-extrabold text-main">
                      <Link to={`/trips/${spotlightTrip.id}`} className="hover:text-primary transition-colors">
                        {spotlightTrip.name}
                      </Link>
                    </h3>
                    <p className="text-muted text-sm mt-1 flex items-center gap-1.5">
                      <span>📅</span> {formatDate(spotlightTrip.start_date)} — {formatDate(spotlightTrip.end_date)}
                    </p>
                  </div>
                  <Link to={`/trips/${spotlightTrip.id}`} className="btn btn-primary btn-sm self-start whitespace-nowrap">
                    Open Trip →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Next Activity Box */}
                  <div className="dashboard-inset">
                    <h4 className="dashboard-inset__label">Next Scheduled Activity</h4>
                    {spotlightTrip.next_activity ? (
                      <div>
                        <div className="font-bold text-base text-main">{spotlightTrip.next_activity.name}</div>
                        <div className="text-xs font-semibold text-primary mt-1 flex items-center gap-1">
                          <span>📅</span> {formatDate(spotlightTrip.next_activity.date)} at {formatTime(spotlightTrip.next_activity.start_time)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-xs italic py-1">No upcoming activities scheduled for today.</div>
                    )}
                  </div>

                  {/* Budget & Spending Breakdown Box */}
                  <div className="dashboard-inset">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="dashboard-inset__label mb-0">Trip Budget & Spending ({spotlightBaseCurrency})</h4>
                      {spotlightConvertedBudget && spotlightDestCurrency !== spotlightBaseCurrency && (
                        <span className="text-[11px] font-bold text-primary">
                          ≈ {currencyService.formatAmount(spotlightConvertedBudget, spotlightDestCurrency)}
                        </span>
                      )}
                    </div>
                    {spotlightTrip.budget_summary ? (
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`text-base font-extrabold ${spotlightTrip.budget_summary.remaining_budget < 0 ? 'text-error' : 'text-success'}`}>
                            {currencyService.formatAmount(spotlightTrip.budget_summary.remaining_budget, spotlightBaseCurrency)} Remaining
                          </span>
                          <span className="text-xs text-muted">
                            Total: {currencyService.formatAmount(spotlightTrip.budget_summary.total_budget, spotlightBaseCurrency)}
                          </span>
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
                        <div className="flex justify-between text-[11px] text-muted mt-1">
                          <span>Spent: {currencyService.formatAmount(spotlightTrip.budget_summary.total_spent, spotlightBaseCurrency)}</span>
                          <span>{spotlightTrip.budget_summary.total_budget > 0 ? Math.round((spotlightTrip.budget_summary.total_spent / spotlightTrip.budget_summary.total_budget) * 100) : 0}% used</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted text-xs italic py-1">No estimated budget configured.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Trips List */}
            <div className="dashboard-section card p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-main">Upcoming Adventures</h3>
                  <p className="text-xs text-muted mt-0.5">Your planned itineraries and travel dates</p>
                </div>
                <Link to="/trips" className="text-xs font-semibold text-primary hover:underline">
                  View all ({total_trips}) →
                </Link>
              </div>
              
              {upcoming_trips && upcoming_trips.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {upcoming_trips.map(trip => (
                    <div key={trip.id} className="dashboard-trip-row">
                      <div className="min-w-0 pr-3">
                        <Link to={`/trips/${trip.id}`} className="font-bold text-main hover:text-primary truncate block text-sm">
                          {trip.name}
                        </Link>
                        <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {trip.primary_destination && (
                            <span className="font-medium text-main">📍 {trip.primary_destination}</span>
                          )}
                          <span>•</span>
                          <span>📅 {formatDate(trip.start_date)}</span>
                        </div>
                      </div>
                      <Link to={`/trips/${trip.id}`} className="btn btn-ghost btn-sm whitespace-nowrap">
                        View Trip →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted text-sm italic p-4 bg-surface-secondary rounded-lg text-center">
                  No other upcoming trips scheduled. Ready for a new getaway?
                </div>
              )}
            </div>

          </div>
          
          {/* Sidebar */}
          <div className="dashboard-sidebar flex flex-col gap-6">
            
            {/* Live Weather Widget & Forecast */}
            {spotlightTrip && spotlightTrip.destination ? (
              <WeatherWidget 
                latitude={spotlightTrip.destination.latitude} 
                longitude={spotlightTrip.destination.longitude} 
                locationName={spotlightTrip.destination.name || spotlightTrip.primary_destination}
                tripDate={spotlightTrip.start_date}
              />
            ) : spotlightTrip ? (
              <div className="weather-widget error card p-4 text-center">
                <span className="text-2xl block mb-1">☁️</span>
                <h4 className="font-bold text-sm text-main">Destination Weather</h4>
                {spotlightTrip.primary_destination && (
                  <span className="text-xs text-muted block mt-0.5">
                    📍 {spotlightTrip.primary_destination}
                  </span>
                )}
                <p className="text-muted text-xs mt-2">
                  Weather unavailable for this trip.<br/>Add a destination map location to view live forecast.
                </p>
              </div>
            ) : null}

            {/* Quick Travel Actions Panel */}
            <div className="dashboard-section card p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-main flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <span>⚡</span> Quick Actions
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="quick-action-tile"
                  onClick={() => navigate('/trips/new')}
                >
                  <span className="quick-action-icon">➕</span>
                  <span className="quick-action-label">New Trip</span>
                </button>
                <button
                  type="button"
                  className="quick-action-tile"
                  onClick={() => navigate('/trips')}
                >
                  <span className="quick-action-icon">🌍</span>
                  <span className="quick-action-label">All Trips</span>
                </button>
                <button
                  type="button"
                  className="quick-action-tile"
                  onClick={() => navigate('/reports')}
                >
                  <span className="quick-action-icon">📊</span>
                  <span className="quick-action-label">Reports</span>
                </button>
                <button
                  type="button"
                  className="quick-action-tile"
                  onClick={() => navigate('/notifications')}
                >
                  <span className="quick-action-icon">🔔</span>
                  <span className="quick-action-label">Alerts</span>
                </button>
              </div>
            </div>

            {/* Quick Currency Converter */}
            <CurrencyConverter 
              compact 
              initialFrom={spotlightBaseCurrency}
              initialTo={spotlightDestCurrency}
              initialAmount={spotlightTrip?.budget_summary?.remaining_budget || 5000}
              title="Currency Converter"
            />
          </div>
        </div>
      )}
    </div>
  );
}
