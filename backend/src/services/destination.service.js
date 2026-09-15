const pool = require('../config/database');
const AppError = require('../utils/AppError');

class DestinationService {
  /**
   * Get all destinations for a specific trip, verifying trip ownership
   */
  async getDestinationsByTrip(tripId, userId) {
    // Implicit ownership check via JOIN
    const query = `
      SELECT d.* 
      FROM destinations d
      JOIN trips t ON d.trip_id = t.id
      WHERE d.trip_id = $1 AND t.user_id = $2
      ORDER BY d.created_at ASC
    `;
    const result = await pool.query(query, [tripId, userId]);
    return result.rows;
  }

  /**
   * Get a specific destination, verifying trip ownership
   */
  async getDestinationById(destinationId, userId) {
    const query = `
      SELECT d.* 
      FROM destinations d
      JOIN trips t ON d.trip_id = t.id
      WHERE d.id = $1 AND t.user_id = $2
    `;
    const result = await pool.query(query, [destinationId, userId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Destination not found or unauthorized', 404);
    }
    
    return result.rows[0];
  }

  /**
   * Verify trip exists and belongs to user
   */
  async _verifyTripOwnership(tripId, userId) {
    const query = `SELECT id FROM trips WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(query, [tripId, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }
  }

  /**
   * Add a new destination to a trip
   */
  async createDestination(tripId, userId, data) {
    // Enforce ownership
    await this._verifyTripOwnership(tripId, userId);

    const { name, address, latitude, longitude, description } = data;
    
    const query = `
      INSERT INTO destinations (
        trip_id, name, address, latitude, longitude, description
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      tripId, 
      name, 
      address || null, 
      latitude !== undefined ? latitude : null, 
      longitude !== undefined ? longitude : null, 
      description || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update an existing destination
   */
  async updateDestination(tripId, destinationId, userId, data) {
    // First ensure it exists and belongs to the user's trip
    await this.getDestinationById(destinationId, userId);

    const { name, address, latitude, longitude, description } = data;
    
    const query = `
      UPDATE destinations 
      SET 
        name = COALESCE($1, name),
        address = $2,
        latitude = $3,
        longitude = $4,
        description = $5,
        updated_at = NOW()
      WHERE id = $6 AND trip_id = $7
      RETURNING *
    `;
    
    const values = [
      name,
      address !== undefined ? address : null,
      latitude !== undefined ? latitude : null,
      longitude !== undefined ? longitude : null,
      description !== undefined ? description : null,
      destinationId,
      tripId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete a destination
   */
  async deleteDestination(tripId, destinationId, userId) {
    // First ensure it exists and belongs to the user's trip
    await this.getDestinationById(destinationId, userId);

    const query = `
      DELETE FROM destinations 
      WHERE id = $1 AND trip_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [destinationId, tripId]);
    return true;
  }
}

module.exports = new DestinationService();
