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

// Component to recenter map when destinations change
function MapUpdater({ destinations }) {
  const map = useMap();
  
  if (destinations && destinations.length > 0) {
    const validDestinations = destinations.filter(d => d.latitude && d.longitude);
    
    if (validDestinations.length > 0) {
      const bounds = L.latLngBounds(validDestinations.map(d => [d.latitude, d.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }
  return null;
}

export default function DestinationMap({ destinations }) {
  const defaultCenter = [12.8797, 121.7740]; // Philippines
  
  const validDestinations = destinations?.filter(d => d.latitude && d.longitude) || [];

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
    <div className="destination-map">
      <MapContainer 
        center={defaultCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
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
      </MapContainer>
    </div>
  );
}
