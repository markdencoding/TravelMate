const currencyService = require('../services/currency.service');
const { success, error } = require('../utils/responseHelper');

exports.getRate = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return error(res, 'Both "from" and "to" currency codes are required', null, 400);
    }

    const rateInfo = await currencyService.getExchangeRate(from, to);
    return success(res, 'Exchange rate retrieved successfully', rateInfo);
  } catch (err) {
    if (err.message.includes('Unsupported') || err.message.includes('Invalid currency code')) {
      return error(res, err.message, null, 400);
    }
    return error(res, 'Exchange rate service currently unavailable', err.message, 503);
  }
};

exports.convert = async (req, res, next) => {
  try {
    const { amount, from, to } = req.query;
    if (amount === undefined || !from || !to) {
      return error(res, '"amount", "from", and "to" are required parameters', null, 400);
    }

    const result = await currencyService.convert(amount, from, to);
    return success(res, 'Currency converted successfully', result);
  } catch (err) {
    if (err.message.includes('Invalid amount') || err.message.includes('Unsupported')) {
      return error(res, err.message, null, 400);
    }
    return error(res, 'Currency conversion service currently unavailable', err.message, 503);
  }
};

exports.getCurrencies = async (req, res, next) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    return success(res, 'Supported currencies retrieved', currencies);
  } catch (err) {
    next(err);
  }
};
