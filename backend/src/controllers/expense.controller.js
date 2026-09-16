const expenseService = require('../services/expense.service');
const { success } = require('../utils/responseHelper');

exports.getExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const expenses = await expenseService.getExpenses(tripId, userId);
    return success(res, 'Expenses retrieved successfully', expenses);
  } catch (error) {
    next(error);
  }
};

exports.getExpenseSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const summary = await expenseService.getExpenseSummary(tripId, userId);
    return success(res, 'Expense summary retrieved successfully', summary);
  } catch (error) {
    next(error);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const { name, amount, category, description } = req.body;
    
    if (!name || name.trim().length === 0) return res.status(400).json({ success: false, message: 'Expense name is required' });
    if (name.length > 200) return res.status(400).json({ success: false, message: 'Expense name must not exceed 200 characters' });
    if (description && description.length > 2000) return res.status(400).json({ success: false, message: 'Description must not exceed 2000 characters' });
    if (amount === undefined || amount < 0) return res.status(400).json({ success: false, message: 'Amount must be zero or positive' });
    const validCategories = ['transportation', 'accommodation', 'food', 'activities', 'shopping', 'other'];
    if (category && !validCategories.includes(category)) return res.status(400).json({ success: false, message: 'Invalid expense category' });

    const expense = await expenseService.createExpense(tripId, userId, req.body);
    return success(res, 'Expense created successfully', expense, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, expenseId } = req.params;
    const { name, amount, category, description } = req.body;
    
    if (name !== undefined) {
      if (name.trim().length === 0) return res.status(400).json({ success: false, message: 'Expense name is required' });
      if (name.length > 200) return res.status(400).json({ success: false, message: 'Expense name must not exceed 200 characters' });
    }
    if (description && description.length > 2000) return res.status(400).json({ success: false, message: 'Description must not exceed 2000 characters' });
    if (amount !== undefined && amount < 0) return res.status(400).json({ success: false, message: 'Amount must be zero or positive' });
    const validCategories = ['transportation', 'accommodation', 'food', 'activities', 'shopping', 'other'];
    if (category && !validCategories.includes(category)) return res.status(400).json({ success: false, message: 'Invalid expense category' });

    const expense = await expenseService.updateExpense(tripId, expenseId, userId, req.body);
    return success(res, 'Expense updated successfully', expense);
  } catch (error) {
    next(error);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, expenseId } = req.params;
    await expenseService.deleteExpense(tripId, expenseId, userId);
    return success(res, 'Expense deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
