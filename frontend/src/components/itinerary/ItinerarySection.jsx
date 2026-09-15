import { useState, useEffect } from 'react';
import itineraryService from '../../services/itineraryService';
import DayForm from './DayForm';
import ActivityForm from './ActivityForm';
import './Itinerary.css';

export default function ItinerarySection({ tripId, destinations }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form toggles
  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  
  // Tracks which day is adding/editing an activity
  const [activityFormContext, setActivityFormContext] = useState(null); 

  useEffect(() => {
    fetchItinerary();
  }, [tripId]);

  const fetchItinerary = async () => {
    setLoading(true);
    try {
      const result = await itineraryService.getItinerary(tripId);
      if (result.success) {
        setDays(result.data);
      }
    } catch (err) {
      setError('Failed to load itinerary.');
    } finally {
      setLoading(false);
    }
  };

  // --- Day Handlers ---
  const handleSaveDay = async (formData) => {
    try {
      if (editingDay) {
        await itineraryService.updateDay(tripId, editingDay.id, formData);
      } else {
        await itineraryService.createDay(tripId, formData);
      }
      setShowDayForm(false);
      setEditingDay(null);
      fetchItinerary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save day');
    }
  };

  const handleDeleteDay = async (dayId) => {
    if (!window.confirm('Delete this day and ALL its activities?')) return;
    try {
      await itineraryService.deleteDay(tripId, dayId);
      fetchItinerary();
    } catch (err) {
      alert('Failed to delete day');
    }
  };

  // --- Activity Handlers ---
  const handleSaveActivity = async (formData) => {
    try {
      if (activityFormContext.activity) {
        // Edit
        await itineraryService.updateActivity(tripId, activityFormContext.dayId, activityFormContext.activity.id, formData);
      } else {
        // Add
        await itineraryService.createActivity(tripId, activityFormContext.dayId, formData);
      }
      setActivityFormContext(null);
      fetchItinerary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save activity');
    }
  };

  const handleDeleteActivity = async (dayId, actId) => {
    if (!window.confirm('Delete this activity?')) return;
    try {
      await itineraryService.deleteActivity(tripId, dayId, actId);
      fetchItinerary();
    } catch (err) {
      alert('Failed to delete activity');
    }
  };

  const moveActivity = async (dayId, activity, direction) => {
    const newSortOrder = (activity.sort_order || 0) + (direction === 'up' ? -1 : 1);
    try {
      // Just do a rapid API update and optimistic local UI state change would be faster, but let's re-fetch for simplicity
      await itineraryService.updateActivity(tripId, dayId, activity.id, { sort_order: newSortOrder });
      fetchItinerary();
    } catch (err) {
      // Handle silently
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // timeStr from DB is often "HH:MM:SS". Let's trim to HH:MM
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
  };

  if (loading) return <div>Loading itinerary...</div>;
  if (error) return <div className="text-error">{error}</div>;

  return (
    <div className="itinerary-section">
      <div className="itinerary-header">
        <h2>Itinerary</h2>
      </div>

      <div className="itinerary-days-container">
        {days.length === 0 && !showDayForm && (
          <div className="empty-state">
            <p>No itinerary planned yet.</p>
          </div>
        )}

        {days.map(day => (
          <div key={day.id} className="itinerary-day-card">
            <div className="itinerary-day-header">
              <div className="itinerary-day-title">
                <h3>Day {day.day_number}</h3>
                {day.date && <span className="text-muted ml-2">{formatDate(day.date)}</span>}
              </div>
              <div className="itinerary-day-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingDay(day); setShowDayForm(true); }}>Edit</button>
                <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDeleteDay(day.id)}>Delete</button>
              </div>
            </div>

            <div className="itinerary-activities">
              {day.activities?.length === 0 && (!activityFormContext || activityFormContext.dayId !== day.id) && (
                <div className="text-muted text-sm my-4">No activities planned for this day.</div>
              )}

              {day.activities?.map((act, index) => (
                <div key={act.id} className="itinerary-activity-item">
                  <div className="activity-timeline">
                    <div className="activity-time">
                      {act.start_time ? formatTime(act.start_time) : '--:--'}
                    </div>
                    <div className="activity-node"></div>
                    <div className="activity-line"></div>
                  </div>
                  
                  <div className="activity-content card">
                    <div className="activity-content-header">
                      <h4>{act.name}</h4>
                      <div className="activity-actions">
                         <button className="btn btn-ghost text-xs p-1" onClick={() => moveActivity(day.id, act, 'up')} disabled={index === 0}>▲</button>
                         <button className="btn btn-ghost text-xs p-1" onClick={() => moveActivity(day.id, act, 'down')} disabled={index === day.activities.length - 1}>▼</button>
                         <button className="btn btn-ghost text-xs ml-2" onClick={() => setActivityFormContext({ dayId: day.id, activity: act })}>Edit</button>
                         <button className="btn btn-ghost text-xs text-error" onClick={() => handleDeleteActivity(day.id, act.id)}>Del</button>
                      </div>
                    </div>
                    
                    {(act.location || act.destination_id) && (
                      <div className="activity-meta">📍 {act.location || destinations.find(d => d.id === act.destination_id)?.name}</div>
                    )}
                    
                    {act.description && <p className="activity-desc mt-2">{act.description}</p>}
                    
                    {act.estimated_cost != null && (
                      <div className="activity-cost mt-2">💰 ${Number(act.estimated_cost).toFixed(2)}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Activity Form Injection */}
              {activityFormContext && activityFormContext.dayId === day.id && (
                <div className="mt-4">
                  <ActivityForm 
                    destinations={destinations} 
                    initialData={activityFormContext.activity} 
                    onSubmit={handleSaveActivity} 
                    onCancel={() => setActivityFormContext(null)} 
                  />
                </div>
              )}

              {(!activityFormContext || activityFormContext.dayId !== day.id) && (
                <button 
                  className="btn btn-secondary btn-sm mt-4" 
                  onClick={() => setActivityFormContext({ dayId: day.id, activity: null })}
                >
                  ➕ Add Activity
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showDayForm ? (
        <div className="mt-4">
          <DayForm 
            initialData={editingDay} 
            existingDaysCount={days.length}
            onSubmit={handleSaveDay} 
            onCancel={() => { setShowDayForm(false); setEditingDay(null); }} 
          />
        </div>
      ) : (
        <button className="btn btn-primary mt-6" onClick={() => setShowDayForm(true)}>
          ➕ Add Day
        </button>
      )}
    </div>
  );
}
