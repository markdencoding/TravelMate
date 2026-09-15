const itineraryService = require('../services/itinerary.service');
const { success } = require('../utils/responseHelper');

// --- Itinerary Days ---

exports.getItinerary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const days = await itineraryService.getItineraryByTrip(tripId, userId);
    return success(res, 'Itinerary retrieved successfully', days);
  } catch (error) {
    next(error);
  }
};

exports.createDay = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const day = await itineraryService.createItineraryDay(tripId, userId, req.body);
    return success(res, 'Itinerary day created successfully', day, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateDay = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, dayId } = req.params;
    const day = await itineraryService.updateItineraryDay(tripId, dayId, userId, req.body);
    return success(res, 'Itinerary day updated successfully', day);
  } catch (error) {
    next(error);
  }
};

exports.deleteDay = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, dayId } = req.params;
    await itineraryService.deleteItineraryDay(tripId, dayId, userId);
    return success(res, 'Itinerary day deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

// --- Activities ---

exports.createActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, dayId } = req.params;
    const activity = await itineraryService.createActivity(tripId, dayId, userId, req.body);
    return success(res, 'Activity created successfully', activity, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, dayId, activityId } = req.params;
    const activity = await itineraryService.updateActivity(tripId, dayId, activityId, userId, req.body);
    return success(res, 'Activity updated successfully', activity);
  } catch (error) {
    next(error);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, dayId, activityId } = req.params;
    await itineraryService.deleteActivity(tripId, dayId, activityId, userId);
    return success(res, 'Activity deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
