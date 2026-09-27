import { useState, useEffect } from 'react';
import { calculateDerivedDate, getTripTotalDays, formatDateLong } from '../../utils/itineraryDates';

export default function ActivityForm({ 
  initialData = null, 
  currentDayId = null,
  days = [],
  trip = null,
  destinations = [], 
  onSubmit, 
  onCancel 
}) {
  const [selectedDayId, setSelectedDayId] = useState(
    initialData?.itinerary_day_id || currentDayId || (days.length > 0 ? days[0].id : '')
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    estimated_cost: '',
    destination_id: ''
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        start_time: initialData.start_time ? initialData.start_time.slice(0, 5) : '',
        end_time: initialData.end_time ? initialData.end_time.slice(0, 5) : '',
        location: initialData.location || '',
        estimated_cost: initialData.estimated_cost != null ? String(initialData.estimated_cost) : '',
        destination_id: initialData.destination_id || ''
      });
      if (initialData.itinerary_day_id) {
        setSelectedDayId(initialData.itinerary_day_id);
      }
    } else if (currentDayId) {
      setSelectedDayId(currentDayId);
    }
  }, [initialData, currentDayId]);

  // Derive contextual date based on currently selected day
  const currentDay = days.find(d => d.id === selectedDayId) || null;
  const totalDays = trip ? getTripTotalDays(trip.start_date, trip.end_date) : (days.length || null);
  
  const scheduleDateStr = currentDay?.date || (trip?.start_date && currentDay 
    ? calculateDerivedDate(trip.start_date, currentDay.day_number) 
    : null);
  const scheduleDateFormatted = formatDateLong(scheduleDateStr);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleDestinationSelect = (e) => {
    const val = e.target.value;
    if (val) {
      const selectedDest = destinations.find(d => d.id === val);
      if (selectedDest) {
        setFormData(prev => ({ 
          ...prev, 
          destination_id: val,
          location: prev.location ? prev.location : selectedDest.name 
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, destination_id: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('Activity name is required.');
      return;
    }

    if (formData.start_time && formData.end_time && formData.start_time > formData.end_time) {
      setValidationError('Start time cannot be after end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        itinerary_day_id: selectedDayId,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
      });
    } catch (err) {
      setValidationError(err.message || 'Failed to save activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card itinerary-form activity-form">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-lg">{initialData ? 'Edit Activity' : 'Add Activity'}</h4>
        {currentDay && (
          <span className="text-xs text-muted font-medium">
            Day {currentDay.day_number} {totalDays ? `of ${totalDays}` : ''}
          </span>
        )}
      </div>

      {validationError && (
        <div className="card p-3 mb-3 bg-error-light text-error text-xs font-semibold border-error">
          ⚠️ {validationError}
        </div>
      )}

      {/* Read-only Contextual Date Display */}
      <div className="activity-schedule-banner p-3 rounded-lg bg-surface-secondary border border-border mb-4">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
          Schedule Date
        </span>
        <div className="text-base font-extrabold text-primary mt-0.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>📅</span>
            <span>{scheduleDateFormatted || 'Date not determined'}</span>
          </span>
          {currentDay && (
            <span className="badge bg-primary-light text-primary text-xs font-bold px-2 py-0.5 rounded">
              Day {currentDay.day_number} {totalDays ? `of ${totalDays}` : ''}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Itinerary Day Selection */}
        {days.length > 1 && (
          <div className="form-group mb-3">
            <label htmlFor="activity_itinerary_day" className="form-label">
              Itinerary Day *
            </label>
            <select
              id="activity_itinerary_day"
              className="form-input"
              value={selectedDayId}
              onChange={(e) => setSelectedDayId(e.target.value)}
              disabled={isSubmitting}
            >
              {days.map(d => {
                const dayDate = d.date || (trip?.start_date ? calculateDerivedDate(trip.start_date, d.day_number) : null);
                return (
                  <option key={d.id} value={d.id}>
                    Day {d.day_number} {dayDate ? `(${formatDateLong(dayDate)})` : ''}
                  </option>
                );
              })}
            </select>
            <span className="text-[11px] text-muted mt-1 block">
              Moving this activity to another day automatically updates its schedule date.
            </span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="activity_name" className="form-label">Activity Name *</label>
          <input
            id="activity_name"
            type="text"
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Visit the Louvre"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_time" className="form-label">Start Time</label>
            <input
              id="start_time"
              type="time"
              className="form-input"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="end_time" className="form-label">End Time</label>
            <input
              id="end_time"
              type="time"
              className="form-input"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="destination_id" className="form-label">Link to Destination (Optional)</label>
          <select 
            id="destination_id"
            className="form-input" 
            name="destination_id" 
            value={formData.destination_id} 
            onChange={handleDestinationSelect}
            disabled={isSubmitting}
          >
            <option value="">-- None --</option>
            {destinations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <span className="text-xs text-muted block mt-1">Links this activity to one of your saved destinations on the map.</span>
        </div>

        <div className="form-group">
          <label htmlFor="location" className="form-label">Location Details</label>
          <input
            id="location"
            type="text"
            className="form-input"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Specific address or meeting point"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estimated_cost" className="form-label">Estimated Cost ($)</label>
            <input
              id="estimated_cost"
              type="number"
              className="form-input"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Notes / Description</label>
          <textarea
            id="description"
            className="form-input"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            placeholder="Important details, ticket info, etc."
            disabled={isSubmitting}
          />
        </div>

        <div className="form-actions mt-4">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Activity' : 'Add Activity')}
          </button>
        </div>
      </form>
    </div>
  );
}
