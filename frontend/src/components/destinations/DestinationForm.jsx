import { useState, useEffect, useRef } from 'react';
import mapsService from '../../services/mapsService';

export default function DestinationForm({ onSubmit, onCancel, initialData = null, error = null }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        description: initialData.description || ''
      });
      setSearchQuery(initialData.name || '');
    }
  }, [initialData]);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 3 && (!initialData || searchQuery !== initialData.name)) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setSearching(true);
    setSearchError(null);
    try {
      const result = await mapsService.search(query);
      if (result.success) {
        setSearchResults(result.data);
        setShowDropdown(true);
      }
    } catch (err) {
      // If Maps API fails (e.g. 503 key missing), just let the user type manually.
      if (err.response?.status === 503) {
        setSearchError("Map search unavailable. Please enter details manually.");
      }
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    setSearchQuery(result.name);
    setFormData(prev => ({
      ...prev,
      name: result.name,
      address: result.address || '',
      latitude: result.latitude || '',
      longitude: result.longitude || ''
    }));
    setShowDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setFormData(prev => ({ ...prev, name: e.target.value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="destination-form card">
      <h3>{initialData ? 'Edit Destination' : 'Add Destination'}</h3>
      
      {error && <div className="text-error mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" ref={dropdownRef}>
          <label className="form-label">Search Location or Enter Name *</label>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="E.g., Eiffel Tower, Paris"
            required
            autoComplete="off"
          />
          
          {searchError && <div className="text-xs text-muted mt-1">{searchError}</div>}
          
          {showDropdown && (
            <div className="autocomplete-dropdown">
              {searching ? (
                <div className="autocomplete-item text-muted">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(result => (
                  <div 
                    key={result.id} 
                    className="autocomplete-item"
                    onClick={() => handleSelectResult(result)}
                  >
                    <strong>{result.name}</strong>
                    <div className="text-xs text-muted">{result.address}</div>
                  </div>
                ))
              ) : (
                <div className="autocomplete-item text-muted">No results found</div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input
            type="text"
            className="form-input"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Full address (optional)"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              className="form-input"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              step="any"
              placeholder="Auto-filled"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              className="form-input"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              step="any"
              placeholder="Auto-filled"
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
            placeholder="Why are you visiting this place?"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Destination')}
          </button>
        </div>
      </form>
    </div>
  );
}
