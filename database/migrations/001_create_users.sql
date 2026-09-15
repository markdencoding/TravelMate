-- ============================================================
-- TravelMate — Migration 001: Create users table
-- ============================================================
-- Run against Supabase PostgreSQL using the SQL Editor or CLI.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'traveler'
                CHECK (role IN ('traveler', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for email lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
