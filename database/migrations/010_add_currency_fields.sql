-- ============================================================
-- TravelMate — Migration 010: Add currency fields to trips and destinations
-- ============================================================

ALTER TABLE trips ADD COLUMN IF NOT EXISTS base_currency VARCHAR(10) DEFAULT 'PHP';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS currency VARCHAR(10);
