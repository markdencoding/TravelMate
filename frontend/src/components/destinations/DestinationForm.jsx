import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapsService from '../../services/mapsService';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Recenter helper component for Leaflet
function FormMapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1] && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || 13, { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Click-to-locate handler for Leaflet
function FormMapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

export default function DestinationForm({ onSubmit, onCancel, initialData = null, error = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude ? parseFloat(initialData.latitude) : '',
    longitude: initialData?.longitude ? parseFloat(initialData.longitude) : '',
    description: initialData?.description || ''
  });

  const [searchQuery, setSearchQuery] = useState(initialData?.name || '');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Default center: initial coords or Philippines center
  const defaultCenter = initialData?.latitude && initialData?.longitude
    ? [parseFloat(initialData.latitude), parseFloat(initialData.longitude)]
    : [12.8797, 121.7740];

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(initialData?.latitude ? 13 : 5);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    if (initialData && searchQuery === initialData.name) {
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, initialData]);

  const performSearch = async (query) => {
    setSearching(true);
    setSearchError(null);
    try {
      const result = await mapsService.search(query);
      if (result.success && Array.isArray(result.data)) {
        setSearchResults(result.data);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Map search error:', err);
      setSearchError('Location search is currently unavailable. You can click on the map to place a pin.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.latitude);
    const lon = parseFloat(result.longitude);

    setFormData(prev => ({
      ...prev,
      name: result.name,
      address: result.address || '',
      latitude: lat,
      longitude: lon
    }));

    setSearchQuery(result.name);
    setShowDropdown(false);
    setValidationError(null);

    setMapCenter([lat, lon]);
    setMapZoom(14);
  };

  const handleMapClick = async (latlng) => {
    const lat = parseFloat(latlng.lat);
    const lon = parseFloat(latlng.lng);

    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lon
    }));
    setValidationError(null);
    setMapCenter([lat, lon]);

    // Reverse geocode to get name and formatted address
    setIsReverseGeocoding(true);
    try {
      const res = await mapsService.reverse(lat, lon);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          name: prev.name && prev.name !== 'Selected Location' && !prev.name.startsWith('Location (')
            ? prev.name
            : res.data.name,
          address: res.data.address
        }));
        if (!searchQuery || searchQuery.startsWith('Location (')) {
          setSearchQuery(res.data.name);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          address: `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`
        }));
      }
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setFormData(prev => ({ ...prev, name: val }));
    setValidationError(null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleNotesChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.name.trim()) {
      setValidationError('Please enter or search for a location name.');
      return;
    }

    if (!formData.latitude || !formData.longitude || isNaN(formData.latitude) || isNaN(formData.longitude)) {
      setValidationError('Please select a location from search or click on the map to set coordinates.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        address: formData.address ? formData.address.trim() : '',
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        description: formData.description ? formData.description.trim() : ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCoordinates = Boolean(
    formData.latitude &&
    formData.longitude &&
    !isNaN(formData.latitude) &&
    !isNaN(formData.longitude)
  );

  return (
    <div className="destination-form card">
      <div className="destination-form__header mb-4">
        <h3 className="font-bold text-xl">{initialData ? 'Edit Destination' : 'Add Destination'}</h3>
        <p className="text-muted text-sm mt-1">
          Search for a place or click anywhere on the map to set coordinates.
        </p>
      </div>

      {(error || validationError) && (
        <div className="card p-3 mb-4 bg-error-light text-error border-error text-sm font-medium">
          ⚠️ {validationError || error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Search Input with Autocomplete */}
        <div className="form-group relative" ref={dropdownRef}>
          <label htmlFor="search_location" className="form-label font-semibold">
            Search for a place *
          </label>
          <div className="search-input-wrapper relative flex items-center">
            <span className="search-icon absolute left-3 text-muted text-sm">🔍</span>
            <input
              id="search_location"
              type="text"
              className="form-input search-input pl-9 pr-8 w-full"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="E.g., Cebu City, Mactan Shrine, Eiffel Tower..."
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn absolute right-2.5 text-muted hover:text-primary text-sm p-1"
                onClick={handleClearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {searchError && (
            <div className="text-xs text-muted mt-1 italic">{searchError}</div>
          )}

          {/* Suggestions Dropdown */}
          {showDropdown && (
            <div className="autocomplete-dropdown">
              {searching ? (
                <div className="autocomplete-item text-muted text-sm p-3 flex items-center gap-2">
                  <span className="search-spinner">⏳</span> Searching places...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(result => (
                  <div
                    key={result.id || `${result.latitude}-${result.longitude}`}
                    className="autocomplete-item p-3 hover:bg-surface-hover cursor-pointer border-bottom transition-colors"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="font-semibold text-sm text-primary flex items-center gap-1.5">
                      <span>📍</span>
                      <span>{result.name}</span>
                    </div>
                    {result.address && (
                      <div className="text-xs text-muted mt-0.5 pl-5">
                        {result.address}
                      </div>
                    )}
                  </div>
                ))
              ) : searchQuery.length >= 3 ? (
                <div className="autocomplete-item text-muted text-sm p-3">
                  No places found. You can click on the map to pin a custom location.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Selected Location Card */}
        {hasCoordinates ? (
          <div className="destination-selected-card card p-4 bg-primary-light border-primary">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    📍 Selected Location
                  </span>
                  {isReverseGeocoding && (
                    <span className="text-xs text-muted italic">Resolving address...</span>
                  )}
                </div>
                <h4 className="font-bold text-base mt-1 text-primary">
                  {formData.name || 'Selected Place'}
                </h4>
                {formData.address && (
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    {formData.address}
                  </p>
                )}
              </div>
              <span className="badge bg-success text-white text-xs whitespace-nowrap">
                ✓ Ready
              </span>
            </div>
            <div className="text-xs text-muted mt-2 pt-2 border-t flex justify-between items-center">
              <span>
                Coordinates: {Number(formData.latitude).toFixed(4)}°, {Number(formData.longitude).toFixed(4)}°
              </span>
              <span className="text-primary italic">Click map to change</span>
            </div>
          </div>
        ) : (
          <div className="destination-unselected-card p-4 border border-dashed rounded-xl text-center text-muted text-sm bg-surface-secondary">
            🗺️ Search for a destination above or click anywhere on the map to drop a pin.
          </div>
        )}

        {/* Interactive Leaflet Map Picker */}
        <div className="form-group">
          <label className="form-label font-semibold flex justify-between items-center">
            <span>Map Location</span>
            <span className="text-xs text-muted font-normal">Click map to place pin</span>
          </label>
          <div className="destination-form-map-wrapper">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ height: '280px', width: '100%', borderRadius: 'var(--radius-lg)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasCoordinates && (
                <Marker position={[formData.latitude, formData.longitude]}>
                  <Popup>
                    <strong>{formData.name || 'Selected Location'}</strong>
                    {formData.address && <div className="text-xs mt-1">{formData.address}</div>}
                  </Popup>
                </Marker>
              )}
              <FormMapRecenter center={mapCenter} zoom={mapZoom} />
              <FormMapClickHandler onMapClick={handleMapClick} />
            </MapContainer>
          </div>
        </div>

        {/* Notes / Description */}
        <div className="form-group">
          <label htmlFor="description" className="form-label font-semibold">
            Notes / Description (Optional)
          </label>
          <textarea
            id="description"
            className="form-input"
            name="description"
            value={formData.description}
            onChange={handleNotesChange}
            rows="2"
            placeholder="E.g., Opening hours, landmarks to see, tickets required..."
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !hasCoordinates}
            title={!hasCoordinates ? 'Please select a location first' : ''}
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Destination')}
          </button>
        </div>
      </form>
    </div>
  );
}
