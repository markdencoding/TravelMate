import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import tripService from '../../services/tripService';
import destinationService from '../../services/destinationService';
import currencyService from '../../services/currencyService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DestinationList from '../../components/destinations/DestinationList';
import DestinationForm from '../../components/destinations/DestinationForm';
import DestinationMap from '../../components/destinations/DestinationMap';
import ItinerarySection from '../../components/itinerary/ItinerarySection';
import ExpenseSection from '../../components/expenses/ExpenseSection';
import WeatherWidget from '../../components/weather/WeatherWidget';
import CurrencyConverter from '../../components/currency/CurrencyConverter';
import './Trips.css';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [convertedBudget, setConvertedBudget] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [showDestForm, setShowDestForm] = useState(false);
  const [editingDest, setEditingDest] = useState(null);

  const primaryDest = destinations.length > 0 ? destinations[0] : null;
  const baseCurrency = trip?.base_currency || 'PHP';
  const destCurrency = primaryDest?.currency || (baseCurrency === 'PHP' ? 'JPY' : 'PHP');

  useEffect(() => {
    fetchTripData();
  }, [id]);

  useEffect(() => {
    if (!trip?.estimated_budget || !destCurrency || baseCurrency === destCurrency) {
      setConvertedBudget(null);
      return;
    }
    let isMounted = true;
    currencyService.convert(trip.estimated_budget, baseCurrency, destCurrency)
      .then(res => {
        if (isMounted && res.success && res.data) {
          setConvertedBudget(res.data.converted_amount);
        }
      })
      .catch(err => console.warn('Budget conversion err:', err));

    return () => { isMounted = false; };
  }, [trip?.estimated_budget, baseCurrency, destCurrency]);

  const fetchTripData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripRes, destRes] = await Promise.all([
        tripService.getTrip(id),
        destinationService.getDestinations(id)
      ]);
      
      if (tripRes.success) {
        setTrip(tripRes.data);
      } else {
        setError(tripRes.message || 'Failed to load trip details');
      }
      
      if (destRes.success) {
        setDestinations(destRes.data);
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

  const handleDeleteTrip = async () => {
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

  // --- Destination Handlers ---
  const handleAddDestinationClick = () => {
    setEditingDest(null);
    setShowDestForm(true);
  };

  const handleEditDestinationClick = (dest) => {
    setEditingDest(dest);
    setShowDestForm(true);
  };

  const handleDestinationFormSubmit = async (formData) => {
    try {
      if (editingDest) {
        await destinationService.updateDestination(id, editingDest.id, formData);
      } else {
        await destinationService.createDestination(id, formData);
      }
      setShowDestForm(false);
      setEditingDest(null);
      
      // Refresh destinations
      const destRes = await destinationService.getDestinations(id);
      if (destRes.success) {
        setDestinations(destRes.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save destination');
    }
  };

  const handleDeleteDestination = async (destId) => {
    if (!window.confirm('Are you sure you want to remove this destination?')) return;
    
    try {
      await destinationService.deleteDestination(id, destId);
      setDestinations(prev => prev.filter(d => d.id !== destId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete destination');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner message="Loading trip details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTripData} />;
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
              onClick={handleDeleteTrip} 
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
              💰 <strong>Budget:</strong> {currencyService.formatAmount(trip.estimated_budget, baseCurrency)}
              {convertedBudget && destCurrency !== baseCurrency && (
                <span className="text-primary font-bold ml-1.5">
                  (≈ {currencyService.formatAmount(convertedBudget, destCurrency)})
                </span>
              )}
            </span>
          )}
        </div>
        
        {trip.description && (
          <div className="trip-detail-description">
            <p>{trip.description}</p>
          </div>
        )}
      </div>

      {/* Destinations Section */}
      <div className="destinations-section">
        <div className="destinations-section__header">
          <h2>Destinations</h2>
          {!showDestForm && (
            <button className="btn btn-primary" onClick={handleAddDestinationClick}>
              ➕ Add Destination
            </button>
          )}
        </div>

        <div className="destinations-content">
          <div className="destinations-left">
            {showDestForm ? (
              <DestinationForm 
                initialData={editingDest} 
                onSubmit={handleDestinationFormSubmit} 
                onCancel={() => { setShowDestForm(false); setEditingDest(null); }} 
              />
            ) : (
              <DestinationList 
                destinations={destinations} 
                onEdit={handleEditDestinationClick}
                onDelete={handleDeleteDestination}
              />
            )}
          </div>
          <div className="destinations-right">
            <DestinationMap destinations={destinations} />
          </div>
        </div>
      </div>

      {/* Itinerary Section */}
      <ItinerarySection tripId={id} destinations={destinations} />

      {/* Expenses Section */}
      <ExpenseSection tripId={id} />

      {/* Destination Tools: Live Weather Slideshow & Currency Converter */}
      <div className="trip-tools-section mt-8">
        <div className="destinations-section__header mb-4">
          <h2>Trip Tools & Forecast</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {primaryDest && primaryDest.latitude && primaryDest.longitude ? (
            <WeatherWidget
              latitude={primaryDest.latitude}
              longitude={primaryDest.longitude}
              locationName={primaryDest.name}
              tripDate={trip.start_date}
            />
          ) : (
            <div className="weather-widget error">
              <div className="text-center p-4">
                <span className="text-2xl">🌦️</span>
                <h4 className="font-bold text-sm mt-1">Destination Weather</h4>
                <p className="text-muted text-xs mt-1">
                  Add a destination above to view current weather and trip date forecast.
                </p>
              </div>
            </div>
          )}

          <CurrencyConverter
            initialAmount={Number(trip.estimated_budget) || 1000}
            initialFrom={baseCurrency}
            initialTo={destCurrency}
            title="Trip Currency Converter"
          />
        </div>
      </div>
    </div>
  );
}
