-- Migration 0005 : conversion des PK INTEGER AUTOINCREMENT → TEXT
-- pour permettre l'insertion d'UUIDs depuis l'interface d'administration.
-- Les données existantes sont préservées via INSERT OR IGNORE.

-- schedule_slots
CREATE TABLE IF NOT EXISTS schedule_slots_new (
  id TEXT PRIMARY KEY,
  day_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO schedule_slots_new (id, day_label, time_label, note, display_order)
  SELECT CAST(id AS TEXT), day_label, time_label, note, display_order FROM schedule_slots;
DROP TABLE schedule_slots;
ALTER TABLE schedule_slots_new RENAME TO schedule_slots;

-- team_members
CREATE TABLE IF NOT EXISTS team_members_new (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  role_label TEXT NOT NULL,
  belt_label TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO team_members_new (id, full_name, role_label, belt_label, bio, display_order)
  SELECT CAST(id AS TEXT), full_name, role_label, belt_label, bio, display_order FROM team_members;
DROP TABLE team_members;
ALTER TABLE team_members_new RENAME TO team_members;

-- highlights
CREATE TABLE IF NOT EXISTS highlights_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO highlights_new (id, title, body, badge, cta_label, cta_href, display_order)
  SELECT CAST(id AS TEXT), title, body, badge, cta_label, cta_href, display_order FROM highlights;
DROP TABLE highlights;
ALTER TABLE highlights_new RENAME TO highlights;

-- gallery_items
CREATE TABLE IF NOT EXISTS gallery_items_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO gallery_items_new (id, title, image_url, alt_text, display_order)
  SELECT CAST(id AS TEXT), title, image_url, alt_text, display_order FROM gallery_items;
DROP TABLE gallery_items;
ALTER TABLE gallery_items_new RENAME TO gallery_items;

-- partner_links
CREATE TABLE IF NOT EXISTS partner_links_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO partner_links_new (id, title, href, cta_label, description, display_order)
  SELECT CAST(id AS TEXT), title, href, cta_label, description, display_order FROM partner_links;
DROP TABLE partner_links;
ALTER TABLE partner_links_new RENAME TO partner_links;

-- landing_sections (was already INTEGER, convert for consistency with UUID admin inserts)
CREATE TABLE IF NOT EXISTS landing_sections_new (
  id TEXT PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO landing_sections_new (id, section_key, title, subtitle, enabled, display_order)
  SELECT CAST(id AS TEXT), section_key, title, subtitle, enabled, display_order FROM landing_sections;
DROP TABLE landing_sections;
ALTER TABLE landing_sections_new RENAME TO landing_sections;

-- pricing_plans
CREATE TABLE IF NOT EXISTS pricing_plans_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price_label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO pricing_plans_new (id, title, price_label, description, badge, display_order)
  SELECT CAST(id AS TEXT), title, price_label, description, badge, display_order FROM pricing_plans;
DROP TABLE pricing_plans;
ALTER TABLE pricing_plans_new RENAME TO pricing_plans;
