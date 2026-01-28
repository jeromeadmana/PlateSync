-- Table Sessions Migration
-- Adds token-based authentication for customer tablets

CREATE TABLE IF NOT EXISTS table_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_table_sessions_token ON table_sessions(token);

-- Index for cleanup queries (expired sessions)
CREATE INDEX IF NOT EXISTS idx_table_sessions_expires ON table_sessions(expires_at);

-- Index for table lookups
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id ON table_sessions(table_id);
