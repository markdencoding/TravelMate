import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tripService from '../../services/tripService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import './Trips.css';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tripService.getTrips();
      if (result.success) {
        setTrips(result.data);
      } else {
        setError(result.message || 'Failed to load trips');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner message="Loading your trips..." />;
  
  if (error) return <ErrorMessage message={error} onRetry={fetchTrips} />;

  return (
    <div className="trips-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Trips</h1>
          <p className="page-subtitle">Manage and plan your adventures</p>
        </div>
        <Link to="/trips/new" className="btn btn-primary">
          ➕ Create Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <EmptyState 
          icon="🌍"
          title="No trips yet"
          description="Create your first trip to start planning your journey."
          action={
            <Link to="/trips/new" className="btn btn-primary">
              Create Your First Trip
            </Link>
          }
        />
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <Link to={`/trips/${trip.id}`} key={trip.id} className="trip-card">
              <div className="trip-card__header">
                <h3 className="trip-card__title">{trip.name}</h3>
                {trip.primary_destination && (
                  <span className="trip-card__destination">📍 {trip.primary_destination}</span>
                )}
              </div>
              <div className="trip-card__body">
                {(trip.start_date || trip.end_date) && (
                  <p className="trip-card__dates">
                    📅 {formatDate(trip.start_date)} {trip.end_date ? `— ${formatDate(trip.end_date)}` : ''}
                  </p>
                )}
                {trip.description && (
                  <p className="trip-card__description">
                    {trip.description.length > 100 
                      ? `${trip.description.substring(0, 100)}...` 
                      : trip.description}
                  </p>
                )}
              </div>
              <div className="trip-card__footer">
                <span className="text-muted text-xs">
                  Updated: {formatDate(trip.updated_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
