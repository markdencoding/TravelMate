import { useState, useEffect } from 'react';
import weatherService from '../../services/weatherService';
import './WeatherWidget.css';

export default function WeatherWidget({ latitude, longitude }) {
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
        <p className="text-muted">Loading weather...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget error">
        <p className="text-muted text-sm">☁️ Weather unavailable for this location.</p>
      </div>
    );
  }

  return (
    <div className="weather-widget card bg-primary-light border-primary">
      <div className="weather-header flex justify-between items-center mb-2">
        <h4 className="font-bold">Current Weather</h4>
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
        <span className="text-muted capitalize mb-1">{weather.description}</span>
      </div>
      <div className="weather-details flex gap-4 text-sm text-muted">
        <div>💧 Humidity: {weather.humidity}%</div>
        <div>💨 Wind: {weather.wind_speed} m/s</div>
      </div>
    </div>
  );
}
