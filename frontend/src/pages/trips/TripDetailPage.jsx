import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import tripService from '../../services/tripService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './Trips.css';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tripService.getTrip(id);
      if (result.success) {
        setTrip(result.data);
      } else {
        setError(result.message || 'Failed to load trip details');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Trip not found or you do not have permission to view it.');
      } else {
        setError(err.response?.data?.message || 'Unable to connect to the server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?\n\nThis action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const result = await tripService.deleteTrip(id);
      if (result.success) {
        navigate('/trips');
      } else {
        alert(result.message || 'Failed to delete trip');
        setDeleting(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred while deleting.');
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner message="Loading trip details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTrip} />;
  if (!trip) return null;

  return (
    <div className="trip-detail-page">
      <div className="trip-detail-header">
        <div className="trip-detail-header__actions-top">
          <Link to="/trips" className="btn btn-ghost">
            ← Back to Trips
          </Link>
          <div className="trip-detail-header__buttons">
            <Link to={`/trips/${trip.id}/edit`} className="btn btn-secondary">
              ✏️ Edit
            </Link>
            <button 
              onClick={handleDelete} 
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
        
        <h1 className="trip-detail-title">{trip.name}</h1>
        
        <div className="trip-detail-meta">
          {trip.primary_destination && (
            <span className="trip-detail-meta-item">
              📍 <strong>Destination:</strong> {trip.primary_destination}
            </span>
          )}
          {(trip.start_date || trip.end_date) && (
            <span className="trip-detail-meta-item">
              📅 <strong>Dates:</strong> {formatDate(trip.start_date)} {trip.end_date ? `— ${formatDate(trip.end_date)}` : ''}
            </span>
          )}
          {trip.estimated_budget != null && (
            <span className="trip-detail-meta-item">
              💰 <strong>Budget:</strong> ${Number(trip.estimated_budget).toLocaleString()}
            </span>
          )}
        </div>
        
        {trip.description && (
          <div className="trip-detail-description">
            <p>{trip.description}</p>
          </div>
        )}
      </div>

      <div className="trip-modules-grid">
        <div className="trip-module-placeholder">
          <h3>🗺️ Destinations</h3>
          <p>Plan places to visit.</p>
          <span className="badge">Coming in next phase</span>
        </div>
        <div className="trip-module-placeholder">
          <h3>🌤️ Weather</h3>
          <p>Check the forecast.</p>
          <span className="badge">Coming in next phase</span>
        </div>
        <div className="trip-module-placeholder">
          <h3>📅 Itinerary</h3>
          <p>Plan your day-by-day activities.</p>
          <span className="badge">Coming in next phase</span>
        </div>
        <div className="trip-module-placeholder">
          <h3>💳 Expenses</h3>
          <p>Track your budget and spending.</p>
          <span className="badge">Coming in next phase</span>
        </div>
      </div>
    </div>
  );
}
