const CURRENCY_METADATA = {
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  TWD: { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' }
};

// In-memory cache for live exchange rates (TTL: 1 hour)
const rateCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

class CurrencyService {
  /**
   * Get supported currencies list
   */
  getSupportedCurrencies() {
    return Object.values(CURRENCY_METADATA);
  }

  /**
   * Fetch all rates for a base currency with in-memory caching
   */
  async getRatesForBase(base) {
    const baseCode = (base || 'PHP').toUpperCase().trim();
    if (!/^[A-Z]{3}$/.test(baseCode)) {
      throw new Error(`Invalid currency code: ${baseCode}`);
    }

    const now = Date.now();
    const cached = rateCache.get(baseCode);

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCode)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });

      if (!res.ok) {
        throw new Error(`Exchange rate provider responded with status ${res.status}`);
      }

      const json = await res.json();
      if (json.result === 'error' && json['error-type'] === 'unsupported-code') {
        throw new Error(`Unsupported or invalid currency code: ${baseCode}`);
      }
      if (json.result !== 'success' || !json.rates) {
        throw new Error('Exchange rate data unavailable');
      }

      const cacheEntry = {
        base: baseCode,
        rates: json.rates,
        updated_at: json.time_last_update_utc || new Date().toISOString(),
        timestamp: now
      };

      rateCache.set(baseCode, { data: cacheEntry, timestamp: now });
      return cacheEntry;
    } catch (err) {
      console.error('Exchange rate fetch failed:', err.message);
      // If we have an expired cache entry, use it as fallback
      if (cached) {
        console.warn('Using stale cached exchange rates due to fetch failure');
        return cached.data;
      }
      throw err;
    }
  }

  /**
   * Get specific exchange rate from -> to
   */
  async getExchangeRate(from, to) {
    const fromCode = (from || 'PHP').toUpperCase().trim();
    const toCode = (to || 'PHP').toUpperCase().trim();

    if (fromCode === toCode) {
      return {
        from: fromCode,
        to: toCode,
        rate: 1.0,
        updated_at: new Date().toISOString()
      };
    }

    const ratesData = await this.getRatesForBase(fromCode);
    const rate = ratesData.rates[toCode];

    if (!rate || typeof rate !== 'number') {
      throw new Error(`Unsupported or unavailable target currency: ${toCode}`);
    }

    return {
      from: fromCode,
      to: toCode,
      rate: parseFloat(rate.toFixed(6)),
      updated_at: ratesData.updated_at
    };
  }

  /**
   * Convert an amount from one currency to another
   */
  async convert(amount, from, to) {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      throw new Error('Invalid amount for conversion');
    }

    const rateInfo = await this.getExchangeRate(from, to);
    const convertedAmount = parseFloat((numericAmount * rateInfo.rate).toFixed(2));

    return {
      amount: numericAmount,
      from: rateInfo.from,
      to: rateInfo.to,
      rate: rateInfo.rate,
      converted_amount: convertedAmount,
      updated_at: rateInfo.updated_at
    };
  }
}

module.exports = new CurrencyService();
