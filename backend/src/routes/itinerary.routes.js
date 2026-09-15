const express = require('express');
const router = express.Router({ mergeParams: true });
const itineraryController = require('../controllers/itinerary.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const daySchema = {
  body: {
    day_number: { type: 'number', required: true },
    date: { type: 'string' } // Could enforce format YYYY-MM-DD in custom validator
  }
};

const activitySchema = {
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    description: { type: 'string' },
    start_time: { type: 'string' },
    end_time: { type: 'string' },
    location: { type: 'string', maxLength: 300 },
    estimated_cost: { type: 'number' },
    sort_order: { type: 'number' },
    destination_id: { type: 'string' }
  }
};

router.use(authenticate);

// /api/trips/:tripId/itinerary
router.route('/')
  .get(itineraryController.getItinerary);

// /api/trips/:tripId/itinerary/days
router.route('/days')
  .post(validate(daySchema), itineraryController.createDay);

router.route('/days/:dayId')
  .put(validate(daySchema), itineraryController.updateDay)
  .delete(itineraryController.deleteDay);

// /api/trips/:tripId/itinerary/days/:dayId/activities
router.route('/days/:dayId/activities')
  .post(validate(activitySchema), itineraryController.createActivity);

router.route('/days/:dayId/activities/:activityId')
  .put(validate(activitySchema), itineraryController.updateActivity)
  .delete(itineraryController.deleteActivity);

module.exports = router;
