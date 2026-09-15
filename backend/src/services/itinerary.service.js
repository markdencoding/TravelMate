const pool = require('../config/database');
const AppError = require('../utils/AppError');

class ItineraryService {

  // ==========================================
  // HELPER: Verify Day exists and belongs to User's Trip
  // ==========================================
  async _verifyDayOwnership(dayId, tripId, userId) {
    const query = `
      SELECT d.id 
      FROM itinerary_days d
      JOIN trips t ON d.trip_id = t.id
      WHERE d.id = $1 AND d.trip_id = $2 AND t.user_id = $3
    `;
    const result = await pool.query(query, [dayId, tripId, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Itinerary day not found or unauthorized', 404);
    }
  }

  // ==========================================
  // ITINERARY DAYS
  // ==========================================
  
  async getItineraryByTrip(tripId, userId) {
    // Return all days ordered by day_number, and nest their activities.
    // Ensure we only query if the trip belongs to the user.
    const tripCheckQuery = `SELECT id FROM trips WHERE id = $1 AND user_id = $2`;
    const tripCheck = await pool.query(tripCheckQuery, [tripId, userId]);
    if (tripCheck.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }

    const daysQuery = `
      SELECT * FROM itinerary_days 
      WHERE trip_id = $1 
      ORDER BY day_number ASC
    `;
    const daysResult = await pool.query(daysQuery, [tripId]);
    const days = daysResult.rows;

    if (days.length === 0) return [];

    const dayIds = days.map(d => d.id);
    
    // Using unnest string array logic to safely query IN clause
    const activitiesQuery = `
      SELECT * FROM activities 
      WHERE itinerary_day_id = ANY($1::uuid[])
      ORDER BY itinerary_day_id, sort_order ASC, start_time ASC
    `;
    const activitiesResult = await pool.query(activitiesQuery, [dayIds]);
    const activities = activitiesResult.rows;

    // Nest activities under days
    days.forEach(day => {
      day.activities = activities.filter(a => a.itinerary_day_id === day.id);
    });

    return days;
  }

  async createItineraryDay(tripId, userId, data) {
    const tripCheckQuery = `SELECT id FROM trips WHERE id = $1 AND user_id = $2`;
    const tripCheck = await pool.query(tripCheckQuery, [tripId, userId]);
    if (tripCheck.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }

    const { date, day_number } = data;
    
    // Check for duplicate day_number in this trip
    const dupCheck = await pool.query(`SELECT id FROM itinerary_days WHERE trip_id = $1 AND day_number = $2`, [tripId, day_number]);
    if (dupCheck.rows.length > 0) {
      throw new AppError('Day number already exists in this trip', 400);
    }

    const query = `
      INSERT INTO itinerary_days (trip_id, date, day_number)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [tripId, date || null, day_number]);
    return { ...result.rows[0], activities: [] };
  }

  async updateItineraryDay(tripId, dayId, userId, data) {
    await this._verifyDayOwnership(dayId, tripId, userId);
    const { date, day_number } = data;

    // Check duplicate day_number if changing it
    if (day_number) {
       const dupCheck = await pool.query(`SELECT id FROM itinerary_days WHERE trip_id = $1 AND day_number = $2 AND id != $3`, [tripId, day_number, dayId]);
       if (dupCheck.rows.length > 0) {
         throw new AppError('Day number already exists in this trip', 400);
       }
    }

    const query = `
      UPDATE itinerary_days 
      SET 
        date = COALESCE($1, date),
        day_number = COALESCE($2, day_number),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [date || null, day_number || null, dayId]);
    return result.rows[0];
  }

  async deleteItineraryDay(tripId, dayId, userId) {
    await this._verifyDayOwnership(dayId, tripId, userId);
    const query = `DELETE FROM itinerary_days WHERE id = $1 RETURNING id`;
    await pool.query(query, [dayId]);
    return true;
  }

  // ==========================================
  // ACTIVITIES
  // ==========================================

  async _verifyDestinationTrip(destinationId, tripId) {
    const query = `SELECT id FROM destinations WHERE id = $1 AND trip_id = $2`;
    const result = await pool.query(query, [destinationId, tripId]);
    if (result.rows.length === 0) {
      throw new AppError('Invalid destination or destination belongs to another trip', 400);
    }
  }

  async createActivity(tripId, dayId, userId, data) {
    await this._verifyDayOwnership(dayId, tripId, userId);
    
    const { name, description, start_time, end_time, location, estimated_cost, sort_order, destination_id } = data;

    // Check if destination_id exists and belongs to the SAME trip
    if (destination_id) {
      await this._verifyDestinationTrip(destination_id, tripId);
    }

    const query = `
      INSERT INTO activities (
        itinerary_day_id, name, description, start_time, end_time, location, estimated_cost, sort_order, destination_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      dayId,
      name,
      description || null,
      start_time || null,
      end_time || null,
      location || null,
      estimated_cost || null,
      sort_order || 0,
      destination_id || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateActivity(tripId, dayId, activityId, userId, data) {
    // Verify activity exists and belongs to user's trip
    const authQuery = `
      SELECT a.id 
      FROM activities a
      JOIN itinerary_days d ON a.itinerary_day_id = d.id
      JOIN trips t ON d.trip_id = t.id
      WHERE a.id = $1 AND d.id = $2 AND t.id = $3 AND t.user_id = $4
    `;
    const authResult = await pool.query(authQuery, [activityId, dayId, tripId, userId]);
    if (authResult.rows.length === 0) {
      throw new AppError('Activity not found or unauthorized', 404);
    }

    const { name, description, start_time, end_time, location, estimated_cost, sort_order, destination_id } = data;

    if (destination_id) {
      await this._verifyDestinationTrip(destination_id, tripId);
    }

    const query = `
      UPDATE activities 
      SET 
        name = COALESCE($1, name),
        description = $2,
        start_time = $3,
        end_time = $4,
        location = $5,
        estimated_cost = $6,
        sort_order = COALESCE($7, sort_order),
        destination_id = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    const values = [
      name || null,
      description !== undefined ? description : null,
      start_time !== undefined ? start_time : null,
      end_time !== undefined ? end_time : null,
      location !== undefined ? location : null,
      estimated_cost !== undefined ? estimated_cost : null,
      sort_order !== undefined ? sort_order : null,
      destination_id !== undefined ? destination_id : null,
      activityId
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteActivity(tripId, dayId, activityId, userId) {
    const authQuery = `
      SELECT a.id 
      FROM activities a
      JOIN itinerary_days d ON a.itinerary_day_id = d.id
      JOIN trips t ON d.trip_id = t.id
      WHERE a.id = $1 AND d.id = $2 AND t.id = $3 AND t.user_id = $4
    `;
    const authResult = await pool.query(authQuery, [activityId, dayId, tripId, userId]);
    if (authResult.rows.length === 0) {
      throw new AppError('Activity not found or unauthorized', 404);
    }

    const query = `DELETE FROM activities WHERE id = $1 RETURNING id`;
    await pool.query(query, [activityId]);
    return true;
  }
}

module.exports = new ItineraryService();
