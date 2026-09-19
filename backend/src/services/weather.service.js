const AppError = require('../utils/AppError');

// WMO weather code interpretation for Open-Meteo
const WMO_CODE_MAP = {
  0: { condition: 'Clear', description: 'clear sky', icon: '01d' },
  1: { condition: 'Mainly Clear', description: 'mainly clear', icon: '02d' },
  2: { condition: 'Partly Cloudy', description: 'partly cloudy', icon: '02d' },
  3: { condition: 'Overcast', description: 'overcast', icon: '03d' },
  45: { condition: 'Fog', description: 'fog', icon: '50d' },
  48: { condition: 'Fog', description: 'depositing rime fog', icon: '50d' },
  51: { condition: 'Drizzle', description: 'light drizzle', icon: '09d' },
  53: { condition: 'Drizzle', description: 'moderate drizzle', icon: '09d' },
  55: { condition: 'Drizzle', description: 'dense drizzle', icon: '09d' },
  61: { condition: 'Rain', description: 'slight rain', icon: '10d' },
  63: { condition: 'Rain', description: 'moderate rain', icon: '10d' },
  65: { condition: 'Rain', description: 'heavy rain', icon: '10d' },
  71: { condition: 'Snow', description: 'slight snow fall', icon: '13d' },
  73: { condition: 'Snow', description: 'moderate snow fall', icon: '13d' },
  75: { condition: 'Snow', description: 'heavy snow fall', icon: '13d' },
  80: { condition: 'Showers', description: 'slight rain showers', icon: '09d' },
  81: { condition: 'Showers', description: 'moderate rain showers', icon: '09d' },
  82: { condition: 'Showers', description: 'violent rain showers', icon: '09d' },
  95: { condition: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
  96: { condition: 'Thunderstorm', description: 'thunderstorm with slight hail', icon: '11d' },
  99: { condition: 'Thunderstorm', description: 'thunderstorm with heavy hail', icon: '11d' }
};

class WeatherService {
  async getCurrentWeather(lat, lon, tripDate = null) {
    const apiKey = process.env.WEATHER_API_KEY;
    let targetDateStr = null;

    if (tripDate) {
      try {
        // Normalize date to YYYY-MM-DD
        targetDateStr = new Date(tripDate).toISOString().split('T')[0];
      } catch {
        targetDateStr = null;
      }
    }

    // 1. If OpenWeatherMap API key is configured, use it for current weather
    let currentData = null;
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        
        if (response.ok) {
          const data = await response.json();
          currentData = {
            temperature: Math.round(data.main.temp),
            condition: data.weather[0]?.main || 'Unknown',
            description: data.weather[0]?.description || '',
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
            icon: data.weather[0]?.icon || '02d'
          };
        }
      } catch (err) {
        console.warn('OpenWeatherMap request failed, falling back to Open-Meteo:', err.message);
      }
    }

    // 2. Open-Meteo: Fetch current weather + 16-day forecast
    try {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=16`;
      const response = await fetch(openMeteoUrl, { signal: AbortSignal.timeout(6000) });

      if (!response.ok) {
        throw new Error(`Open-Meteo API returned ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;
      const currentWeatherInfo = WMO_CODE_MAP[current.weather_code] || {
        condition: 'Partly Cloudy',
        description: 'partly cloudy',
        icon: '02d'
      };

      if (!currentData) {
        currentData = {
          temperature: Math.round(current.temperature_2m),
          condition: currentWeatherInfo.condition,
          description: currentWeatherInfo.description,
          humidity: current.relative_humidity_2m,
          wind_speed: current.wind_speed_10m,
          icon: currentWeatherInfo.icon
        };
      }

      // Process forecast for target trip date
      let forecastData = null;
      if (targetDateStr && data.daily && data.daily.time) {
        const dayIndex = data.daily.time.indexOf(targetDateStr);

        if (dayIndex !== -1) {
          const forecastCode = data.daily.weather_code[dayIndex];
          const forecastWeather = WMO_CODE_MAP[forecastCode] || {
            condition: 'Partly Cloudy',
            description: 'partly cloudy',
            icon: '02d'
          };

          forecastData = {
            available: true,
            date: targetDateStr,
            temperature: Math.round(data.daily.temperature_2m_max[dayIndex]),
            min_temperature: Math.round(data.daily.temperature_2m_min[dayIndex]),
            condition: forecastWeather.condition,
            description: forecastWeather.description,
            precipitation_probability: data.daily.precipitation_probability_max[dayIndex] ?? 0,
            wind_speed: data.daily.wind_speed_10m_max[dayIndex] ?? 0,
            icon: forecastWeather.icon
          };
        } else {
          // Date is beyond the 16-day forecast range or in the past
          forecastData = {
            available: false,
            date: targetDateStr,
            message: "Weather forecasts for this date aren't available yet. Check again closer to your trip."
          };
        }
      }

      // Process 7-day graphical daily forecast & temperature trend
      let dailyForecast = [];
      if (data.daily && data.daily.time) {
        const count = Math.min(7, data.daily.time.length);
        for (let i = 0; i < count; i++) {
          const dateStr = data.daily.time[i];
          const code = data.daily.weather_code[i];
          const wInfo = WMO_CODE_MAP[code] || { condition: 'Partly Cloudy', description: 'partly cloudy', icon: '02d' };
          
          let dayLabel = 'Today';
          if (i > 0) {
            try {
              const d = new Date(dateStr + 'T00:00:00');
              dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
            } catch {
              dayLabel = dateStr;
            }
          }

          dailyForecast.push({
            date: dateStr,
            day: dayLabel,
            temperature_max: Math.round(data.daily.temperature_2m_max[i]),
            temperature_min: Math.round(data.daily.temperature_2m_min[i]),
            temperature: Math.round(data.daily.temperature_2m_max[i]),
            condition: wInfo.condition,
            description: wInfo.description,
            icon: wInfo.icon,
            precipitation_probability: data.daily.precipitation_probability_max[i] ?? 0,
            wind_speed: data.daily.wind_speed_10m_max[i] ?? 0
          });
        }
      }

      return {
        ...currentData,
        current: currentData,
        forecast: forecastData,
        daily_forecast: dailyForecast
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      if (currentData) {
        return {
          ...currentData,
          current: currentData,
          forecast: targetDateStr ? {
            available: false,
            date: targetDateStr,
            message: "Weather forecasts for this date aren't available yet. Check again closer to your trip."
          } : null
        };
      }
      throw new Error('WEATHER_API_FAILED');
    }
  }
}

module.exports = new WeatherService();
