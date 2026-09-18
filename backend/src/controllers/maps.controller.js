const mapsService = require('../services/maps.service');
const { success, error } = require('../utils/responseHelper');

exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return success(res, 'Empty query', []);
    }

    const results = await mapsService.searchLocation(q);
    return success(res, 'Locations found', results);
  } catch (err) {
    if (err.message === 'MAPS_API_KEY_MISSING') {
      return error(res, 'Maps integration is not configured on the server.', 'Missing MAPS_API_KEY', 503);
    }
    next(err);
  }
};

exports.reverse = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (lat === undefined || lon === undefined || lat === '' || lon === '') {
      return error(res, 'Latitude and Longitude are required', null, 400);
    }

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return error(res, 'Invalid coordinates', null, 400);
    }

    const result = await mapsService.reverseGeocode(parsedLat, parsedLon);
    return success(res, 'Location reverse geocoded', result);
  } catch (err) {
    next(err);
  }
};
