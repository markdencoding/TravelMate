import api from './api';

const currencyService = {
  /**
   * Get exchange rate between two currencies
   */
  async getRate(from = 'PHP', to = 'USD') {
    const response = await api.get('/currency/rate', {
      params: { from, to }
    });
    return response.data;
  },

  /**
   * Convert an amount from one currency to another
   */
  async convert(amount, from = 'PHP', to = 'USD') {
    const response = await api.get('/currency/convert', {
      params: { amount, from, to }
    });
    return response.data;
  },

  /**
   * Get list of supported currencies with code, name, and symbol
   */
  async getSupportedCurrencies() {
    const response = await api.get('/currency/currencies');
    return response.data;
  },

  /**
   * Format a numerical amount with currency symbol or code
   */
  formatAmount(amount, currencyCode = 'PHP') {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '0.00';
    }
    const num = Number(amount);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
};

export default currencyService;
