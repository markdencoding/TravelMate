import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Remove Leaflet promotional prefix link while strictly preserving required OpenStreetMap attribution
if (L.Control && L.Control.Attribution) {
  L.Control.Attribution.prototype.options.prefix = false;
}

// Component to recenter map when destinations change
function MapUpdater({ destinations }) {
  const map = useMap();
  
  useEffect(() => {
    if (destinations && destinations.length > 0) {
      const validDestinations = destinations.filter(d => d.latitude && d.longitude);
      
      if (validDestinations.length > 0) {
        const bounds = L.latLngBounds(validDestinations.map(d => [d.latitude, d.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [destinations, map]);
  return null;
}

// Map resize invalidator for smooth maximize/minimize transitions
function MapResizeHandler({ isMaximized }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [isMaximized, map]);
  return null;
}

export default function DestinationMap({ destinations }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const defaultCenter = [12.8797, 121.7740]; // Philippines
  
  const validDestinations = destinations?.filter(d => d.latitude && d.longitude) || [];

  // Lock body scroll and listen for Escape key when map is maximized
  useEffect(() => {
    if (!isMaximized) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMaximized]);

  if (validDestinations.length === 0) {
    return (
      <div className="destination-map destination-map--empty">
        <div className="destination-map__placeholder">
          🗺️
          <p>Add destinations with coordinates to see them on the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`destination-map relative ${isMaximized ? 'destination-map--maximized' : ''}`}>
      {/* Maximized View Header Bar */}
      {isMaximized && (
        <div className="map-maximized-floating-bar flex justify-between items-center p-3">
          <div className="flex items-center gap-2 bg-surface p-2 px-3 rounded-lg border border-border shadow-md">
            <span className="text-primary font-bold text-sm">🗺️ Trip Destinations ({validDestinations.length})</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-md bg-surface"
            onClick={() => setIsMaximized(false)}
            aria-label="Minimize map (Esc)"
          >
            <span>✕</span> Exit Full Map (Esc)
          </button>
        </div>
      )}

      {/* Google-Maps-Style Maximize / Minimize Button */}
      <button
        type="button"
        className="map-maximize-btn"
        onClick={() => setIsMaximized(prev => !prev)}
        aria-label={isMaximized ? "Minimize map view" : "Maximize map view"}
        title={isMaximized ? "Minimize map (Esc)" : "Maximize map view"}
      >
        {isMaximized ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        )}
      </button>

      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        style={{ height: isMaximized ? '100vh' : '100%', width: '100%', borderRadius: isMaximized ? '0' : 'var(--radius-lg)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validDestinations.map(dest => (
          <Marker 
            key={dest.id} 
            position={[parseFloat(dest.latitude), parseFloat(dest.longitude)]}
          >
            <Popup>
              <strong>{dest.name}</strong>
              <br />
              {dest.address && <span className="text-xs text-muted">{dest.address}</span>}
            </Popup>
          </Marker>
        ))}
        
        <MapUpdater destinations={validDestinations} />
        <MapResizeHandler isMaximized={isMaximized} />
      </MapContainer>
    </div>
  );
}
