-- Add member_user_id column to transactions table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS member_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Optional: index for faster lookup
CREATE INDEX IF NOT EXISTS idx_transactions_member_user_id ON transactions(member_user_id);
