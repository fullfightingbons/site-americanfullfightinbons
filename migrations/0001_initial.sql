CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  role_label TEXT NOT NULL,
  belt_label TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price_label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS highlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partner_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  href TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);

INSERT OR REPLACE INTO site_settings (key, value) VALUES
  ('club_name', 'American Full Fighting Bons en Chablais'),
  ('hero_kicker', 'Boxe américaine, full contact et préparation martiale'),
  ('hero_title', 'Un club de combat structuré, exigeant et accueillant à Bons-en-Chablais.'),
  ('hero_body', 'Cours mixtes dès 13 ans, entraînements encadrés, stages techniques et vie associative active autour du full contact.'),
  ('announcement_badge', 'Saison 2025-2026'),
  ('announcement_title', 'Les inscriptions de la saison sont closes.'),
  ('announcement_body', 'Une séance d''essai reste possible pour découvrir la discipline et préparer la saison suivante.'),
  ('contact_email', 'fullfightingbons@gmail.com'),
  ('contact_phone', '0699958177'),
  ('contact_address', 'Gymnase Intercommunal des Voirons, 74890 Bons-en-Chablais'),
  ('club_story', 'Institué en 2024, le club transmet les fondamentaux du karaté full contact et de la boxe américaine avec un encadrement fédéral, une pratique exigeante et un esprit collectif.'),
  ('cta_primary_label', 'Préinscription'),
  ('cta_primary_href', 'https://inscription.americanfullfightingbons.fr/'),
  ('cta_secondary_label', 'Nous contacter'),
  ('cta_secondary_href', '#contact');

INSERT INTO schedule_slots (day_label, time_label, note, display_order) VALUES
  ('Lundi', '19h00 - 20h30', 'Présence demandée 15 minutes avant le cours.', 1),
  ('Mercredi', '20h30 - 22h30', 'Séance technique et intensité progressive.', 2),
  ('Vendredi', '20h30 - 22h30', 'Travail combat, rythme et condition physique.', 3);

INSERT INTO team_members (full_name, role_label, belt_label, bio, display_order) VALUES
  ('Serge Suivant', 'Coach, instructeur fédéral', 'Ceinture noire 3e degré', 'Direction sportive du club et encadrement technique principal.', 1),
  ('Laurine Marger', 'Assistante fédérale', 'Ceinture noire 1er degré', 'Encadrement et suivi de la progression des pratiquants.', 2),
  ('Laurent Grallien', 'Assistant fédéral', 'Ceinture marron', 'Soutien technique et accompagnement des séances.', 3),
  ('Pierre Bonvin', 'Assistant', 'Ceinture marron', 'Participation à l''encadrement collectif.', 4),
  ('Ronnie Vauchey', 'Assistant', 'Ceinture marron', 'Appui pédagogique pendant les entraînements.', 5),
  ('Azz-Eddine Fathouni', 'Assistant', 'Ceinture verte', 'Accompagnement des exercices techniques.', 6);

INSERT INTO pricing_plans (title, price_label, description, badge, display_order) VALUES
  ('Tarif de base', '250 EUR', 'Cours mixtes hommes et femmes dès 13 ans.', 'Licence incluse', 1),
  ('Tarif famille', '200 EUR', 'Applicable à partir de deux membres d''une même famille.', 'Réduction', 2),
  ('Tarif professionnel', '125 EUR', 'Forces de l''ordre, pompiers, agents de sécurité et assimilés sur justificatif.', 'Justificatif requis', 3),
  ('Pass Région', 'Aide possible', 'Réduction de 30 EUR ou 60 EUR selon profil éligible.', 'Selon conditions', 4);

INSERT INTO highlights (title, body, badge, cta_label, cta_href, display_order) VALUES
  ('Stages de perfectionnement', 'Le club invite régulièrement des champions et intervenants reconnus pour faire progresser les adhérents toute l''année.', 'Technique', 'Voir le calendrier', 'https://calendrier.americanfullfightingbons.fr/', 1),
  ('Boutique et équipement', 'Préparez votre saison avec l''équipement recommandé: gants, protections, tenue club et accessoires.', 'Pratique', 'Voir la boutique', 'https://boutique.americanfullfightingbons.fr/', 2),
  ('Passages de grade', 'Travaillez vos techniques et suivez votre progression avec une pratique structurée et des objectifs clairs.', 'Progression', 'Découvrir le club', '#club', 3);

INSERT INTO partner_links (title, href, description, display_order) VALUES
  ('Inscription', 'https://inscription.americanfullfightingbons.fr/', 'Accès au dossier et au parcours numérique.', 1),
  ('Calendrier', 'https://calendrier.americanfullfightingbons.fr/', 'Stages, événements et vie du club.', 2),
  ('Boutique', 'https://boutique.americanfullfightingbons.fr/', 'Équipement et textile recommandés.', 3),
  ('Gestion club', 'https://gestion.americanfullfightingbons.fr/', 'Accès aux outils internes.', 4);

INSERT INTO gallery_items (title, image_url, alt_text, display_order) VALUES
  ('Stage Christian Battesti', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80', 'Stage de full contact en salle', 1),
  ('Travail technique', 'https://images.unsplash.com/photo-1517438984742-1262db08379e?auto=format&fit=crop&w=1200&q=80', 'Entraînement en binôme', 2),
  ('Condition physique', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80', 'Préparation physique et cardio', 3),
  ('Ambiance club', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80', 'Groupe à l''entraînement', 4);
