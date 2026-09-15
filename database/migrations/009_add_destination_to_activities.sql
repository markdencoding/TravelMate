-- ============================================================
-- TravelMate — Migration 009: Add destination to activities
-- ============================================================

ALTER TABLE activities
ADD COLUMN destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL;
