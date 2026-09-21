-- ============================================================
-- TravelMate — Migration 011: Create password_reset_tokens table
-- ============================================================
-- Stores hashed email OTPs and single-use password reset tokens.
-- Run against Supabase PostgreSQL using run-migrations.js or CLI.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email                   VARCHAR(255) NOT NULL,
  otp_hash                VARCHAR(255) NOT NULL,
  expires_at              TIMESTAMPTZ NOT NULL,
  attempt_count           INTEGER NOT NULL DEFAULT 0,
  verified_at             TIMESTAMPTZ,
  reset_token_hash        VARCHAR(255),
  reset_token_expires_at  TIMESTAMPTZ,
  used_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and lookup security
CREATE INDEX IF NOT EXISTS idx_pwd_reset_email ON password_reset_tokens (email);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_token_hash ON password_reset_tokens (reset_token_hash);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_expires ON password_reset_tokens (expires_at);
