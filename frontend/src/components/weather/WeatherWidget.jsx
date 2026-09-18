import { useState, useEffect } from 'react';
import weatherService from '../../services/weatherService';
import './WeatherWidget.css';

export default function WeatherWidget({ latitude, longitude, locationName }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      setLoading(false);
      setError('Coordinates missing');
      return;
    }

    let isMounted = true;
    
    async function fetchWeather() {
      try {
        setLoading(true);
        const res = await weatherService.getWeather(latitude, longitude);
        if (isMounted && res.success) {
          setWeather(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Weather unavailable');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="weather-widget loading">
        <div className="text-center">
          <div className="weather-loading-icon mb-1">🌤️</div>
          <p className="text-muted text-xs">
            Loading weather{locationName ? ` for ${locationName}` : ''}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget error">
        <div className="text-center p-2">
          <span className="text-base">☁️</span>
          <p className="text-muted text-xs mt-1">
            Weather unavailable{locationName ? ` for ${locationName}` : ''}.
          </p>
          <p className="text-muted text-xs opacity-75">Add or update destination map coordinates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-widget card bg-primary-light border-primary">
      <div className="weather-header flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-sm">Current Weather</h4>
          {locationName && (
            <span className="weather-location text-xs text-muted block mt-0.5">
              📍 {locationName}
            </span>
          )}
        </div>
        {weather.icon && (
          <img 
            src={`https://openweathermap.org/img/wn/${weather.icon}.png`} 
            alt={weather.condition} 
            className="weather-icon"
          />
        )}
      </div>
      <div className="weather-main flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-primary">{Math.round(weather.temperature)}°C</span>
        <span className="text-muted capitalize mb-1 text-sm font-medium">{weather.description}</span>
      </div>
      <div className="weather-details flex gap-4 text-xs text-muted">
        <div>💧 Humidity: {weather.humidity}%</div>
        <div>💨 Wind: {weather.wind_speed} m/s</div>
      </div>
    </div>
  );
}
