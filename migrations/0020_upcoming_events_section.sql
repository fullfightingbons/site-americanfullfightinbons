-- Fait entrer "Prochainement au club" dans le système de sections du
-- Visual Builder (landing_sections), au même titre que "À la une", "Le
-- club", etc. Jusqu'ici cette section était codée en dur dans
-- public/index.html à une position fixe, avec un titre non modifiable :
-- impossible de la déplacer ou d'éditer son texte depuis l'admin.
--
-- display_order = 0 la place en tête des sections dynamiques (juste après
-- le bloc "Partenaires", qui reste fixe) afin de préserver au mieux sa
-- position actuelle ; réordonnable ensuite depuis le tableau de bord admin.
INSERT OR IGNORE INTO landing_sections (id, section_key, title, subtitle, enabled, display_order) VALUES
  ('section-upcoming-events', 'upcoming_events', 'Agenda du club', 'Prochainement au club', 1, 0);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('upcoming_events_cta_label', 'Voir tout le calendrier →'),
  ('upcoming_events_cta_href', 'https://calendrier.americanfullfightingbons.fr/');
