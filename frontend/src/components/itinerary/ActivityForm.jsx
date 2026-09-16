import { useState, useEffect } from 'react';

export default function ActivityForm({ initialData = null, destinations = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    estimated_cost: '',
    destination_id: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        start_time: initialData.start_time || '',
        end_time: initialData.end_time || '',
        location: initialData.location || '',
        estimated_cost: initialData.estimated_cost || '',
        destination_id: initialData.destination_id || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDestinationSelect = (e) => {
    const val = e.target.value;
    if (val) {
      const selectedDest = destinations.find(d => d.id === val);
      if (selectedDest) {
        setFormData(prev => ({ 
          ...prev, 
          destination_id: val,
          // Auto-fill location if not manually entered
          location: prev.location ? prev.location : selectedDest.name 
        }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, destination_id: val }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card itinerary-form activity-form">
      <h4>{initialData ? 'Edit Activity' : 'Add Activity'}</h4>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label className="form-label">Activity Name *</label>
          <input
            type="text"
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Visit the Louvre"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              className="form-input"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="time"
              className="form-input"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Link to Destination (Optional)</label>
          <select 
            className="form-input" 
            name="destination_id" 
            value={formData.destination_id} 
            onChange={handleDestinationSelect}
          >
            <option value="">-- None --</option>
            {destinations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <span className="text-xs text-muted block mt-1">Links this activity to one of your saved destinations on the map.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Location Details</label>
          <input
            type="text"
            className="form-input"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Specific address or meeting point"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Estimated Cost ($)</label>
            <input
              type="number"
              className="form-input"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes / Description</label>
          <textarea
            className="form-input"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            placeholder="Important details, ticket info, etc."
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
