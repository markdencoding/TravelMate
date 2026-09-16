const weatherService = require('../services/weather.service');
const { success, error } = require('../utils/responseHelper');

exports.getCurrentWeather = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    
    // Validate coordinates
    if (lat === undefined || lon === undefined || lat === '' || lon === '') {
      return error(res, 'Latitude and Longitude are required', null, 400);
    }
    
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    
    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return error(res, 'Invalid coordinates', null, 400);
    }

    const weatherData = await weatherService.getCurrentWeather(parsedLat, parsedLon);
    return success(res, 'Weather data retrieved successfully', weatherData);
    
  } catch (err) {
    if (err.message === 'WEATHER_API_KEY_MISSING' || err.message === 'WEATHER_API_FAILED') {
      return error(res, 'Weather service is currently unavailable.', err.message, 503);
    }
    next(err);
  }
};
