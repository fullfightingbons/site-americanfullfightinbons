ALTER TABLE partner_links ADD COLUMN cta_label TEXT NOT NULL DEFAULT '';

UPDATE partner_links
SET cta_label = CASE
  WHEN lower(title) LIKE '%inscription%' THEN 'Commencer'
  WHEN lower(title) LIKE '%calendrier%' THEN 'Consulter'
  WHEN lower(title) LIKE '%boutique%' THEN 'Explorer'
  ELSE 'Accéder'
END
WHERE trim(coalesce(cta_label, '')) = '';
