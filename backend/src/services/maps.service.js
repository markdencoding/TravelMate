const COUNTRY_TO_CURRENCY = {
  ph: 'PHP',
  jp: 'JPY',
  us: 'USD',
  gb: 'GBP',
  uk: 'GBP',
  fr: 'EUR', de: 'EUR', it: 'EUR', es: 'EUR', nl: 'EUR', gr: 'EUR', pt: 'EUR', at: 'EUR', ie: 'EUR', be: 'EUR', fi: 'EUR',
  sg: 'SGD',
  au: 'AUD',
  ca: 'CAD',
  kr: 'KRW',
  th: 'THB',
  my: 'MYR',
  id: 'IDR',
  vn: 'VND',
  cn: 'CNY',
  ch: 'CHF',
  ae: 'AED',
  hk: 'HKD',
  tw: 'TWD',
  nz: 'NZD'
};

function detectCurrency(code) {
  if (!code) return 'PHP';
  const clean = code.toLowerCase().trim();
  return COUNTRY_TO_CURRENCY[clean] || 'USD';
}

class MapsService {
  /**
   * Search for places using Mapbox Geocoding API or OpenStreetMap Nominatim fallback
   */
  async searchLocation(query) {
    // 1. Try Mapbox if API key is configured
    if (process.env.MAPS_API_KEY) {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.MAPS_API_KEY}&autocomplete=true&limit=5`;
        const response = await fetch(mapboxUrl, { signal: AbortSignal.timeout(5000) });
        
        if (response.ok) {
          const data = await response.json();
          return data.features.map(feature => {
            const countryContext = feature.context?.find(c => c.id?.startsWith('country'));
            const countryCode = countryContext?.short_code || '';
            return {
              name: feature.text,
              address: feature.place_name,
              longitude: feature.center[0],
              latitude: feature.center[1],
              country_code: countryCode.toUpperCase(),
              currency: detectCurrency(countryCode),
              id: feature.id
            };
          });
        }
        console.warn(`Mapbox API returned ${response.status}, falling back to Nominatim`);
      } catch (err) {
        console.warn('Mapbox search failed, falling back to Nominatim:', err.message);
      }
    }

    // 2. OpenStreetMap Nominatim: open-standard geocoding fallback (English preferred)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=en`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'TravelMate/1.0 (travel-planner-app)'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map(item => {
        const countryCode = item.address?.country_code || '';
        const city = item.address?.city || item.address?.town || item.address?.municipality || item.address?.village || item.address?.state || '';
        const country = item.address?.country || '';
        return {
          name: item.name || (item.display_name ? item.display_name.split(',')[0].trim() : 'Unknown Place'),
          address: item.display_name,
          city: city,
          country: country,
          longitude: parseFloat(item.lon),
          latitude: parseFloat(item.lat),
          country_code: countryCode.toUpperCase(),
          currency: detectCurrency(countryCode),
          id: String(item.place_id)
        };
      });
    } catch (error) {
      console.error('Maps Search API Error:', error.message);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to a location name and address
   */
  async reverseGeocode(lat, lon) {
    // 1. Try Mapbox reverse geocode if key is present
    if (process.env.MAPS_API_KEY) {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${process.env.MAPS_API_KEY}&limit=1`;
        const response = await fetch(mapboxUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const first = data.features[0];
            const countryContext = first.context?.find(c => c.id?.startsWith('country'));
            const countryCode = countryContext?.short_code || '';
            return {
              name: first.text || first.place_name.split(',')[0].trim(),
              address: first.place_name,
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              country_code: countryCode.toUpperCase(),
              currency: detectCurrency(countryCode)
            };
          }
        }
      } catch (err) {
        console.warn('Mapbox reverse geocode failed, falling back to Nominatim:', err.message);
      }
    }

    // 2. OpenStreetMap Nominatim reverse geocode fallback (English preferred)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'TravelMate/1.0 (travel-planner-app)'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse API error: ${response.statusText}`);
      }

      const data = await response.json();
      const placeName = data.name || (data.display_name ? data.display_name.split(',')[0].trim() : `Location (${lat}, ${lon})`);
      const countryCode = data.address?.country_code || '';
      const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village || data.address?.state || '';
      const country = data.address?.country || '';
      return {
        name: placeName,
        address: data.display_name || `${lat}, ${lon}`,
        city: city,
        country: country,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        country_code: countryCode.toUpperCase(),
        currency: detectCurrency(countryCode)
      };
    } catch (error) {
      console.error('Reverse Geocode API Error:', error.message);
      return {
        name: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        address: `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        city: '',
        country: '',
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        country_code: '',
        currency: 'PHP'
      };
    }
  }
}

module.exports = new MapsService();
