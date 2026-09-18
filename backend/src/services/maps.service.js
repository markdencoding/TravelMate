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
          return data.features.map(feature => ({
            name: feature.text,
            address: feature.place_name,
            longitude: feature.center[0],
            latitude: feature.center[1],
            id: feature.id
          }));
        }
        console.warn(`Mapbox API returned ${response.status}, falling back to Nominatim`);
      } catch (err) {
        console.warn('Mapbox search failed, falling back to Nominatim:', err.message);
      }
    }

    // 2. OpenStreetMap Nominatim: open-standard geocoding fallback
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
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
      return data.map(item => ({
        name: item.name || (item.display_name ? item.display_name.split(',')[0].trim() : 'Unknown Place'),
        address: item.display_name,
        longitude: parseFloat(item.lon),
        latitude: parseFloat(item.lat),
        id: String(item.place_id)
      }));
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
            return {
              name: first.text || first.place_name.split(',')[0].trim(),
              address: first.place_name,
              latitude: parseFloat(lat),
              longitude: parseFloat(lon)
            };
          }
        }
      } catch (err) {
        console.warn('Mapbox reverse geocode failed, falling back to Nominatim:', err.message);
      }
    }

    // 2. OpenStreetMap Nominatim reverse geocode fallback
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
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
      return {
        name: placeName,
        address: data.display_name || `${lat}, ${lon}`,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };
    } catch (error) {
      console.error('Reverse Geocode API Error:', error.message);
      // Even if reverse lookup times out, return the coordinates safely
      return {
        name: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        address: `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      };
    }
  }
}

module.exports = new MapsService();
