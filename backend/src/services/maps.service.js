class MapsService {
  /**
   * Search for places using Mapbox Geocoding API
   * We use the global fetch API available in Node 18+
   */
  async searchLocation(query) {
    if (!process.env.MAPS_API_KEY) {
      // Gracefully handle missing API key - mock response for dev or throw
      // The frontend will handle this gracefully.
      throw new Error('MAPS_API_KEY_MISSING');
    }

    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.MAPS_API_KEY}&autocomplete=true&limit=5`;
    
    try {
      const response = await fetch(mapboxUrl);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Normalize results to our standard format
      return data.features.map(feature => ({
        name: feature.text,
        address: feature.place_name,
        longitude: feature.center[0],
        latitude: feature.center[1],
        id: feature.id
      }));
    } catch (error) {
      console.error('Maps API Error:', error);
      throw error;
    }
  }
}

module.exports = new MapsService();
