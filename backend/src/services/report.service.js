const db = require('../config/database');

class ReportService {
  async getTripReport(tripId, userId) {
    // 1. Fetch Core Trip Data and verify ownership
    const tripResult = await db.query(
      `SELECT id, name, description, start_date, end_date, primary_destination, estimated_budget 
       FROM trips 
       WHERE id = $1 AND user_id = $2`,
      [tripId, userId]
    );

    if (tripResult.rowCount === 0) {
      return null; // Trip not found or access denied
    }
    const trip = tripResult.rows[0];

    // Calculate duration in days
    let durationDays = 0;
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    }

    // 2. Aggregate Expenses
    const expensesAgg = await db.query(
      `SELECT 
         COUNT(*) as total_count,
         COALESCE(SUM(amount), 0) as total_spent,
         category,
         COALESCE(SUM(amount), 0) as category_total
       FROM expenses 
       WHERE trip_id = $1 
       GROUP BY category`,
      [tripId]
    );

    let totalExpenses = 0;
    let expenseCount = 0;
    const expensesByCategory = {
      transportation: 0,
      accommodation: 0,
      food: 0,
      activities: 0,
      shopping: 0,
      other: 0
    };

    expensesAgg.rows.forEach(row => {
      const catTotal = parseFloat(row.category_total);
      expensesByCategory[row.category] = catTotal;
      totalExpenses += catTotal;
      expenseCount += parseInt(row.total_count, 10);
    });

    const estimatedBudget = parseFloat(trip.estimated_budget || 0);
    const remainingBudget = estimatedBudget - totalExpenses;
    
    // Utilization rule explicitly specified
    let budgetUtilization = 0;
    if (estimatedBudget > 0) {
      budgetUtilization = (totalExpenses / estimatedBudget) * 100;
    }

    // 3. Aggregate Itinerary Statistics
    // Count days
    const daysResult = await db.query(
      `SELECT COUNT(*) as total_days, MIN(date) as first_date, MAX(date) as last_date 
       FROM itinerary_days 
       WHERE trip_id = $1`,
      [tripId]
    );
    
    // Count activities
    const activitiesResult = await db.query(
      `SELECT 
         COUNT(*) as total_activities,
         COUNT(destination_id) as with_locations,
         COUNT(estimated_cost) as with_costs
       FROM activities a
       JOIN itinerary_days d ON a.itinerary_day_id = d.id
       WHERE d.trip_id = $1`,
      [tripId]
    );

    const itinerary = {
      totalDays: parseInt(daysResult.rows[0].total_days, 10),
      firstDate: daysResult.rows[0].first_date,
      lastDate: daysResult.rows[0].last_date,
      totalActivities: parseInt(activitiesResult.rows[0].total_activities, 10),
      activitiesWithLocations: parseInt(activitiesResult.rows[0].with_locations, 10),
      activitiesWithCosts: parseInt(activitiesResult.rows[0].with_costs, 10)
    };

    // 4. Fetch Destinations
    // Also check if they are linked to activities using a subquery
    const destinationsResult = await db.query(
      `SELECT 
         d.id, d.name, d.address, d.latitude, d.longitude,
         EXISTS (SELECT 1 FROM activities a WHERE a.destination_id = d.id) as has_activities
       FROM destinations d
       WHERE d.trip_id = $1
       ORDER BY d.created_at ASC`,
      [tripId]
    );

    const destinations = destinationsResult.rows;

    return {
      trip: {
        ...trip,
        durationDays
      },
      summary: {
        totalExpenses,
        estimatedBudget,
        remainingBudget,
        budgetUtilization
      },
      expenses: {
        count: expenseCount,
        byCategory: expensesByCategory
      },
      itinerary,
      destinations
    };
  }
}

module.exports = new ReportService();
