const pool = require('../config/database');
const AppError = require('../utils/AppError');

function parseDateOnly(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(dateVal).split('T')[0];
}

function getTripDurationDays(startDateVal, endDateVal) {
  if (!startDateVal || !endDateVal) return null;
  const sStr = parseDateOnly(startDateVal);
  const eStr = parseDateOnly(endDateVal);
  const sParts = sStr.split('-').map(Number);
  const eParts = eStr.split('-').map(Number);
  if (sParts.length < 3 || eParts.length < 3) return null;
  const sUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
  const eUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
  const diffDays = Math.round((eUtc - sUtc) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays + 1 : 1;
}

function calculateDerivedDate(startDateVal, dayNumber) {
  if (!startDateVal || !dayNumber) return null;
  const sStr = parseDateOnly(startDateVal);
  const sParts = sStr.split('-').map(Number);
  if (sParts.length < 3) return null;
  const d = new Date(Date.UTC(sParts[0], sParts[1] - 1, sParts[2] + (dayNumber - 1)));
  return d.toISOString().split('T')[0];
}

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
    const tripCheckQuery = `SELECT id, start_date, end_date FROM trips WHERE id = $1 AND user_id = $2`;
    const tripCheck = await pool.query(tripCheckQuery, [tripId, userId]);
    if (tripCheck.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }
    const trip = tripCheck.rows[0];

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

    // Nest activities under days and normalize / derive date
    days.forEach(day => {
      const derived = trip.start_date ? calculateDerivedDate(trip.start_date, day.day_number) : null;
      day.date = parseDateOnly(day.date) || derived;
      day.derived_date = derived;
      day.activities = activities.filter(a => a.itinerary_day_id === day.id);
    });

    return days;
  }

  async createItineraryDay(tripId, userId, data) {
    const tripCheckQuery = `SELECT id, start_date, end_date FROM trips WHERE id = $1 AND user_id = $2`;
    const tripCheck = await pool.query(tripCheckQuery, [tripId, userId]);
    if (tripCheck.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }
    const trip = tripCheck.rows[0];

    const { date, day_number } = data;
    const num = parseInt(day_number, 10);
    
    if (isNaN(num) || num < 1) {
      throw new AppError('Day number must be at least 1', 400);
    }

    // Boundary validation against trip duration
    if (trip.start_date && trip.end_date) {
      const maxDays = getTripDurationDays(trip.start_date, trip.end_date);
      if (maxDays !== null && num > maxDays) {
        throw new AppError(
          `Day ${num} exceeds the trip duration (${maxDays} day${maxDays === 1 ? '' : 's'}). Trip dates are ${parseDateOnly(trip.start_date)} to ${parseDateOnly(trip.end_date)}.`,
          400
        );
      }
    }

    // Check for duplicate day_number in this trip
    const dupCheck = await pool.query(`SELECT id FROM itinerary_days WHERE trip_id = $1 AND day_number = $2`, [tripId, num]);
    if (dupCheck.rows.length > 0) {
      throw new AppError('Day number already exists in this trip', 400);
    }

    // Automatically derive date from trip.start_date + (day_number - 1)
    const derivedDate = trip.start_date ? calculateDerivedDate(trip.start_date, num) : null;
    const effectiveDate = derivedDate || (date ? parseDateOnly(date) : null);

    const query = `
      INSERT INTO itinerary_days (trip_id, date, day_number)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [tripId, effectiveDate, num]);
    const createdDay = result.rows[0];
    return {
      ...createdDay,
      date: parseDateOnly(createdDay.date) || derivedDate,
      derived_date: derivedDate,
      activities: []
    };
  }

  async updateItineraryDay(tripId, dayId, userId, data) {
    await this._verifyDayOwnership(dayId, tripId, userId);
    
    const tripCheckQuery = `SELECT id, start_date, end_date FROM trips WHERE id = $1 AND user_id = $2`;
    const tripCheck = await pool.query(tripCheckQuery, [tripId, userId]);
    const trip = tripCheck.rows[0];

    const { date, day_number } = data;
    let num = undefined;
    if (day_number !== undefined) {
      num = parseInt(day_number, 10);
      if (isNaN(num) || num < 1) {
        throw new AppError('Day number must be at least 1', 400);
      }

      if (trip && trip.start_date && trip.end_date) {
        const maxDays = getTripDurationDays(trip.start_date, trip.end_date);
        if (maxDays !== null && num > maxDays) {
          throw new AppError(
            `Day ${num} exceeds the trip duration (${maxDays} day${maxDays === 1 ? '' : 's'}). Trip dates are ${parseDateOnly(trip.start_date)} to ${parseDateOnly(trip.end_date)}.`,
            400
          );
        }
      }

      // Check duplicate day_number if changing it
      const dupCheck = await pool.query(`SELECT id FROM itinerary_days WHERE trip_id = $1 AND day_number = $2 AND id != $3`, [tripId, num, dayId]);
      if (dupCheck.rows.length > 0) {
        throw new AppError('Day number already exists in this trip', 400);
      }
    }

    // If day_number changed or start_date exists, update derived date
    let effectiveDate = date ? parseDateOnly(date) : undefined;
    if (trip && trip.start_date && num !== undefined) {
      effectiveDate = calculateDerivedDate(trip.start_date, num);
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
    const result = await pool.query(query, [effectiveDate || null, num !== undefined ? num : null, dayId]);
    const updated = result.rows[0];
    const derivedDate = trip?.start_date ? calculateDerivedDate(trip.start_date, updated.day_number) : null;
    return {
      ...updated,
      date: parseDateOnly(updated.date) || derivedDate,
      derived_date: derivedDate
    };
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
      SELECT a.id, a.itinerary_day_id
      FROM activities a
      JOIN itinerary_days d ON a.itinerary_day_id = d.id
      JOIN trips t ON d.trip_id = t.id
      WHERE a.id = $1 AND d.id = $2 AND t.id = $3 AND t.user_id = $4
    `;
    const authResult = await pool.query(authQuery, [activityId, dayId, tripId, userId]);
    if (authResult.rows.length === 0) {
      throw new AppError('Activity not found or unauthorized', 404);
    }

    const { name, description, start_time, end_time, location, estimated_cost, sort_order, destination_id, itinerary_day_id } = data;

    // Moving activity to another day within the same trip
    let targetDayId = dayId;
    if (itinerary_day_id && itinerary_day_id !== dayId) {
      const dayCheck = await pool.query(
        `SELECT id FROM itinerary_days WHERE id = $1 AND trip_id = $2`,
        [itinerary_day_id, tripId]
      );
      if (dayCheck.rows.length === 0) {
        throw new AppError('Target itinerary day not found in this trip', 400);
      }
      targetDayId = itinerary_day_id;
    }

    if (destination_id) {
      await this._verifyDestinationTrip(destination_id, tripId);
    }

    const query = `
      UPDATE activities 
      SET 
        itinerary_day_id = $1,
        name = COALESCE($2, name),
        description = $3,
        start_time = $4,
        end_time = $5,
        location = $6,
        estimated_cost = $7,
        sort_order = COALESCE($8, sort_order),
        destination_id = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    const values = [
      targetDayId,
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
