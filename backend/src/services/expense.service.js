const pool = require('../config/database');
const AppError = require('../utils/AppError');

class ExpenseService {
  
  // ==========================================
  // HELPER: Verify Trip Ownership
  // ==========================================
  async _verifyTripOwnership(tripId, userId) {
    const query = `SELECT id, estimated_budget FROM trips WHERE id = $1 AND user_id = $2`;
    const result = await pool.query(query, [tripId, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Trip not found or unauthorized', 404);
    }
    return result.rows[0];
  }

  // ==========================================
  // HELPER: Verify Activity Belongs to Trip
  // ==========================================
  async _verifyActivityTrip(activityId, tripId) {
    // Activity -> Itinerary Day -> Trip
    const query = `
      SELECT a.id 
      FROM activities a
      JOIN itinerary_days d ON a.itinerary_day_id = d.id
      WHERE a.id = $1 AND d.trip_id = $2
    `;
    const result = await pool.query(query, [activityId, tripId]);
    if (result.rows.length === 0) {
      throw new AppError('Invalid activity or activity belongs to another trip', 400);
    }
  }

  // ==========================================
  // HELPER: Verify Expense Ownership
  // ==========================================
  async _verifyExpenseOwnership(expenseId, tripId, userId) {
    const query = `
      SELECT e.id 
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      WHERE e.id = $1 AND e.trip_id = $2 AND t.user_id = $3
    `;
    const result = await pool.query(query, [expenseId, tripId, userId]);
    if (result.rows.length === 0) {
      throw new AppError('Expense not found or unauthorized', 404);
    }
  }

  // ==========================================
  // EXPENSE CRUD
  // ==========================================

  async getExpenses(tripId, userId) {
    await this._verifyTripOwnership(tripId, userId);
    
    const query = `
      SELECT * FROM expenses 
      WHERE trip_id = $1 
      ORDER BY expense_date DESC NULLS LAST, created_at DESC
    `;
    const result = await pool.query(query, [tripId]);
    return result.rows;
  }

  async getExpenseSummary(tripId, userId) {
    const trip = await this._verifyTripOwnership(tripId, userId);
    
    // Total spent
    const totalQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_spent
      FROM expenses
      WHERE trip_id = $1
    `;
    const totalResult = await pool.query(totalQuery, [tripId]);
    const totalSpent = parseFloat(totalResult.rows[0].total_spent);
    
    // Category totals
    const catQuery = `
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE trip_id = $1
      GROUP BY category
    `;
    const catResult = await pool.query(catQuery, [tripId]);
    
    // Convert array of rows to a key-value object
    const categories = catResult.rows.reduce((acc, row) => {
      acc[row.category] = parseFloat(row.total);
      return acc;
    }, {});
    
    const estimatedBudget = parseFloat(trip.estimated_budget || 0);
    const remainingBudget = estimatedBudget > 0 ? estimatedBudget - totalSpent : 0;

    return {
      total_spent: totalSpent,
      estimated_budget: estimatedBudget,
      remaining_budget: remainingBudget,
      categories
    };
  }

  async createExpense(tripId, userId, data) {
    await this._verifyTripOwnership(tripId, userId);
    
    const { activity_id, category, name, amount, expense_date, description } = data;

    if (activity_id) {
      await this._verifyActivityTrip(activity_id, tripId);
    }

    const query = `
      INSERT INTO expenses (trip_id, activity_id, category, name, amount, expense_date, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      tripId,
      activity_id || null,
      category || 'other',
      name,
      amount,
      expense_date || null,
      description || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateExpense(tripId, expenseId, userId, data) {
    await this._verifyExpenseOwnership(expenseId, tripId, userId);
    
    const { activity_id, category, name, amount, expense_date, description } = data;

    if (activity_id) {
      await this._verifyActivityTrip(activity_id, tripId);
    }

    const query = `
      UPDATE expenses
      SET
        activity_id = $1,
        category = COALESCE($2, category),
        name = COALESCE($3, name),
        amount = COALESCE($4, amount),
        expense_date = $5,
        description = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      activity_id !== undefined ? activity_id : null,
      category || null,
      name || null,
      amount !== undefined ? amount : null,
      expense_date !== undefined ? expense_date : null,
      description !== undefined ? description : null,
      expenseId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteExpense(tripId, expenseId, userId) {
    await this._verifyExpenseOwnership(expenseId, tripId, userId);
    
    const query = `DELETE FROM expenses WHERE id = $1 RETURNING id`;
    await pool.query(query, [expenseId]);
    return true;
  }
}

module.exports = new ExpenseService();
