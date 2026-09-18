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
  async getCurrentWeather(lat, lon) {
    const apiKey = process.env.WEATHER_API_KEY;
    
    // 1. If OpenWeatherMap API key is configured, use it
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        
        if (response.ok) {
          const data = await response.json();
          return {
            temperature: Math.round(data.main.temp),
            condition: data.weather[0]?.main || 'Unknown',
            description: data.weather[0]?.description || '',
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
            icon: data.weather[0]?.icon || '02d'
          };
        }
        console.warn(`OpenWeatherMap returned ${response.status}, falling back to Open-Meteo`);
      } catch (err) {
        console.warn('OpenWeatherMap request failed, falling back to Open-Meteo:', err.message);
      }
    }

    // 2. Open-Meteo: Zero-key open standard meteorological API
    try {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
      const response = await fetch(openMeteoUrl, { signal: AbortSignal.timeout(6000) });

      if (!response.ok) {
        throw new Error(`Open-Meteo API returned ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;
      const weatherInfo = WMO_CODE_MAP[current.weather_code] || {
        condition: 'Partly Cloudy',
        description: 'partly cloudy',
        icon: '02d'
      };

      return {
        temperature: Math.round(current.temperature_2m),
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        humidity: current.relative_humidity_2m,
        wind_speed: current.wind_speed_10m,
        icon: weatherInfo.icon
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      throw new Error('WEATHER_API_FAILED');
    }
  }
}

module.exports = new WeatherService();
