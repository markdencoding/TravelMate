import { useState, useEffect } from 'react';

const CATEGORIES = [
  { value: 'transportation', label: 'Transportation' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food' },
  { value: 'activities', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' }
];

export default function ExpenseForm({ initialData = null, activities = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'other',
    expense_date: '',
    activity_id: '',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        amount: initialData.amount || '',
        category: initialData.category || 'other',
        expense_date: initialData.expense_date ? new Date(initialData.expense_date).toISOString().split('T')[0] : '',
        activity_id: initialData.activity_id || '',
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card expense-form p-4">
      <h4 className="mb-4">{initialData ? 'Edit Expense' : 'Add New Expense'}</h4>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label htmlFor="expense_name" className="form-label">Expense Name *</label>
          <input
            id="expense_name"
            type="text"
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Dinner at local restaurant"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount" className="form-label">Amount ($) *</label>
            <input
              id="amount"
              type="number"
              className="form-input"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="category" className="form-label">Category *</label>
            <select
              id="category"
              className="form-input"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expense_date" className="form-label">Date</label>
            <input
              id="expense_date"
              type="date"
              className="form-input"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="activity_id" className="form-label">Link to Activity</label>
            <select
              id="activity_id"
              className="form-select"
              name="activity_id"
              value={formData.activity_id}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">-- No Activity --</option>
              {activities.map(act => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Notes</label>
          <textarea
            id="description"
            className="form-textarea"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="form-actions mt-4">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Expense' : 'Add Expense')}
          </button>
        </div>
      </form>
    </div>
  );
}
