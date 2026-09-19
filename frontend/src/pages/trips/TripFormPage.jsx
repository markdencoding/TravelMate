import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import tripService from '../../services/tripService';
import currencyService from '../../services/currencyService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './Trips.css';

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
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' }
];

export default function TripFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    primary_destination: '',
    estimated_budget: '',
    base_currency: 'PHP'
  });
  const [destCurrency, setDestCurrency] = useState('JPY');
  const [rateInfo, setRateInfo] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchTrip();
    }
  }, [id]);

  const fetchTrip = async () => {
    try {
      const result = await tripService.getTrip(id);
      if (result.success) {
        const trip = result.data;
        // Format dates for input[type="date"]
        const formatDateForInput = (dateStr) => dateStr ? dateStr.split('T')[0] : '';
        
        setFormData({
          name: trip.name || '',
          description: trip.description || '',
          start_date: formatDateForInput(trip.start_date),
          end_date: formatDateForInput(trip.end_date),
          primary_destination: trip.primary_destination || '',
          estimated_budget: trip.estimated_budget || '',
          base_currency: trip.base_currency || 'PHP'
        });

        if (trip.destinations && trip.destinations.length > 0 && trip.destinations[0].currency) {
          setDestCurrency(trip.destinations[0].currency);
        }
      } else {
        setError(result.message || 'Failed to load trip details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const updateRate = useCallback(async () => {
    if (!formData.base_currency || !destCurrency || formData.base_currency === destCurrency) {
      setRateInfo({ rate: 1, updated_at: new Date().toISOString() });
      return;
    }
    setLoadingRate(true);
    try {
      const res = await currencyService.getRate(formData.base_currency, destCurrency);
      if (res.success && res.data) {
        setRateInfo(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch exchange rate:', err);
      setRateInfo(null);
    } finally {
      setLoadingRate(false);
    }
  }, [formData.base_currency, destCurrency]);

  useEffect(() => {
    updateRate();
  }, [updateRate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setError('End date cannot be before start date.');
      return;
    }
    if (formData.estimated_budget && Number(formData.estimated_budget) < 0) {
      setError('Estimated budget cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        base_currency: formData.base_currency || 'PHP',
        estimated_budget: formData.estimated_budget ? Number(formData.estimated_budget) : null
      };

      let result;
      if (isEditing) {
        result = await tripService.updateTrip(id, payload);
      } else {
        result = await tripService.createTrip(payload);
      }

      if (result.success) {
        navigate(isEditing ? `/trips/${id}` : '/trips');
      } else {
        setError(result.message || 'Failed to save trip');
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving.');
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading trip details..." />;

  return (
    <div className="trip-form-page">
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Trip' : 'Create New Trip'}</h1>
      </div>

      <div className="card">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
        
        <form onSubmit={handleSubmit} className="trip-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Trip Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="e.g., Summer in Paris"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primary_destination" className="form-label">Primary Destination</label>
            <input
              type="text"
              id="primary_destination"
              name="primary_destination"
              className="form-input"
              value={formData.primary_destination}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g., Paris, France"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="form-input"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date} // Basic HTML validation
              />
            </div>
          </div>

          {/* Budget & Currency Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estimated_budget" className="form-label font-semibold">
                Trip Budget
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="estimated_budget"
                  name="estimated_budget"
                  className="form-input flex-1"
                  value={formData.estimated_budget}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="50000.00"
                />
                <select
                  name="base_currency"
                  className="form-input w-36 font-semibold"
                  value={formData.base_currency}
                  onChange={handleChange}
                  aria-label="Trip Base Currency"
                >
                  {POPULAR_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="dest_currency" className="form-label font-semibold">
                Destination Currency
              </label>
              <select
                id="dest_currency"
                className="form-input font-semibold"
                value={destCurrency}
                onChange={(e) => setDestCurrency(e.target.value)}
                aria-label="Destination Currency"
              >
                {POPULAR_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Converted Destination Budget Preview */}
          {formData.estimated_budget && Number(formData.estimated_budget) > 0 && formData.base_currency !== destCurrency && (
            <div className="card p-4 bg-primary-light border-primary mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Estimated Destination Budget
                  </span>
                  <div className="text-2xl font-black text-primary mt-1">
                    {loadingRate ? (
                      <span className="text-sm text-muted">Calculating live conversion...</span>
                    ) : rateInfo?.rate ? (
                      currencyService.formatAmount(Number(formData.estimated_budget) * rateInfo.rate, destCurrency)
                    ) : (
                      <span className="text-xs text-error">Exchange rate unavailable</span>
                    )}
                  </div>
                </div>
                {rateInfo?.rate && (
                  <div className="text-right">
                    <span className="badge bg-surface text-main text-xs border border-border">
                      1 {formData.base_currency} = {Number(rateInfo.rate).toFixed(4)} {destCurrency}
                    </span>
                    <div className="text-[10px] text-muted mt-1">
                      Live provider rate
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="What are your plans for this trip?"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEditing ? `/trips/${id}` : '/trips')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
