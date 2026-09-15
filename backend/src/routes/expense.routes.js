const express = require('express');
const router = express.Router({ mergeParams: true });
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const VALID_CATEGORIES = ['transportation', 'accommodation', 'food', 'activities', 'shopping', 'other'];

const expenseSchema = {
  name: { type: 'string', required: true, maxLength: 200 },
  amount: { type: 'number', required: true, min: 0 },
  category: { 
    type: 'string', 
    required: true,
    pattern: /^(transportation|accommodation|food|activities|shopping|other)$/,
    message: 'Invalid category'
  },
  activity_id: { type: 'string' },
  expense_date: { type: 'string' },
  description: { type: 'string' }
};

router.use(authenticate);

// /api/trips/:tripId/expenses
router.route('/')
  .get(expenseController.getExpenses)
  .post(validate(expenseSchema), expenseController.createExpense);

// /api/trips/:tripId/expenses/summary
router.route('/summary')
  .get(expenseController.getExpenseSummary);

// /api/trips/:tripId/expenses/:expenseId
router.route('/:expenseId')
  .put(validate(expenseSchema), expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

module.exports = router;
