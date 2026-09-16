const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', weatherController.getCurrentWeather);

module.exports = router;
