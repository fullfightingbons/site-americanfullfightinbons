INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('theme_heading_font', '''Sora'', sans-serif'),
  ('theme_body_font', '''Inter'', sans-serif'),
  ('theme_nav_font', '''Inter'', sans-serif'),
  ('theme_button_font', '''Inter'', sans-serif'),
  ('theme_card_title_font', '''Sora'', sans-serif'),
  ('theme_card_body_font', '''Inter'', sans-serif');

UPDATE site_settings
SET value = CASE key
  WHEN 'theme_heading_font' THEN '''Sora'', sans-serif'
  WHEN 'theme_body_font' THEN '''Inter'', sans-serif'
  WHEN 'theme_nav_font' THEN '''Inter'', sans-serif'
  WHEN 'theme_button_font' THEN '''Inter'', sans-serif'
  WHEN 'theme_card_title_font' THEN '''Sora'', sans-serif'
  WHEN 'theme_card_body_font' THEN '''Inter'', sans-serif'
  ELSE value
END
WHERE key IN (
  'theme_heading_font',
  'theme_body_font',
  'theme_nav_font',
  'theme_button_font',
  'theme_card_title_font',
  'theme_card_body_font'
);
