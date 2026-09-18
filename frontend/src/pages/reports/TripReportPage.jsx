import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tripService from '../../services/tripService';
import './TripReportPage.css';

export default function TripReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await tripService.getTripReport(id);
        if (res.success) {
          setReport(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError('Failed to load trip report. Please ensure it exists and belongs to you.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading Report...</div>;
  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!report) return null;

  const { trip, summary, expenses, itinerary, destinations } = report;
  
  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);
  };
  
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

  // Cap visual utilization at 100%, but keep text actual
  const visualUtilization = Math.min(summary.budgetUtilization, 100);
  const overBudget = summary.remainingBudget < 0;

  return (
    <div className="trip-report-page max-w-5xl mx-auto pb-12">
      <div className="report-header flex justify-between items-center mb-8">
        <div>
          <button className="btn btn-secondary btn-sm mb-4 print-hide" onClick={() => navigate(`/trips/${id}`)}>
            &larr; Back to Trip Details
          </button>
          <h1 className="page-title">{trip.name} — Summary Report</h1>
          <p className="text-muted">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <button className="btn btn-primary print-hide" onClick={() => window.print()}>
          🖨️ Print Report
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Trip Overview */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Trip Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted">Primary Destination</p>
              <p className="font-semibold">{trip.primary_destination || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Duration</p>
              <p className="font-semibold">{trip.durationDays} days</p>
            </div>
            <div>
              <p className="text-sm text-muted">Start Date</p>
              <p className="font-semibold">{formatDate(trip.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted">End Date</p>
              <p className="font-semibold">{formatDate(trip.end_date)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted">Description</p>
              <p>{trip.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Budget Overview</h2>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm text-muted">Estimated Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.estimatedBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Total Spent</p>
              <p className="text-xl font-bold text-error">{formatCurrency(summary.totalExpenses)}</p>
            </div>
          </div>
          
          <div className="report-progress-track">
            <div 
              className={`report-progress-fill ${overBudget ? 'bg-error' : 'bg-primary'}`} 
              style={{ width: `${visualUtilization}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm font-semibold">
            <span className={overBudget ? 'text-error' : 'text-success'}>
              Remaining: {formatCurrency(summary.remainingBudget)}
            </span>
            <span>Utilization: {summary.budgetUtilization.toFixed(1)}%</span>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Expense Breakdown</h2>
          <p className="text-sm text-muted mb-4">Total Logged Expenses: {expenses.count}</p>
          <div className="flex flex-col gap-3">
            {Object.entries(expenses.byCategory).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between items-center">
                <span className="capitalize font-medium">{cat}</span>
                <span className="font-semibold">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary Statistics */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Itinerary Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="report-stat-box">
              <span className="text-3xl font-bold text-primary">{itinerary.totalDays}</span>
              <p className="text-sm text-muted uppercase tracking-wide">Days Planned</p>
            </div>
            <div className="report-stat-box">
              <span className="text-3xl font-bold text-secondary">{itinerary.totalActivities}</span>
              <p className="text-sm text-muted uppercase tracking-wide">Total Activities</p>
            </div>
            <div className="report-stat-box">
              <span className="text-2xl font-bold text-text">{itinerary.activitiesWithLocations}</span>
              <p className="text-xs text-muted uppercase tracking-wide">With Locations</p>
            </div>
            <div className="report-stat-box">
              <span className="text-2xl font-bold text-text">{itinerary.activitiesWithCosts}</span>
              <p className="text-xs text-muted uppercase tracking-wide">With Est. Costs</p>
            </div>
          </div>
          {itinerary.totalDays > 0 && (
            <p className="text-center text-sm text-muted mt-4">
              From {formatDate(itinerary.firstDate)} to {formatDate(itinerary.lastDate)}
            </p>
          )}
        </div>

        {/* Destinations List */}
        <div className="card p-6 col-span-1 md:col-span-2">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Destinations ({destinations.length})</h2>
          {destinations.length === 0 ? (
            <p className="text-muted italic">No destinations saved for this trip.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {destinations.map(dest => (
                <div key={dest.id} className="report-dest-card">
                  <h3 className="font-bold text-lg">{dest.name}</h3>
                  {dest.address && <p className="text-sm text-muted mt-1">📍 {dest.address}</p>}
                  <div className="mt-3 text-xs font-semibold">
                    {dest.has_activities ? (
                      <span className="badge badge-success">Linked to Itinerary</span>
                    ) : (
                      <span className="badge badge-warning">No Activities Yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
