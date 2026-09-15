const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const tripRoutes = require('./trip.routes');
const mapsRoutes = require('./maps.routes');

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/maps', mapsRoutes);

module.exports = router;
