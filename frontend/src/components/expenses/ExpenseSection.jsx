import { useState, useEffect } from 'react';
import expenseService from '../../services/expenseService';
import itineraryService from '../../services/itineraryService';
import ExpenseForm from './ExpenseForm';
import ExpenseSummary from './ExpenseSummary';
import './Expenses.css';

export default function ExpenseSection({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]); // Flat list of activities for the dropdown
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, sumRes, itinRes] = await Promise.all([
        expenseService.getExpenses(tripId),
        expenseService.getSummary(tripId),
        itineraryService.getItinerary(tripId)
      ]);
      
      if (expRes.success) setExpenses(expRes.data);
      if (sumRes.success) setSummary(sumRes.data);
      
      if (itinRes.success) {
        // Flatten activities from itinerary days
        const flatActs = [];
        itinRes.data.forEach(day => {
          if (day.activities) {
            day.activities.forEach(a => flatActs.push({
              id: a.id,
              name: `Day ${day.day_number}: ${a.name}`
            }));
          }
        });
        setActivities(flatActs);
      }
    } catch (err) {
      setError('Failed to load expense data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(tripId, editingExpense.id, formData);
      } else {
        await expenseService.createExpense(tripId, formData);
      }
      setShowForm(false);
      setEditingExpense(null);
      fetchData(); // Refresh list and summary
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseService.deleteExpense(tripId, expenseId);
      fetchData();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <div>Loading expenses...</div>;
  if (error) return <div className="text-error">{error}</div>;

  return (
    <div className="expense-section">
      <div className="expense-header">
        <h2>Expenses & Budget</h2>
      </div>

      <ExpenseSummary summary={summary} />

      <div className="expense-list-container mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Expense Log</h3>
          {!showForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              ➕ Add Expense
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-6">
            <ExpenseForm 
              initialData={editingExpense} 
              activities={activities}
              onSubmit={handleSave} 
              onCancel={() => { setShowForm(false); setEditingExpense(null); }} 
            />
          </div>
        )}

        <div className="expense-items flex flex-col gap-3">
          {expenses.length === 0 && !showForm && (
            <div className="text-muted text-center p-6 border border-dashed rounded">
              No expenses recorded yet.
            </div>
          )}

          {expenses.map(exp => (
            <div key={exp.id} className="expense-item card p-4 flex justify-between items-center">
              <div className="expense-details">
                <div className="font-bold text-lg">{exp.name}</div>
                <div className="text-sm text-muted flex gap-3 mt-1 items-center">
                  <span className="capitalize badge badge-neutral">{exp.category}</span>
                  {exp.expense_date && <span>📅 {formatDate(exp.expense_date)}</span>}
                  {exp.activity_id && <span className="text-primary font-medium">🎟️ Linked to Activity</span>}
                </div>
                {exp.description && <div className="text-sm mt-2 text-muted">{exp.description}</div>}
              </div>
              <div className="expense-amount-actions text-right">
                <div className="font-bold text-xl">${Number(exp.amount).toFixed(2)}</div>
                <div className="flex gap-2 justify-end mt-2">
                  <button className="btn btn-ghost btn-sm p-1" onClick={() => { setEditingExpense(exp); setShowForm(true); }}>Edit</button>
                  <button className="btn btn-ghost btn-sm p-1 text-error" onClick={() => handleDelete(exp.id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
