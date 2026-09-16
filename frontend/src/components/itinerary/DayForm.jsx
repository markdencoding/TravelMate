import { useState, useEffect } from 'react';

export default function DayForm({ initialData = null, onSubmit, onCancel, existingDaysCount = 0 }) {
  const [formData, setFormData] = useState({
    day_number: existingDaysCount + 1,
    date: ''
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        day_number: initialData.day_number || '',
        // Format date string for the HTML date input if it exists (YYYY-MM-DD)
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        day_number: parseInt(formData.day_number, 10)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card itinerary-form">
      <h4>{initialData ? 'Edit Day' : 'Add New Day'}</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Day Number *</label>
            <input
              type="number"
              className="form-input"
              name="day_number"
              value={formData.day_number}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date (optional)</label>
            <input
              type="date"
              className="form-input"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
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
