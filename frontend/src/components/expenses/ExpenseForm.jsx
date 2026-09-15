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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <div className="card expense-form p-4">
      <h4 className="mb-4">{initialData ? 'Edit Expense' : 'Add New Expense'}</h4>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label className="form-label">Expense Name *</label>
          <input
            type="text"
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Flight to Paris"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount ($) *</label>
            <input
              type="number"
              className="form-input"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-input"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Link to Activity</label>
            <select
              className="form-input"
              name="activity_id"
              value={formData.activity_id}
              onChange={handleChange}
            >
              <option value="">-- No Activity --</option>
              {activities.map(act => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-input"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="2"
            placeholder="Optional details"
          />
        </div>

        <div className="form-actions mt-4">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initialData ? 'Save Expense' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
