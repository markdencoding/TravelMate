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

// Remove Leaflet promotional prefix link while strictly preserving required OpenStreetMap attribution
if (L.Control && L.Control.Attribution) {
  L.Control.Attribution.prototype.options.prefix = false;
}

const POPULAR_CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' }
];

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
    city: initialData?.city || '',
    country: initialData?.country || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude ? parseFloat(initialData.latitude) : '',
    longitude: initialData?.longitude ? parseFloat(initialData.longitude) : '',
    currency: initialData?.currency || '',
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
      city: result.city || '',
      country: result.country || '',
      address: result.address || '',
      latitude: lat,
      longitude: lon,
      currency: result.currency || prev.currency || ''
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

    // Reverse geocode to get name and formatted address in English
    setIsReverseGeocoding(true);
    try {
      const res = await mapsService.reverse(lat, lon);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          name: prev.name && prev.name !== 'Selected Location' && !prev.name.startsWith('Location (')
            ? prev.name
            : res.data.name,
          city: res.data.city || prev.city || '',
          country: res.data.country || prev.country || '',
          address: res.data.address,
          currency: res.data.currency || prev.currency || ''
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
        currency: formData.currency ? formData.currency.trim().toUpperCase() : null,
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
        <div className="form-group destination-search-group relative" ref={dropdownRef}>
          <label htmlFor="search_location" className="form-label">
            Search for a place *
          </label>
          <div className="search-input-wrapper relative flex items-center">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              id="search_location"
              type="text"
              className="form-input search-input"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="E.g., Cebu City, Mactan Shrine, Eiffel Tower..."
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search location"
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

        {/* Selected Destination Details Panel (English + Map) */}
        {hasCoordinates ? (
          <div className="destination-selected-panel card border-primary p-4 bg-surface">
            <div className="destination-selected-panel__header flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary-light text-primary text-xs font-bold uppercase tracking-wider">
                    📍 Destination
                  </span>
                  {formData.country && (
                    <span className="badge bg-surface-secondary text-main text-xs border border-border font-semibold">
                      {formData.country}
                    </span>
                  )}
                  {formData.city && formData.city !== formData.name && (
                    <span className="badge bg-surface-secondary text-muted text-xs border border-border">
                      {formData.city}
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-xl mt-1.5 text-main">
                  {formData.name || 'Selected Destination'}
                </h4>
                {formData.address && (
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    📍 {formData.address}
                  </p>
                )}
              </div>
              <span className="badge bg-success text-white text-xs font-bold whitespace-nowrap">
                ✓ Location Ready
              </span>
            </div>

            {/* Interactive Leaflet Map Centered on Selected Destination */}
            <div className="destination-form-map-wrapper rounded-lg overflow-hidden border border-border mb-3">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                style={{ height: '260px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[formData.latitude, formData.longitude]}>
                  <Popup>
                    <strong>{formData.name || 'Selected Destination'}</strong>
                    {formData.address && <div className="text-xs mt-1">{formData.address}</div>}
                  </Popup>
                </Marker>
                <FormMapRecenter center={mapCenter} zoom={mapZoom} />
                <FormMapClickHandler onMapClick={handleMapClick} />
              </MapContainer>
            </div>

            {/* Structured Destination Information with English Labels */}
            <div className="destination-info-grid grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-surface-secondary rounded-lg border border-border text-xs">
              <div>
                <span className="text-muted font-bold block uppercase tracking-wider text-[10px]">
                  Address
                </span>
                <p className="font-medium text-main mt-0.5 leading-snug">
                  {formData.address || 'Address not available'}
                </p>
              </div>
              <div>
                <span className="text-muted font-bold block uppercase tracking-wider text-[10px]">
                  Coordinates
                </span>
                <p className="font-medium text-main mt-0.5 font-mono">
                  {Number(formData.latitude).toFixed(4)}°, {Number(formData.longitude).toFixed(4)}°
                </p>
              </div>
            </div>
            <div className="text-[11px] text-muted mt-2 flex justify-between items-center">
              <span>📍 Click anywhere on the map to reposition the pin.</span>
            </div>
          </div>
        ) : (
          <div className="destination-unselected-panel">
            <div className="p-4 border border-dashed rounded-xl text-center text-muted text-sm bg-surface-secondary mb-3">
              🗺️ Search for a destination above or click anywhere on the map to set location coordinates.
            </div>
            <div className="destination-form-map-wrapper rounded-lg overflow-hidden border border-border">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                style={{ height: '240px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FormMapRecenter center={mapCenter} zoom={mapZoom} />
                <FormMapClickHandler onMapClick={handleMapClick} />
              </MapContainer>
            </div>
          </div>
        )}

        {/* Destination Local Currency */}
        <div className="form-group">
          <label htmlFor="currency" className="form-label font-semibold flex justify-between items-center">
            <span>Local Currency</span>
            {formData.currency && (
              <span className="badge bg-primary-light text-primary text-xs font-bold">
                Auto-detected: {formData.currency}
              </span>
            )}
          </label>
          <select
            id="currency"
            name="currency"
            className="form-input"
            value={formData.currency || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
          >
            <option value="">-- Select Local Currency (Optional) --</option>
            {POPULAR_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
          <p className="text-muted text-xs mt-1">
            Local currency at this destination used for budget estimates and conversion.
          </p>
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
