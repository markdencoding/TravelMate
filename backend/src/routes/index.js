const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

module.exports = router;
