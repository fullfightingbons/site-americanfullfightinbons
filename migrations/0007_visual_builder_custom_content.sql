CREATE TABLE IF NOT EXISTS custom_buttons (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  href TEXT NOT NULL DEFAULT '',
  placement TEXT NOT NULL DEFAULT 'hero',
  style TEXT NOT NULL DEFAULT 'red',
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS custom_blocks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  width_percent INTEGER NOT NULL DEFAULT 100,
  height_px INTEGER NOT NULL DEFAULT 360,
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO landing_sections (id, section_key, title, subtitle, enabled, display_order) VALUES
  ('section-custom', 'custom', 'Blocs personnalisés', 'Composez librement des fenêtres avec image, texte et bouton.', 1, 10);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('nav_club_enabled', '1'),
  ('nav_schedule_enabled', '1'),
  ('nav_pricing_enabled', '1'),
  ('nav_contact_enabled', '1'),
  ('nav_inscription_enabled', '1'),
  ('nav_calendar_enabled', '1'),
  ('nav_shop_enabled', '1'),
  ('hero_primary_enabled', '1'),
  ('hero_secondary_enabled', '1'),
  ('hero_link_inscription_enabled', '1'),
  ('hero_link_calendar_enabled', '1'),
  ('hero_link_shop_enabled', '1');
