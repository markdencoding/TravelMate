-- ============================================================
-- TravelMate — Migration 004: Create itinerary_days table
-- ============================================================

CREATE TABLE IF NOT EXISTS itinerary_days (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date        DATE,
  day_number  INTEGER     NOT NULL CHECK (day_number > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each trip should have unique day numbers
  CONSTRAINT uq_trip_day_number UNIQUE (trip_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON itinerary_days (trip_id);
