-- Nombre d'évènements affichés dans "Prochainement au club" (par défaut 1,
-- réglable depuis l'admin : Réglages → Prochainement au club).
INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('upcoming_events_limit', '1');
