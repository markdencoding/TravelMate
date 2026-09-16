const AppError = require('../utils/AppError');

class WeatherService {
  async getCurrentWeather(lat, lon) {
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('WEATHER_API_KEY_MISSING');
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}`);
      }

      const data = await response.json();

      // Extract only the minimum required fields
      return {
        temperature: data.main.temp,
        condition: data.weather[0]?.main || 'Unknown',
        description: data.weather[0]?.description || '',
        humidity: data.main.humidity,
        wind_speed: data.wind.speed, // meter/sec in metric
        icon: data.weather[0]?.icon || null // standard openweathermap icon code
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      throw new Error('WEATHER_API_FAILED');
    }
  }
}

module.exports = new WeatherService();
