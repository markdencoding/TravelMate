import { useState, useEffect, useRef, useCallback } from 'react';
import weatherService from '../../services/weatherService';
import './WeatherWidget.css';

export default function WeatherWidget({ latitude, longitude, locationName, tripDate }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0); // 0 = Current, 1 = Trip Date Forecast
  const [isPaused, setIsPaused] = useState(false);
  const [showTrend, setShowTrend] = useState(true);

  const timerRef = useRef(null);

  // Helper: Format trip date safely
  const formatTripDate = (dateStr) => {
    if (!dateStr) return 'Trip Date';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

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
        const res = await weatherService.getWeather(latitude, longitude, tripDate);
        if (isMounted && res.success) {
          setWeather(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Weather unavailable for this destination');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, tripDate]);

  // Slideshow auto-rotation (6 seconds interval, pauses on hover/focus)
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === 1 ? 0 : 1));
  }, []);

  useEffect(() => {
    if (loading || error || !weather || isPaused || !tripDate) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, weather, isPaused, tripDate, nextSlide]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };

  if (loading) {
    return (
      <div className="weather-widget loading" aria-live="polite" aria-busy="true">
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
      <div className="weather-widget error" role="alert">
        <div className="text-center p-2">
          <span className="text-base">☁️</span>
          <p className="text-muted text-xs mt-1">
            Weather unavailable{locationName ? ` for ${locationName}` : ''}.
          </p>
          <p className="text-muted text-xs opacity-75">Destination map coordinates required.</p>
        </div>
      </div>
    );
  }

  const current = weather.current || weather;
  const forecast = weather.forecast;
  const dailyForecast = weather.daily_forecast || [];
  const hasTripDate = Boolean(tripDate);

  // SVG Temperature Sparkline Calculations
  const renderSparkline = () => {
    if (!dailyForecast || dailyForecast.length < 2) return null;

    const temps = dailyForecast.map(d => d.temperature_max);
    const minT = Math.min(...temps) - 2;
    const maxT = Math.max(...temps) + 2;
    const range = maxT - minT || 1;

    const width = 280;
    const height = 48;
    const padding = 16;
    const usableWidth = width - padding * 2;
    const usableHeight = height - 16;

    const points = dailyForecast.map((d, idx) => {
      const x = padding + (idx / (dailyForecast.length - 1)) * usableWidth;
      const y = height - 8 - ((d.temperature_max - minT) / range) * usableHeight;
      return { x, y, temp: d.temperature_max, day: d.day };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return (
      <div className="weather-sparkline-container mt-3 pt-2 border-t border-border">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
            Temperature Trend (°C)
          </span>
          <span className="text-[10px] text-primary font-semibold">
            High: {Math.max(...temps)}° | Low: {Math.min(...dailyForecast.map(d => d.temperature_min))}°
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="weather-sparkline-svg" aria-hidden="true">
          <defs>
            <linearGradient id="weatherTempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#weatherTempGrad)" />
          <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" />
              <text x={pt.x} y={pt.y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--color-text-main)">
                {pt.temp}°
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div 
      className="weather-widget weather-slideshow card border-primary"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`Weather forecast for ${locationName || 'destination'}`}
    >
      {/* Slideshow Top Header */}
      <div className="weather-header flex justify-between items-center mb-3">
        <div className="weather-title-area">
          <span className="weather-badge">
            {activeSlide === 0 ? '☀️ Live Weather' : '📅 Trip Forecast'}
          </span>
          {locationName && (
            <span className="weather-location text-xs font-semibold block mt-1" title={locationName}>
              📍 {locationName}
            </span>
          )}
        </div>

        {/* Tab Controls (if tripDate is provided) */}
        {hasTripDate && (
          <div className="weather-tabs" role="tablist" aria-label="Weather view tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeSlide === 0}
              className={`weather-tab-btn ${activeSlide === 0 ? 'active' : ''}`}
              onClick={() => setActiveSlide(0)}
            >
              Current
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSlide === 1}
              className={`weather-tab-btn ${activeSlide === 1 ? 'active' : ''}`}
              onClick={() => setActiveSlide(1)}
            >
              Trip Date
            </button>
          </div>
        )}
      </div>

      {/* Slide Container: Current vs Trip Date */}
      <div className="weather-slide-container">
        {/* SLIDE 0: Current Weather */}
        {activeSlide === 0 && (
          <div className="weather-slide current-slide animate-fade-in">
            <div className="weather-body flex justify-between items-center">
              <div>
                <div className="weather-temp-row flex items-baseline gap-2">
                  <span className="weather-temp text-3xl font-black text-primary">
                    {Math.round(current.temperature)}°C
                  </span>
                  <span className="weather-condition text-sm font-medium capitalize text-muted">
                    {current.condition}
                  </span>
                </div>
                {current.description && (
                  <p className="weather-desc text-xs text-muted capitalize mt-0.5">
                    {current.description}
                  </p>
                )}
              </div>

              {current.icon && (
                <div className="weather-icon-wrapper">
                  <img 
                    src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`} 
                    alt={current.condition} 
                    className="weather-icon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="weather-details-grid mt-3 pt-2.5 border-t border-border flex justify-between text-xs text-muted">
              <div>💧 Humidity: <span className="font-semibold text-main">{current.humidity}%</span></div>
              <div>💨 Wind: <span className="font-semibold text-main">{current.wind_speed} m/s</span></div>
            </div>
          </div>
        )}

        {/* SLIDE 1: Trip Date Forecast */}
        {activeSlide === 1 && (
          <div className="weather-slide forecast-slide animate-fade-in">
            {forecast && forecast.available ? (
              <div>
                <div className="weather-forecast-date text-xs text-primary font-bold mb-1">
                  📅 {formatTripDate(forecast.date || tripDate)}
                </div>

                <div className="weather-body flex justify-between items-center">
                  <div>
                    <div className="weather-temp-row flex items-baseline gap-2">
                      <span className="weather-temp text-3xl font-black text-primary">
                        {forecast.temperature}°C
                      </span>
                      {forecast.min_temperature !== undefined && (
                        <span className="text-xs text-muted font-semibold">
                          / {forecast.min_temperature}°C
                        </span>
                      )}
                      <span className="weather-condition text-sm font-medium capitalize text-muted">
                        {forecast.condition}
                      </span>
                    </div>
                    {forecast.description && (
                      <p className="weather-desc text-xs text-muted capitalize mt-0.5">
                        {forecast.description}
                      </p>
                    )}
                  </div>

                  {forecast.icon && (
                    <div className="weather-icon-wrapper">
                      <img 
                        src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`} 
                        alt={forecast.condition} 
                        className="weather-icon"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="weather-details-grid mt-3 pt-2.5 border-t border-border flex justify-between text-xs text-muted">
                  <div>🌧️ Rain: <span className="font-semibold text-main">{forecast.precipitation_probability}%</span></div>
                  <div>💨 Wind: <span className="font-semibold text-main">{forecast.wind_speed} m/s</span></div>
                </div>
              </div>
            ) : (
              /* Fallback for trip dates beyond forecast range */
              <div className="weather-unavailable-card p-2.5 text-center">
                <div className="text-xl mb-1">🔭</div>
                <h5 className="text-xs font-bold text-main">Forecast not available yet</h5>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Weather forecasts for this date aren&apos;t available yet. Check again closer to your trip.
                </p>
                <span className="text-[10px] text-muted opacity-75 mt-1 block font-medium">
                  Trip Date: {formatTripDate(tripDate)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GRAPHICAL FORECAST CARDS (Daily weather at a glance) */}
      {dailyForecast.length > 0 && (
        <div className="weather-daily-forecast-section mt-3 pt-2.5 border-t border-border">
          <div className="weather-daily-grid flex gap-1.5 overflow-x-auto pb-1">
            {dailyForecast.map((dayItem, idx) => (
              <div key={idx} className={`weather-daily-pill ${idx === 0 ? 'today' : ''}`}>
                <span className="weather-daily-pill__day">{dayItem.day}</span>
                {dayItem.icon && (
                  <img
                    src={`https://openweathermap.org/img/wn/${dayItem.icon}.png`}
                    alt={dayItem.condition}
                    className="weather-daily-pill__icon"
                  />
                )}
                <span className="weather-daily-pill__temp">{dayItem.temperature_max}°</span>
                <span className="weather-daily-pill__min-temp">{dayItem.temperature_min}°</span>
                {dayItem.precipitation_probability > 0 && (
                  <span className="weather-daily-pill__rain" title={`Rain probability: ${dayItem.precipitation_probability}%`}>
                    💧{dayItem.precipitation_probability}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAPHICAL TEMPERATURE TREND (Lightweight SVG Sparkline) */}
      {renderSparkline()}

      {/* Slideshow Footer Controls (if tripDate is provided) */}
      {hasTripDate && (
        <div className="weather-controls flex justify-between items-center mt-3 pt-2 border-t border-border">
          <button 
            type="button" 
            className="weather-nav-btn prev"
            onClick={prevSlide}
            aria-label="Previous weather slide"
            title="Previous slide"
          >
            ‹
          </button>

          {/* Dot indicators */}
          <div className="weather-dots flex gap-1.5" role="tablist" aria-label="Slide indicators">
            <button
              type="button"
              className={`weather-dot ${activeSlide === 0 ? 'active' : ''}`}
              onClick={() => setActiveSlide(0)}
              aria-label="Slide 1: Current weather"
              aria-selected={activeSlide === 0}
            />
            <button
              type="button"
              className={`weather-dot ${activeSlide === 1 ? 'active' : ''}`}
              onClick={() => setActiveSlide(1)}
              aria-label="Slide 2: Trip date forecast"
              aria-selected={activeSlide === 1}
            />
          </div>

          <button 
            type="button" 
            className="weather-nav-btn next"
            onClick={nextSlide}
            aria-label="Next weather slide"
            title="Next slide"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
