-- Ajoute le lien "Espace membre" à la navigation, sur le même modèle que
-- inscription/calendrier/boutique (label + href + activation éditables
-- depuis l'admin). Désactivable si le nouveau site n'est pas encore prêt à
-- être annoncé publiquement, sans avoir à retoucher le code.
INSERT OR REPLACE INTO site_settings (key, value) VALUES
  ('nav_membre_label', 'Espace membre'),
  ('nav_membre_href', 'https://espace-membre.americanfullfightingbons.fr/'),
  ('nav_membre_enabled', '1');
