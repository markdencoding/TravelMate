const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const tripRoutes = require('./trip.routes');
const mapsRoutes = require('./maps.routes');
const dashboardRoutes = require('./dashboard.routes');
const weatherRoutes = require('./weather.routes');
const notificationRoutes = require('./notification.routes');

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/maps', mapsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/weather', weatherRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
