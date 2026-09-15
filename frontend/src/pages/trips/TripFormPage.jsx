import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import tripService from '../../services/tripService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './Trips.css';

export default function TripFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    primary_destination: '',
    estimated_budget: ''
  });
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchTrip();
    }
  }, [id]);

  const fetchTrip = async () => {
    try {
      const result = await tripService.getTrip(id);
      if (result.success) {
        const trip = result.data;
        // Format dates for input[type="date"]
        const formatDateForInput = (dateStr) => dateStr ? dateStr.split('T')[0] : '';
        
        setFormData({
          name: trip.name || '',
          description: trip.description || '',
          start_date: formatDateForInput(trip.start_date),
          end_date: formatDateForInput(trip.end_date),
          primary_destination: trip.primary_destination || '',
          estimated_budget: trip.estimated_budget || ''
        });
      } else {
        setError(result.message || 'Failed to load trip details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setError('End date cannot be before start date.');
      return;
    }
    if (formData.estimated_budget && Number(formData.estimated_budget) < 0) {
      setError('Estimated budget cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload (convert empty strings to undefined/null for backend if needed, 
      // but standard approach is to send what user typed)
      const payload = {
        ...formData,
        estimated_budget: formData.estimated_budget ? Number(formData.estimated_budget) : null
      };

      let result;
      if (isEditing) {
        result = await tripService.updateTrip(id, payload);
      } else {
        result = await tripService.createTrip(payload);
      }

      if (result.success) {
        navigate(isEditing ? `/trips/${id}` : '/trips');
      } else {
        setError(result.message || 'Failed to save trip');
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving.');
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading trip details..." />;

  return (
    <div className="trip-form-page">
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Trip' : 'Create New Trip'}</h1>
      </div>

      <div className="card">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
        
        <form onSubmit={handleSubmit} className="trip-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Trip Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="e.g., Summer in Paris"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primary_destination" className="form-label">Primary Destination</label>
            <input
              type="text"
              id="primary_destination"
              name="primary_destination"
              className="form-input"
              value={formData.primary_destination}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g., Paris, France"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-input"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date} // Basic HTML validation
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="estimated_budget" className="form-label">Estimated Budget</label>
            <input
              type="number"
              id="estimated_budget"
              name="estimated_budget"
              className="form-input"
              value={formData.estimated_budget}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="What are your plans for this trip?"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEditing ? `/trips/${id}` : '/trips')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
