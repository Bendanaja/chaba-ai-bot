CREATE TABLE IF NOT EXISTS payment_slips (
  slip_id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
