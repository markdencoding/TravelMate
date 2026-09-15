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
