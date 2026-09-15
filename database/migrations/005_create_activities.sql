-- ============================================================
-- TravelMate — Migration 005: Create activities table
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_day_id  UUID          NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  name              VARCHAR(200)  NOT NULL,
  description       TEXT,
  start_time        TIME,
  end_time          TIME,
  location          VARCHAR(300),
  estimated_cost    DECIMAL(12,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  sort_order        INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_day_id ON activities (itinerary_day_id);
