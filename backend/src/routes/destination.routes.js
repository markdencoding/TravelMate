const express = require('express');
// Need mergeParams: true because route is mounted at /api/trips/:tripId/destinations
const router = express.Router({ mergeParams: true });
const destinationController = require('../controllers/destination.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const destinationSchema = {
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    address: { type: 'string', maxLength: 500 },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    description: { type: 'string' }
  }
};

router.use(authenticate);

router.route('/')
  .get(destinationController.getDestinations)
  .post(validate(destinationSchema), destinationController.createDestination);

router.route('/:id')
  .get(destinationController.getDestination)
  .put(validate(destinationSchema), destinationController.updateDestination)
  .delete(destinationController.deleteDestination);

module.exports = router;
