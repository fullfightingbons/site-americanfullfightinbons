CREATE TABLE IF NOT EXISTS sponsor_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO landing_sections (id, section_key, title, subtitle, enabled, display_order) VALUES
  ('section-sponsors', 'sponsors', 'Sponsors', 'Ils soutiennent le club et ses projets.', 1, 8);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('sponsors_intro', 'Merci aux partenaires qui accompagnent le club et soutiennent ses projets.');
