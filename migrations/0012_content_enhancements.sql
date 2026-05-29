CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  date_label TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  image_fit TEXT NOT NULL DEFAULT 'cover',
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faq_items (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL DEFAULT '',
  role_label TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  image_fit TEXT NOT NULL DEFAULT 'cover',
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE custom_blocks ADD COLUMN image_fit TEXT NOT NULL DEFAULT 'cover';
ALTER TABLE resource_cards ADD COLUMN image_fit TEXT NOT NULL DEFAULT 'contain';
ALTER TABLE resource_cards ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE equipment_items ADD COLUMN image_fit TEXT NOT NULL DEFAULT 'cover';
ALTER TABLE equipment_items ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE sponsor_partners ADD COLUMN cta_label TEXT NOT NULL DEFAULT 'Voir le site';
ALTER TABLE sponsor_partners ADD COLUMN image_fit TEXT NOT NULL DEFAULT 'contain';
ALTER TABLE sponsor_partners ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO landing_sections (id, section_key, title, subtitle, enabled, display_order) VALUES
  ('section-news', 'news', 'Actualités', 'Les nouvelles du club.', 1, 5),
  ('section-faq', 'faq', 'FAQ', 'Questions fréquentes.', 1, 11),
  ('section-testimonials', 'testimonials', 'Avis', 'Ils parlent du club.', 1, 12);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('news_intro', 'Les informations récentes du club restent visibles ici.'),
  ('faq_intro', 'Les réponses aux questions les plus courantes avant de venir au club.'),
  ('testimonials_intro', 'Quelques retours de pratiquants et proches du club.');
