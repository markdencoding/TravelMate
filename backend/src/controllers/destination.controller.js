const destinationService = require('../services/destination.service');
const { success } = require('../utils/responseHelper');

exports.getDestinations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const destinations = await destinationService.getDestinationsByTrip(tripId, userId);
    return success(res, 'Destinations retrieved successfully', destinations);
  } catch (error) {
    next(error);
  }
};

exports.getDestination = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const destination = await destinationService.getDestinationById(id, userId);
    return success(res, 'Destination retrieved successfully', destination);
  } catch (error) {
    next(error);
  }
};

exports.createDestination = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const destination = await destinationService.createDestination(tripId, userId, req.body);
    return success(res, 'Destination created successfully', destination, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateDestination = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, id } = req.params;
    const destination = await destinationService.updateDestination(tripId, id, userId, req.body);
    return success(res, 'Destination updated successfully', destination);
  } catch (error) {
    next(error);
  }
};

exports.deleteDestination = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, id } = req.params;
    await destinationService.deleteDestination(tripId, id, userId);
    return success(res, 'Destination deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
