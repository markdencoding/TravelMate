const AppError = require('../utils/AppError');

/**
 * Request validation middleware factory.
 * Validates req.body fields against a simple schema.
 *
 * @param {object} schema - Object with field names as keys and validation rules
 *   Each rule: { required: bool, type: string, minLength: number, maxLength: number, pattern: RegExp, message: string }
 *
 * Usage:
 *   const validate = require('../middleware/validate');
 *   router.post('/register', validate({
 *     email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required' },
 *     password: { required: true, type: 'string', minLength: 8, message: 'Password must be at least 8 characters' },
 *   }), handler);
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(rules.message || `${field} is required.`);
        continue;
      }

      // Skip further validation if value is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be a ${rules.type}.`);
        continue;
      }

      // String-specific validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(rules.message || `${field} must be at least ${rules.minLength} characters.`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters.`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(rules.message || `${field} format is invalid.`);
        }
      }

      // Number-specific validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}.`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}.`);
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join(' '), 400));
    }

    next();
  };
}

module.exports = validate;
