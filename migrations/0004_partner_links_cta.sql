-- Rebuild instead of ALTER ADD COLUMN so this migration can run on databases
-- where cta_label was already introduced manually or by an interrupted run.
CREATE TABLE IF NOT EXISTS partner_links_cta_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO partner_links_cta_new (id, title, href, cta_label, description, display_order)
SELECT
  CAST(id AS TEXT),
  title,
  href,
  CASE
    WHEN lower(title) LIKE '%inscription%' THEN 'Commencer'
    WHEN lower(title) LIKE '%calendrier%' THEN 'Consulter'
    WHEN lower(title) LIKE '%boutique%' THEN 'Explorer'
    ELSE 'Accéder'
  END,
  description,
  display_order
FROM partner_links;

DROP TABLE partner_links;
ALTER TABLE partner_links_cta_new RENAME TO partner_links;

UPDATE partner_links
SET cta_label = CASE
  WHEN lower(title) LIKE '%inscription%' THEN 'Commencer'
  WHEN lower(title) LIKE '%calendrier%' THEN 'Consulter'
  WHEN lower(title) LIKE '%boutique%' THEN 'Explorer'
  ELSE 'Accéder'
END
WHERE trim(coalesce(cta_label, '')) = '';
