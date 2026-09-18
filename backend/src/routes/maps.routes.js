const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/maps.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/search', mapsController.search);
router.get('/reverse', mapsController.reverse);

module.exports = router;
