const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Simple validation schemas mapping to our request body format
// Using a basic structure matching the existing validate middleware style
const createTripSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    description: { type: 'string' },
    start_date: { type: 'string' }, // We could do more complex validation here if validate middleware supports it
    end_date: { type: 'string' },
    primary_destination: { type: 'string', maxLength: 200 },
    estimated_budget: { type: 'number' }
  }
};

const updateTripSchema = {
  body: {
    name: { type: 'string', maxLength: 200 },
    description: { type: 'string' },
    start_date: { type: 'string' },
    end_date: { type: 'string' },
    primary_destination: { type: 'string', maxLength: 200 },
    estimated_budget: { type: 'number' }
  }
};

const destinationRoutes = require('./destination.routes');
const itineraryRoutes = require('./itinerary.routes');
const expenseRoutes = require('./expense.routes');

// All trip routes require authentication
router.use(authenticate);

// Mount nested destination routes
router.use('/:tripId/destinations', destinationRoutes);

// Mount nested itinerary routes
router.use('/:tripId/itinerary', itineraryRoutes);

// Mount nested expense routes
router.use('/:tripId/expenses', expenseRoutes);

// Routes
router.route('/')
  .get(tripController.getTrips)
  .post(validate(createTripSchema), tripController.createTrip);

router.route('/:id')
  .get(tripController.getTrip)
  .put(validate(updateTripSchema), tripController.updateTrip)
  .delete(tripController.deleteTrip);

module.exports = router;
