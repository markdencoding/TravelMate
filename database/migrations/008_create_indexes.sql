-- ============================================================
-- TravelMate — Migration 008: Create performance indexes
-- ============================================================
-- Additional indexes for common query patterns.
-- Core indexes are created in each table's migration file.
-- ============================================================

-- Trips ordered by creation date (dashboard, trip list)
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips (user_id, created_at DESC);

-- Trips by date range (upcoming trips)
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips (user_id, start_date, end_date);

-- Activities sorted within a day
CREATE INDEX IF NOT EXISTS idx_activities_sort ON activities (itinerary_day_id, sort_order);

-- Expenses by date (expense reports)
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (trip_id, expense_date);

-- Expenses by category (category summaries)
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (trip_id, category);
