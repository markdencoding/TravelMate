const pool = require('../config/database');

class DashboardService {
  async getDashboardData(userId) {
    // 1. Total trips
    const totalTripsQuery = `SELECT COUNT(*) FROM trips WHERE user_id = $1`;
    const totalTripsResult = await pool.query(totalTripsQuery, [userId]);
    const totalTrips = parseInt(totalTripsResult.rows[0].count, 10);

    // 2. Upcoming trips
    const upcomingTripsQuery = `
      SELECT id, name, start_date, end_date, primary_destination 
      FROM trips 
      WHERE user_id = $1 AND start_date >= CURRENT_DATE
      ORDER BY start_date ASC
      LIMIT 3
    `;
    const upcomingTripsResult = await pool.query(upcomingTripsQuery, [userId]);
    const upcomingTrips = upcomingTripsResult.rows;

    // 3. Active trip (start_date <= current date AND end_date >= current date)
    const activeTripQuery = `
      SELECT id, name, start_date, end_date, primary_destination, estimated_budget
      FROM trips 
      WHERE user_id = $1 
        AND start_date <= CURRENT_DATE 
        AND end_date >= CURRENT_DATE
      ORDER BY start_date ASC
      LIMIT 1
    `;
    const activeTripResult = await pool.query(activeTripQuery, [userId]);
    let activeTrip = activeTripResult.rows[0] || null;

    // 4. Next upcoming trip (nearest trip in the future)
    let nextUpcomingTrip = null;
    if (upcomingTrips.length > 0) {
      nextUpcomingTrip = upcomingTrips[0]; // The first one is the nearest due to ASC ordering
      
      // We need estimated_budget for the budget calculation later
      const nextUpcomingTripFullQuery = `
        SELECT id, name, start_date, end_date, primary_destination, estimated_budget
        FROM trips
        WHERE id = $1
      `;
      const nextTripResult = await pool.query(nextUpcomingTripFullQuery, [nextUpcomingTrip.id]);
      nextUpcomingTrip = nextTripResult.rows[0];
    }

    // Process additional data for active or next trip
    if (activeTrip) {
      activeTrip = await this._enrichTripData(activeTrip);
    }
    
    if (nextUpcomingTrip && (!activeTrip || activeTrip.id !== nextUpcomingTrip.id)) {
      nextUpcomingTrip = await this._enrichTripData(nextUpcomingTrip);
    }

    return {
      total_trips: totalTrips,
      upcoming_trips: upcomingTrips,
      active_trip: activeTrip,
      next_upcoming_trip: nextUpcomingTrip
    };
  }

  async _enrichTripData(trip) {
    // 1. Destination (Deterministic rule: first destination by created_at ASC with valid lat/lon)
    const destQuery = `
      SELECT name, address, latitude, longitude 
      FROM destinations 
      WHERE trip_id = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY created_at ASC 
      LIMIT 1
    `;
    const destResult = await pool.query(destQuery, [trip.id]);
    const destination = destResult.rows[0] || null;

    // 2. Budget Summary (Total budget, total spent, remaining)
    const expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_spent
      FROM expenses
      WHERE trip_id = $1
    `;
    const expenseResult = await pool.query(expenseQuery, [trip.id]);
    const totalSpent = parseFloat(expenseResult.rows[0].total_spent);
    const totalBudget = parseFloat(trip.estimated_budget || 0);
    const remainingBudget = totalBudget > 0 ? totalBudget - totalSpent : 0;
    
    const budgetSummary = {
      total_budget: totalBudget,
      total_spent: totalSpent,
      remaining_budget: remainingBudget
    };

    // 3. Next Activity (Earliest activity in the future for this trip)
    // We join itinerary_days to ensure it belongs to the trip and to get the date
    const activityQuery = `
      SELECT a.name, a.start_time, d.date
      FROM activities a
      JOIN itinerary_days d ON a.itinerary_day_id = d.id
      WHERE d.trip_id = $1 AND d.date >= CURRENT_DATE
      ORDER BY d.date ASC, a.start_time ASC
      LIMIT 1
    `;
    const activityResult = await pool.query(activityQuery, [trip.id]);
    const nextActivity = activityResult.rows[0] || null;

    return {
      ...trip,
      destination,
      budget_summary: budgetSummary,
      next_activity: nextActivity
    };
  }
}

module.exports = new DashboardService();
