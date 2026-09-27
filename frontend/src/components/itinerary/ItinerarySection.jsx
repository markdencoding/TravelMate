import { useState, useEffect } from 'react';
import itineraryService from '../../services/itineraryService';
import DayForm from './DayForm';
import ActivityForm from './ActivityForm';
import { 
  formatDateLong, 
  formatDateWithWeekday, 
  calculateDerivedDate, 
  getTripTotalDays 
} from '../../utils/itineraryDates';
import './Itinerary.css';

export default function ItinerarySection({ tripId, trip = null, destinations = [] }) {
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

  const totalTripDays = trip ? getTripTotalDays(trip.start_date, trip.end_date) : null;
  const canAddMoreDays = !totalTripDays || days.length < totalTripDays;

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
        // Edit or Move to another day
        await itineraryService.updateActivity(
          tripId, 
          activityFormContext.dayId, 
          activityFormContext.activity.id, 
          formData
        );
      } else {
        // Add activity to specified day
        const targetDayId = formData.itinerary_day_id || activityFormContext.dayId;
        await itineraryService.createActivity(tripId, targetDayId, formData);
      }
      setActivityFormContext(null);
      fetchItinerary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save activity');
    }
  };

  const handleQuickMoveActivity = async (sourceDayId, activityId, targetDayId) => {
    if (!targetDayId || targetDayId === sourceDayId) return;
    try {
      await itineraryService.updateActivity(tripId, sourceDayId, activityId, {
        itinerary_day_id: targetDayId
      });
      fetchItinerary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to move activity');
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

  const moveActivityOrder = async (dayId, activity, direction) => {
    const newSortOrder = (activity.sort_order || 0) + (direction === 'up' ? -1 : 1);
    try {
      await itineraryService.updateActivity(tripId, dayId, activity.id, { sort_order: newSortOrder });
      fetchItinerary();
    } catch (err) {
      // Handle silently
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${String(formattedH).padStart(2, '0')}:${m} ${ampm}`;
    }
    return timeStr;
  };

  if (loading) return <div>Loading itinerary...</div>;
  if (error) return <div className="text-error">{error}</div>;

  return (
    <div className="itinerary-section">
      <div className="itinerary-header flex justify-between items-center mb-4">
        <div>
          <h2>Trip Itinerary</h2>
          {trip?.start_date && (
            <p className="text-muted text-xs mt-0.5">
              Dates automatically synchronized with trip schedule ({formatDateLong(trip.start_date)}
              {trip.end_date ? ` – ${formatDateLong(trip.end_date)}` : ''})
            </p>
          )}
        </div>
        {totalTripDays && (
          <span className="badge bg-surface-secondary text-main text-xs border border-border font-semibold">
            {days.length} of {totalTripDays} Days Planned
          </span>
        )}
      </div>

      <div className="itinerary-days-container">
        {days.length === 0 && !showDayForm && (
          <div className="empty-state">
            <p>No itinerary planned yet. Add your first day to start scheduling activities.</p>
          </div>
        )}

        {days.map(day => {
          const effectiveDate = day.date || (trip?.start_date ? calculateDerivedDate(trip.start_date, day.day_number) : null);
          const dayDateFormatted = formatDateLong(effectiveDate);

          return (
            <div key={day.id} className="itinerary-day-card">
              <div className="itinerary-day-header">
                <div className="itinerary-day-title">
                  <div className="flex items-baseline gap-2.5">
                    <span className="badge bg-primary text-white text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded">
                      DAY {day.day_number}
                    </span>
                    {dayDateFormatted && (
                      <span className="itinerary-day-date font-bold text-main text-base">
                        {dayDateFormatted}
                      </span>
                    )}
                  </div>
                </div>
                <div className="itinerary-day-actions">
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => { setEditingDay(day); setShowDayForm(true); }}
                  >
                    Edit Day
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm text-error" 
                    onClick={() => handleDeleteDay(day.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="itinerary-activities">
                {day.activities?.length === 0 && (!activityFormContext || activityFormContext.dayId !== day.id) && (
                  <div className="text-muted text-sm my-4 italic">
                    No activities planned for Day {day.day_number} ({dayDateFormatted || 'unscheduled'}).
                  </div>
                )}

                {day.activities?.map((act, index) => (
                  <div key={act.id} className="itinerary-activity-item">
                    <div className="activity-timeline">
                      <div className="activity-time font-bold text-primary">
                        {act.start_time ? formatTime(act.start_time) : '--:--'}
                      </div>
                      <div className="activity-node"></div>
                      <div className="activity-line"></div>
                    </div>
                    
                    <div className="activity-content card">
                      <div className="activity-content-header flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base text-main">{act.name}</h4>
                          {effectiveDate && (
                            <span className="text-[11px] text-muted block mt-0.5">
                              📅 {formatDateWithWeekday(effectiveDate)}
                              {act.start_time ? ` at ${formatTime(act.start_time)}` : ''}
                              {act.end_time ? ` – ${formatTime(act.end_time)}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="activity-actions flex items-center gap-1">
                          <button 
                            className="btn btn-ghost text-xs p-1" 
                            onClick={() => moveActivityOrder(day.id, act, 'up')} 
                            disabled={index === 0} 
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button 
                            className="btn btn-ghost text-xs p-1" 
                            onClick={() => moveActivityOrder(day.id, act, 'down')} 
                            disabled={index === day.activities.length - 1} 
                            title="Move down"
                          >
                            ▼
                          </button>
                          
                          {/* Quick Day Switcher if multiple days exist */}
                          {days.length > 1 && (
                            <select
                              className="text-xs py-1 px-1.5 rounded border border-border bg-surface text-muted cursor-pointer hover:border-primary"
                              value={day.id}
                              onChange={(e) => handleQuickMoveActivity(day.id, act.id, e.target.value)}
                              title="Move activity to another day"
                              aria-label={`Move ${act.name} to another day`}
                            >
                              {days.map(targetDay => (
                                <option key={targetDay.id} value={targetDay.id}>
                                  Day {targetDay.day_number}
                                </option>
                              ))}
                            </select>
                          )}

                          <button 
                            className="btn btn-ghost text-xs ml-1" 
                            onClick={() => setActivityFormContext({ dayId: day.id, activity: act })}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-ghost text-xs text-error" 
                            onClick={() => handleDeleteActivity(day.id, act.id)}
                          >
                            Del
                          </button>
                        </div>
                      </div>
                      
                      {(act.location || act.destination_id) && (
                        <div className="activity-meta text-xs text-muted mt-1.5 flex items-center gap-1">
                          <span>📍</span>
                          <span>{act.location || (destinations.find(d => d.id === act.destination_id)?.name) || 'Unassigned'}</span>
                        </div>
                      )}
                      
                      {act.description && (
                        <p className="activity-desc text-xs text-muted mt-2 leading-relaxed">
                          {act.description}
                        </p>
                      )}
                      
                      {act.estimated_cost != null && (
                        <div className="activity-cost text-xs font-semibold text-success mt-2">
                          💰 ${Number(act.estimated_cost).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Activity Form Injection */}
                {activityFormContext && activityFormContext.dayId === day.id && (
                  <div className="mt-4">
                    <ActivityForm 
                      initialData={activityFormContext.activity} 
                      currentDayId={day.id}
                      days={days}
                      trip={trip}
                      destinations={destinations} 
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
          );
        })}
      </div>

      {showDayForm ? (
        <div className="mt-4">
          <DayForm 
            initialData={editingDay} 
            existingDaysCount={days.length}
            trip={trip}
            onSubmit={handleSaveDay} 
            onCancel={() => { setShowDayForm(false); setEditingDay(null); }} 
          />
        </div>
      ) : canAddMoreDays ? (
        <button className="btn btn-primary mt-6" onClick={() => setShowDayForm(true)}>
          ➕ Add Day {days.length + 1}
        </button>
      ) : (
        <div className="card p-3 bg-surface-secondary text-muted text-xs border border-border mt-6 flex items-center justify-between">
          <span>✓ All days for this trip duration (Day 1 – Day {totalTripDays}) have been scheduled.</span>
          <span className="font-semibold text-primary">
            {formatDateLong(trip?.start_date)} – {formatDateLong(trip?.end_date)}
          </span>
        </div>
      )}
    </div>
  );
}
