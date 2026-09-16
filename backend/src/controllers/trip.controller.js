const tripService = require('../services/trip.service');
const reportService = require('../services/report.service');
const { success, error } = require('../utils/responseHelper');

/**
 * Get report for a specific trip
 */
exports.getTripReport = async (req, res, next) => {
  try {
    const report = await reportService.getTripReport(req.params.id, req.user.id);
    if (!report) {
      return error(res, 'Trip not found or access denied', null, 404);
    }
    return success(res, 'Trip report generated successfully', report);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all trips for the authenticated user
 */
exports.getTrips = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const trips = await tripService.getTripsByUser(userId);
    return success(res, 'Trips retrieved successfully', trips);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single trip
 */
exports.getTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const trip = await tripService.getTripById(id, userId);
    return success(res, 'Trip retrieved successfully', trip);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new trip
 */
exports.createTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const trip = await tripService.createTrip(userId, req.body);
    return success(res, 'Trip created successfully', trip, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing trip
 */
exports.updateTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const trip = await tripService.updateTrip(id, userId, req.body);
    return success(res, 'Trip updated successfully', trip);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a trip
 */
exports.deleteTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await tripService.deleteTrip(id, userId);
    return success(res, 'Trip deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
