export default function ExpenseSummary({ summary }) {
  if (!summary) return null;

  const { total_spent, estimated_budget, remaining_budget, categories } = summary;
  
  // Prevent division by zero
  const percentageSpent = estimated_budget > 0 
    ? Math.min(100, Math.round((total_spent / estimated_budget) * 100)) 
    : 0;

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'transportation': return '✈️';
      case 'accommodation': return '🏨';
      case 'food': return '🍔';
      case 'activities': return '🎟️';
      case 'shopping': return '🛍️';
      case 'other': return '📦';
      default: return '📦';
    }
  };

  return (
    <div className="expense-summary-container">
      <div className="expense-overview-cards">
        <div className="card text-center p-4">
          <div className="text-muted text-sm uppercase font-bold tracking-wider mb-1">Total Budget</div>
          <div className="text-2xl font-bold">${Number(estimated_budget).toFixed(2)}</div>
        </div>
        <div className="card text-center p-4 bg-primary-light border-primary">
          <div className="text-muted text-sm uppercase font-bold tracking-wider mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-primary">${Number(total_spent).toFixed(2)}</div>
        </div>
        <div className={`card text-center p-4 ${remaining_budget < 0 ? 'border-error' : ''}`}>
          <div className="text-muted text-sm uppercase font-bold tracking-wider mb-1">Remaining</div>
          <div className={`text-2xl font-bold ${remaining_budget < 0 ? 'text-error' : 'text-success'}`}>
            ${Number(remaining_budget).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2 font-bold">
          <span>Budget Usage</span>
          <span>{percentageSpent}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar-fill ${percentageSpent >= 100 ? 'bg-error' : 'bg-primary'}`} 
            style={{ width: `${percentageSpent}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-lg font-bold mb-4">Spending by Category</h4>
        <div className="expense-categories-grid">
          {Object.entries(categories).filter(([_, amount]) => amount > 0).map(([cat, amount]) => (
            <div key={cat} className="category-item flex justify-between p-3 card">
              <div className="flex items-center gap-2 capitalize">
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
              </div>
              <div className="font-bold">${Number(amount).toFixed(2)}</div>
            </div>
          ))}
          {Object.keys(categories).length === 0 && (
            <div className="text-muted col-span-full">No category spending yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
