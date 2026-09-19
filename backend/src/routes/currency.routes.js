const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currency.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/rate', currencyController.getRate);
router.get('/convert', currencyController.convert);
router.get('/currencies', currencyController.getCurrencies);

module.exports = router;
