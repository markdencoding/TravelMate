import { useState, useEffect } from 'react';
import { calculateDerivedDate, getTripTotalDays, formatDateLong } from '../../utils/itineraryDates';

export default function DayForm({ initialData = null, onSubmit, onCancel, existingDaysCount = 0, trip = null }) {
  const [formData, setFormData] = useState({
    day_number: existingDaysCount + 1,
    date: ''
  });
  const [validationError, setValidationError] = useState('');

  const totalTripDays = trip ? getTripTotalDays(trip.start_date, trip.end_date) : null;
  const hasTripStartDate = Boolean(trip?.start_date);

  const derivedScheduleDate = (hasTripStartDate && formData.day_number)
    ? calculateDerivedDate(trip.start_date, formData.day_number)
    : null;

  useEffect(() => {
    if (initialData) {
      setFormData({
        day_number: initialData.day_number || '',
        date: initialData.date ? String(initialData.date).split('T')[0] : ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dayNum = parseInt(formData.day_number, 10);

    if (isNaN(dayNum) || dayNum < 1) {
      setValidationError('Day number must be at least 1.');
      return;
    }

    if (totalTripDays && dayNum > totalTripDays) {
      setValidationError(
        `Day ${dayNum} exceeds the trip duration (${totalTripDays} day${totalTripDays === 1 ? '' : 's'}). Trip dates are ${formatDateLong(trip.start_date)} to ${formatDateLong(trip.end_date)}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        day_number: dayNum,
        date: derivedScheduleDate || (formData.date || null)
      });
    } catch (err) {
      setValidationError(err.message || 'Failed to save day');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card itinerary-form">
      <h4>{initialData ? 'Edit Day' : 'Add New Day'}</h4>

      {validationError && (
        <div className="card p-3 mb-3 bg-error-light text-error text-xs font-semibold border-error">
          ⚠️ {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="day_number" className="form-label">
              Day Number * {totalTripDays ? `(Max: Day ${totalTripDays})` : ''}
            </label>
            <input
              id="day_number"
              type="number"
              min="1"
              max={totalTripDays || undefined}
              className="form-input"
              name="day_number"
              value={formData.day_number}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Contextual Derived Schedule Date */}
          {hasTripStartDate ? (
            <div className="form-group">
              <label className="form-label">Schedule Date</label>
              <div className="form-input flex items-center bg-surface-secondary text-main font-semibold text-sm cursor-default">
                📅 {derivedScheduleDate ? formatDateLong(derivedScheduleDate) : 'Derived date calculating...'}
              </div>
              <span className="text-[11px] text-muted mt-1 block">
                Automatically determined by trip start ({formatDateLong(trip.start_date)}).
              </span>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="date" className="form-label">Date (optional)</label>
              <input
                id="date"
                type="date"
                className="form-input"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
        
        <div className="form-actions mt-4">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Day' : 'Add Day')}
          </button>
        </div>
      </form>
    </div>
  );
}
