import { useState, useEffect, useRef, useCallback } from 'react';
import weatherService from '../../services/weatherService';
import { formatDateLong, formatDateWithWeekday } from '../../utils/itineraryDates';
import './WeatherWidget.css';

// Reusable Weather Icon with graceful fallback
function WeatherIcon({ icon, condition, size = 42, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null;

  if (iconUrl && !imgError) {
    return (
      <img
        src={iconUrl}
        alt={condition || 'Weather'}
        width={size}
        height={size}
        className={`weather-icon-img ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  const getFallbackSymbol = (cond = '') => {
    const c = cond.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
    if (c.includes('thunder')) return '⛈️';
    if (c.includes('snow')) return '❄️';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    return '☀️';
  };

  return (
    <span 
      className={`weather-fallback-symbol ${className}`} 
      aria-hidden="true"
      style={{ fontSize: `${size * 0.65}px` }}
    >
      {getFallbackSymbol(condition)}
    </span>
  );
}

export default function WeatherWidget({ latitude, longitude, locationName, tripDate }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0); // 0 = Current, 1 = Trip Date Forecast
  const [isPaused, setIsPaused] = useState(false);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  const timerRef = useRef(null);
  const fullViewButtonRef = useRef(null);

  // Safe trip date formatting
  const formatTripDate = (dateStr) => {
    if (!dateStr) return 'Trip Date';
    return formatDateLong(dateStr) || dateStr;
  };

  // Keyboard navigation and body scroll lock for Full View Modal
  useEffect(() => {
    if (!isFullViewOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullViewOpen(false);
        if (fullViewButtonRef.current) {
          fullViewButtonRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullViewOpen]);

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

  // Slideshow auto-rotation
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === 1 ? 0 : 1));
  }, []);

  useEffect(() => {
    if (loading || error || !weather || isPaused || !tripDate || isFullViewOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, weather, isPaused, tripDate, isFullViewOpen, nextSlide]);

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

  // SVG Temperature Sparkline Calculations (Compact and lightweight)
  const renderSparkline = (customWidth = 260, customHeight = 32) => {
    if (!dailyForecast || dailyForecast.length < 2) return null;

    const temps = dailyForecast.map(d => d.temperature_max);
    const minT = Math.min(...temps) - 2;
    const maxT = Math.max(...temps) + 2;
    const range = maxT - minT || 1;

    const width = customWidth;
    const height = customHeight;
    const padding = 12;
    const usableWidth = width - padding * 2;
    const usableHeight = height - 10;

    const points = dailyForecast.map((d, idx) => {
      const x = padding + (idx / (dailyForecast.length - 1)) * usableWidth;
      const y = height - 6 - ((d.temperature_max - minT) / range) * usableHeight;
      return { x, y, temp: d.temperature_max, day: d.day };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return (
      <div className="weather-sparkline-container mt-2 pt-1.5 border-t border-border">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Trend (°C)
          </span>
          <span className="text-[10px] text-primary font-semibold">
            H: {Math.max(...temps)}° | L: {Math.min(...dailyForecast.map(d => d.temperature_min))}°
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="weather-sparkline-svg" aria-hidden="true" style={{ height: `${height}px` }}>
          <defs>
            <linearGradient id="weatherTempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#weatherTempGrad)" />
          <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="2.5" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="1.5" />
              <text x={pt.x} y={pt.y - 4} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--color-text-main)">
                {pt.temp}°
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <>
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
        <div className="weather-header flex justify-between items-center mb-2">
          <div className="weather-title-area flex items-center gap-1.5 min-w-0 pr-1">
            <span className="weather-badge py-0.5 px-2">
              {activeSlide === 0 ? '☀️ Live' : '📅 Forecast'}
            </span>
            {locationName && (
              <span className="weather-location text-xs font-bold truncate" title={locationName}>
                📍 {locationName}
              </span>
            )}
          </div>

          <div className="weather-header-actions flex items-center gap-1.5">
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
                  Live
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSlide === 1}
                  className={`weather-tab-btn ${activeSlide === 1 ? 'active' : ''}`}
                  onClick={() => setActiveSlide(1)}
                >
                  Trip
                </button>
              </div>
            )}

            {/* FULL VIEW BUTTON */}
            <button
              ref={fullViewButtonRef}
              type="button"
              className="weather-full-view-btn btn btn-ghost btn-sm text-xs py-1 px-1.5"
              onClick={() => setIsFullViewOpen(true)}
              aria-label={`Open full weather view for ${locationName || 'destination'}`}
              title="Expand full weather view"
            >
              <span className="weather-full-view-icon" aria-hidden="true">⤢</span>
              <span className="weather-full-view-text hidden sm:inline text-[11px]">Full</span>
            </button>
          </div>
        </div>

        {/* Slide Container: Current vs Trip Date */}
        <div className="weather-slide-container">
          {/* SLIDE 0: Current Weather */}
          {activeSlide === 0 && (
            <div className="weather-slide current-slide animate-fade-in">
              <div className="weather-body flex justify-between items-center">
                <div>
                  <div className="weather-temp-row flex items-baseline gap-2">
                    <span className="weather-temp text-2xl font-black text-primary">
                      {Math.round(current.temperature)}°C
                    </span>
                    <span className="weather-condition text-xs font-semibold capitalize text-muted">
                      {current.condition}
                    </span>
                  </div>
                  {current.description && (
                    <p className="weather-desc text-[11px] text-muted capitalize mt-0.5 truncate max-w-[180px]">
                      {current.description}
                    </p>
                  )}
                </div>

                <div className="weather-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                  <WeatherIcon icon={current.icon} condition={current.condition} size={38} />
                </div>
              </div>

              <div className="weather-details-grid mt-2 pt-1.5 border-t border-border flex justify-between text-[11px] text-muted">
                <div>💧 <span className="font-semibold text-main">{current.humidity}%</span></div>
                <div>💨 <span className="font-semibold text-main">{current.wind_speed} m/s</span></div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Trip Date Forecast */}
          {activeSlide === 1 && (
            <div className="weather-slide forecast-slide animate-fade-in">
              {forecast && forecast.available ? (
                <div>
                  <div className="weather-forecast-date text-[11px] text-primary font-bold mb-0.5">
                    📅 {formatTripDate(forecast.date || tripDate)}
                  </div>

                  <div className="weather-body flex justify-between items-center">
                    <div>
                      <div className="weather-temp-row flex items-baseline gap-2">
                        <span className="weather-temp text-2xl font-black text-primary">
                          {forecast.temperature}°C
                        </span>
                        {forecast.min_temperature !== undefined && (
                          <span className="text-[11px] text-muted font-semibold">
                            / {forecast.min_temperature}°C
                          </span>
                        )}
                        <span className="weather-condition text-xs font-semibold capitalize text-muted">
                          {forecast.condition}
                        </span>
                      </div>
                      {forecast.description && (
                        <p className="weather-desc text-[11px] text-muted capitalize mt-0.5 truncate max-w-[180px]">
                          {forecast.description}
                        </p>
                      )}
                    </div>

                    <div className="weather-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                      <WeatherIcon icon={forecast.icon} condition={forecast.condition} size={38} />
                    </div>
                  </div>

                  <div className="weather-details-grid mt-2 pt-1.5 border-t border-border flex justify-between text-[11px] text-muted">
                    <div>🌧️ <span className="font-semibold text-main">{forecast.precipitation_probability}%</span></div>
                    <div>💨 <span className="font-semibold text-main">{forecast.wind_speed} m/s</span></div>
                  </div>
                </div>
              ) : (
                /* Fallback for trip dates beyond forecast range */
                <div className="weather-unavailable-card p-2 text-center">
                  <span className="text-base">🔭</span>
                  <h5 className="text-[11px] font-bold text-main mt-0.5">Forecast unavailable for this date yet.</h5>
                  <span className="text-[10px] text-muted opacity-80 mt-0.5 block font-medium">
                    Scheduled: {formatTripDate(tripDate)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GRAPHICAL FORECAST CARDS */}
        {dailyForecast.length > 0 && (
          <div className="weather-daily-forecast-section mt-2 pt-1.5 border-t border-border">
            <div className="weather-daily-grid flex gap-1 overflow-x-auto pb-0.5">
              {dailyForecast.map((dayItem, idx) => (
                <div key={idx} className={`weather-daily-pill ${idx === 0 ? 'today' : ''} py-1 px-1.5`}>
                  <span className="weather-daily-pill__day text-[10px]">{dayItem.day}</span>
                  <WeatherIcon icon={dayItem.icon} condition={dayItem.condition} size={20} />
                  <span className="weather-daily-pill__temp text-[11px]">{dayItem.temperature_max}°</span>
                  <span className="weather-daily-pill__min-temp text-[9px]">{dayItem.temperature_min}°</span>
                  {dayItem.precipitation_probability > 0 && (
                    <span className="weather-daily-pill__rain text-[9px]" title={`Rain probability: ${dayItem.precipitation_probability}%`}>
                      💧{dayItem.precipitation_probability}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GRAPHICAL TEMPERATURE TREND */}
        {renderSparkline()}

        {/* Slideshow Footer Controls (if tripDate is provided) */}
        {hasTripDate && (
          <div className="weather-controls flex justify-between items-center mt-2 pt-1.5 border-t border-border">
            <button 
              type="button" 
              className="weather-nav-btn prev text-xs py-0.5 px-1.5"
              onClick={prevSlide}
              aria-label="Previous weather slide"
              title="Previous slide"
            >
              ‹
            </button>

            <div className="weather-dots flex gap-1" role="tablist" aria-label="Slide indicators">
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
              className="weather-nav-btn next text-xs py-0.5 px-1.5"
              onClick={nextSlide}
              aria-label="Next weather slide"
              title="Next slide"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* FULL VIEW MODAL */}
      {isFullViewOpen && (
        <div 
          className="weather-modal-backdrop" 
          onClick={() => setIsFullViewOpen(false)}
          role="presentation"
        >
          <div 
            className="weather-fullview-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="weather-fullview-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="weather-fullview-header flex justify-between items-center pb-3 border-b border-border">
              <div>
                <span className="badge bg-primary-light text-primary text-xs font-bold uppercase tracking-wider">
                  Full Weather Experience
                </span>
                <h3 id="weather-fullview-title" className="text-xl font-black text-main mt-1">
                  📍 {locationName || 'Destination Weather'}
                </h3>
              </div>
              <button
                type="button"
                className="weather-modal-close-btn btn btn-ghost text-lg p-2"
                onClick={() => {
                  setIsFullViewOpen(false);
                  if (fullViewButtonRef.current) fullViewButtonRef.current.focus();
                }}
                aria-label="Close full weather view"
                title="Close (Escape)"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="weather-fullview-body py-4 flex flex-col gap-6">
              
              {/* CURRENT WEATHER HERO */}
              <div className="weather-fullview-hero card bg-surface-secondary border border-border p-4 rounded-xl">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Current Weather
                </div>
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <WeatherIcon icon={current.icon} condition={current.condition} size={64} />
                    <div>
                      <div className="text-4xl md:text-5xl font-black text-primary">
                        {Math.round(current.temperature)}°C
                      </div>
                      <div className="text-base font-bold text-main capitalize mt-0.5">
                        {current.condition}
                      </div>
                      {current.description && (
                        <div className="text-xs text-muted capitalize">
                          {current.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comprehensive Metric Grid */}
                  <div className="weather-metrics-grid grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface p-3 rounded-lg border border-border">
                    <div className="weather-metric-item">
                      <span className="text-[11px] text-muted block">💧 Humidity</span>
                      <span className="text-sm font-extrabold text-main">{current.humidity}%</span>
                    </div>
                    <div className="weather-metric-item">
                      <span className="text-[11px] text-muted block">💨 Wind Speed</span>
                      <span className="text-sm font-extrabold text-main">{current.wind_speed} m/s</span>
                    </div>
                    <div className="weather-metric-item">
                      <span className="text-[11px] text-muted block">🌡️ Today High</span>
                      <span className="text-sm font-extrabold text-primary">
                        {dailyForecast[0]?.temperature_max != null ? `${dailyForecast[0].temperature_max}°C` : '--'}
                      </span>
                    </div>
                    <div className="weather-metric-item">
                      <span className="text-[11px] text-muted block">❄️ Today Low</span>
                      <span className="text-sm font-extrabold text-muted">
                        {dailyForecast[0]?.temperature_min != null ? `${dailyForecast[0].temperature_min}°C` : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRIP-DATE WEATHER HIGHLIGHT */}
              {hasTripDate && (
                <div className="weather-tripdate-section card border-primary p-4 bg-primary-light/10 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="badge bg-primary text-white text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      📅 Your Trip Date Weather
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {formatTripDate(tripDate)}
                    </span>
                  </div>

                  {forecast && forecast.available ? (
                    <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        <WeatherIcon icon={forecast.icon} condition={forecast.condition} size={48} />
                        <div>
                          <span className="text-2xl font-black text-primary">
                            {forecast.temperature}°C
                          </span>
                          {forecast.min_temperature !== undefined && (
                            <span className="text-xs text-muted font-bold ml-1.5">
                              / {forecast.min_temperature}°C
                            </span>
                          )}
                          <div className="text-sm font-bold text-main capitalize">
                            {forecast.condition} — {forecast.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 text-xs font-semibold text-muted bg-surface py-2 px-3 rounded border border-border">
                        <div>🌧️ Rain Chance: <span className="text-main font-bold">{forecast.precipitation_probability}%</span></div>
                        <div>💨 Wind: <span className="text-main font-bold">{forecast.wind_speed} m/s</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-surface rounded border border-dashed border-border text-center">
                      <div className="text-lg">🔭</div>
                      <h4 className="text-xs font-bold text-main mt-1">Forecast unavailable for this date yet.</h4>
                      <p className="text-xs text-muted mt-0.5">
                        Weather forecasts become available within 16 days of your trip date ({formatTripDate(tripDate)}). Check back closer to departure.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* EXTENDED FORECAST TIMELINE */}
              {dailyForecast.length > 0 && (
                <div className="weather-extended-forecast-section">
                  <div className="flex justify-between items-center mb-2.5">
                    <h4 className="font-extrabold text-sm text-main uppercase tracking-wider">
                      7-Day Forecast Timeline
                    </h4>
                    <span className="text-xs text-muted">Updated in real-time</span>
                  </div>

                  <div className="weather-fullview-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {dailyForecast.map((dayItem, idx) => (
                      <div 
                        key={idx} 
                        className={`weather-fullview-card card p-3 flex flex-col items-center text-center rounded-lg border ${
                          idx === 0 ? 'border-primary bg-primary-light/10' : 'border-border bg-surface'
                        }`}
                      >
                        <span className="text-xs font-black text-main">
                          {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dayItem.day}
                        </span>
                        <span className="text-[10px] text-muted mb-1">
                          {formatDateWithWeekday(dayItem.date).split(',')[1] || dayItem.date}
                        </span>

                        <WeatherIcon icon={dayItem.icon} condition={dayItem.condition} size={36} />

                        <div className="weather-fullview-temp text-base font-black text-primary mt-1">
                          {dayItem.temperature_max}°
                        </div>
                        <div className="weather-fullview-mintemp text-xs font-semibold text-muted">
                          {dayItem.temperature_min}°
                        </div>

                        <span className="text-[11px] font-medium text-muted capitalize truncate w-full mt-1">
                          {dayItem.condition}
                        </span>

                        {dayItem.precipitation_probability > 0 && (
                          <span className="badge bg-surface-secondary text-primary text-[10px] font-bold mt-1.5 px-1.5 py-0.5 rounded border border-border">
                            💧 {dayItem.precipitation_probability}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAILED TEMPERATURE TREND GRAPH */}
              <div className="weather-fullview-trend pt-2 border-t border-border">
                {renderSparkline(560, 64)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="weather-fullview-footer pt-3 border-t border-border flex justify-between items-center text-xs text-muted">
              <span>Weather data provided by Open-Meteo & OpenWeatherMap</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsFullViewOpen(false);
                  if (fullViewButtonRef.current) fullViewButtonRef.current.focus();
                }}
              >
                Close Full View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
