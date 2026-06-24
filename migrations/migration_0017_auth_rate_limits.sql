-- Migration 0017 : table auth_rate_limits persistante pour le rate limiting login
-- Remplace le Map<> en mémoire (non partagé entre instances Cloudflare Workers)

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  ip            TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt  TEXT    NOT NULL DEFAULT (datetime('now')),
  blocked_until TEXT    -- NULL si pas bloqué
);

-- Index pour le nettoyage des entrées expirées
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_last_attempt
  ON auth_rate_limits(last_attempt);
