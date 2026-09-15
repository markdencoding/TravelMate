-- ============================================================
-- TravelMate — Migration 003: Create destinations table
-- ============================================================

CREATE TABLE IF NOT EXISTS destinations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  address     VARCHAR(500),
  latitude    DECIMAL(10,7),
  longitude   DECIMAL(10,7),
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_trip_id ON destinations (trip_id);
