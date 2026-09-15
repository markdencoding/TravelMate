const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const tripRoutes = require('./trip.routes');

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);

module.exports = router;
