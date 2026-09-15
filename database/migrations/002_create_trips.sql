-- ============================================================
-- TravelMate — Migration 002: Create trips table
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 VARCHAR(200) NOT NULL,
  description          TEXT,
  start_date           DATE,
  end_date             DATE,
  primary_destination  VARCHAR(200),
  estimated_budget     DECIMAL(12,2) CHECK (estimated_budget >= 0),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Ensure end_date is not before start_date
  CONSTRAINT chk_trip_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Index for fetching a user's trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips (user_id);
