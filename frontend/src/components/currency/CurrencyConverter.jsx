import { useState, useEffect, useCallback } from 'react';
import currencyService from '../../services/currencyService';
import './CurrencyConverter.css';

const POPULAR_CURRENCIES = [
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' }
];

export default function CurrencyConverter({
  initialAmount = 1000,
  initialFrom = 'PHP',
  initialTo = 'JPY',
  title = 'Currency Converter',
  compact = false
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [fromCurrency, setFromCurrency] = useState(initialFrom);
  const [toCurrency, setToCurrency] = useState(initialTo);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [rate, setRate] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync props when changed externally
  useEffect(() => {
    if (initialFrom) setFromCurrency(initialFrom);
  }, [initialFrom]);

  useEffect(() => {
    if (initialTo) setToCurrency(initialTo);
  }, [initialTo]);

  useEffect(() => {
    if (initialAmount !== undefined && initialAmount !== null) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  const fetchConversion = useCallback(async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      setConvertedAmount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await currencyService.convert(amount, fromCurrency, toCurrency);
      if (res.success && res.data) {
        setConvertedAmount(res.data.converted_amount);
        setRate(res.data.rate);
        setUpdatedAt(res.data.updated_at);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Exchange rate unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [amount, fromCurrency, toCurrency]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversion();
    }, 250); // Small debounce for smooth typing

    return () => clearTimeout(timer);
  }, [fetchConversion]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`currency-converter card ${compact ? 'currency-converter--compact' : ''}`}>
      {title && (
        <div className="currency-converter__header flex justify-between items-center mb-3">
          <h4 className="font-bold text-sm flex items-center gap-1.5">
            <span>💱</span> {title}
          </h4>
          {rate && !loading && (
            <span className="text-[11px] text-muted">
              1 {fromCurrency} = {Number(rate).toFixed(4)} {toCurrency}
            </span>
          )}
        </div>
      )}

      {/* Input Row */}
      <div className="currency-converter__form flex flex-col gap-3">
        {/* Amount Input */}
        <div>
          <label className="form-label text-xs mb-1 block">Amount</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-input text-base font-semibold w-full"
            placeholder="Enter amount..."
          />
        </div>

        {/* Currency Selectors & Swap Button */}
        <div className="currency-converter__selectors grid grid-cols-[1fr,auto,1fr] items-end gap-2">
          <div>
            <label className="form-label text-xs mb-1 block">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="form-input text-xs font-semibold w-full"
              aria-label="From Currency"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="currency-swap-btn"
            onClick={handleSwap}
            title="Swap currencies"
            aria-label="Swap currencies"
          >
            ⇄
          </button>

          <div>
            <label className="form-label text-xs mb-1 block">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="form-input text-xs font-semibold w-full"
              aria-label="To Currency"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Output Display Card */}
        <div className="currency-converter__result mt-1 p-3 rounded-lg bg-surface-secondary border border-border text-center">
          {loading ? (
            <div className="text-xs text-muted py-2 flex items-center justify-center gap-1.5">
              <span className="inline-block animate-spin">🔄</span> Loading exchange rate...
            </div>
          ) : error ? (
            <div className="text-xs text-error py-1" role="alert">
              {error}
            </div>
          ) : (
            <div>
              <div className="text-xs text-muted mb-0.5">
                {currencyService.formatAmount(amount, fromCurrency)} =
              </div>
              <div className="text-xl font-black text-primary">
                {currencyService.formatAmount(convertedAmount, toCurrency)}
              </div>
              {updatedAt && (
                <div className="text-[10px] text-muted opacity-75 mt-1">
                  Exchange rate updated: {formatDateTime(updatedAt)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
