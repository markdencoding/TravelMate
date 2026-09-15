-- ============================================================
-- TravelMate — Migration 006: Create expenses table
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  activity_id  UUID          REFERENCES activities(id) ON DELETE SET NULL,
  category     VARCHAR(50)   NOT NULL DEFAULT 'other'
               CHECK (category IN (
                 'transportation', 'accommodation', 'food',
                 'activities', 'shopping', 'other'
               )),
  name         VARCHAR(200)  NOT NULL,
  amount       DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE,
  description  TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses (trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_activity_id ON expenses (activity_id);
