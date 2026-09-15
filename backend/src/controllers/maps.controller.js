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
