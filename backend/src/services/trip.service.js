const pool = require('../config/database');
const AppError = require('../utils/AppError');

class TripService {
  /**
   * Get all trips for a specific user, ordered by updated_at descending
   */
  async getTripsByUser(userId) {
    const query = `
      SELECT * FROM trips 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get a specific trip, ensuring it belongs to the user
   */
  async getTripById(tripId, userId) {
    const query = `
      SELECT * FROM trips 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [tripId, userId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }
    
    return result.rows[0];
  }

  /**
   * Create a new trip for a user
   */
  async createTrip(userId, data) {
    const { name, description, start_date, end_date, primary_destination, estimated_budget, base_currency } = data;
    
    const query = `
      INSERT INTO trips (
        user_id, name, description, start_date, end_date, primary_destination, estimated_budget, base_currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      userId, 
      name, 
      description || null, 
      start_date || null, 
      end_date || null, 
      primary_destination || null, 
      estimated_budget || null,
      base_currency || 'PHP'
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.constraint === 'chk_trip_dates') {
        throw new AppError('End date cannot be before start date', 400);
      }
      if (error.constraint === 'trips_estimated_budget_check') {
        throw new AppError('Estimated budget cannot be negative', 400);
      }
      throw error;
    }
  }

  /**
   * Update a trip, ensuring it belongs to the user
   */
  async updateTrip(tripId, userId, data) {
    // First ensure it exists and belongs to the user
    await this.getTripById(tripId, userId);

    const { name, description, start_date, end_date, primary_destination, estimated_budget, base_currency } = data;
    
    const query = `
      UPDATE trips 
      SET 
        name = COALESCE($1, name),
        description = $2,
        start_date = $3,
        end_date = $4,
        primary_destination = $5,
        estimated_budget = $6,
        base_currency = COALESCE($7, base_currency),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `;
    
    const values = [
      name,
      description !== undefined ? description : null,
      start_date !== undefined ? start_date : null,
      end_date !== undefined ? end_date : null,
      primary_destination !== undefined ? primary_destination : null,
      estimated_budget !== undefined ? estimated_budget : null,
      base_currency !== undefined ? base_currency : null,
      tripId,
      userId
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.constraint === 'chk_trip_dates') {
        throw new AppError('End date cannot be before start date', 400);
      }
      if (error.constraint === 'trips_estimated_budget_check') {
        throw new AppError('Estimated budget cannot be negative', 400);
      }
      throw error;
    }
  }

  /**
   * Delete a trip, ensuring it belongs to the user
   */
  async deleteTrip(tripId, userId) {
    const query = `
      DELETE FROM trips 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [tripId, userId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }
    
    return true;
  }
}

module.exports = new TripService();
