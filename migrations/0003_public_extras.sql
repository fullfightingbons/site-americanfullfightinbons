CREATE TABLE IF NOT EXISTS resource_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS equipment_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_href TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO landing_sections (section_key, title, subtitle, enabled, display_order) VALUES
  ('spotlight', 'À la une', 'Stage, actualité ou message fort du club.', 1, 1),
  ('resources', 'Membre actif', 'Comptes utiles, boutique et progression technique.', 1, 6),
  ('equipment', 'Équipement', 'Sélection d''articles et protections recommandés.', 1, 7),
  ('sponsor', 'Mécénat', 'Soutenir le club et ses combattants.', 1, 9);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('spotlight_date', 'Samedi 18 avril 2026'),
  ('spotlight_title', 'Stage Christian Battesti'),
  ('spotlight_body', 'Venez découvrir ou perfectionner votre technique lors d''un stage encadré par Christian Battesti, ancien officier du RAID, pionnier du full contact et multiple champion du monde. Tarif : 25 EUR.'),
  ('spotlight_cta_label', 'Voir le calendrier'),
  ('spotlight_cta_href', 'https://calendrier.americanfullfightingbons.fr/'),
  ('spotlight_secondary_label', 'Dossier d''inscription'),
  ('spotlight_secondary_href', 'https://inscription.americanfullfightingbons.fr/'),
  ('resources_intro', 'Accédez rapidement aux ressources les plus utiles du club.'),
  ('equipment_intro', 'Préparez-vous avec les protections et accessoires recommandés par le club.'),
  ('sponsor_title', 'Devenez notre mécène'),
  ('sponsor_body', 'Que vous soyez adhérent, entreprise ou amateur de la discipline, votre soutien nous aide à proposer de meilleurs équipements et à soutenir nos combattants. Un reçu peut permettre une déduction allant jusqu''à 66% du montant du don, dans les limites prévues par la loi.'),
  ('sponsor_cta_label', 'Faire un don'),
  ('sponsor_cta_href', 'mailto:fullfightingbons@gmail.com?subject=Demande%20de%20mecenat%20AFFBC'),
  ('inpi_note', 'Logo déposé INPI 20243002');

INSERT OR IGNORE INTO resource_cards (id, title, description, cta_label, cta_href, image_url, display_order) VALUES
  ('resource-decathlon', 'Créez votre compte Décathlon', 'Préparez vos commandes et vos achats partenaires.', 'Création de compte', 'https://www.decathlon.fr/', '', 1),
  ('resource-boutique', 'N''oubliez pas de visiter notre boutique', 'Retrouvez les produits et équipements utiles pour la saison.', 'Boutique', 'https://boutique.americanfullfightingbons.fr/', '', 2),
  ('resource-techniques', 'Préparez-vous pour votre passage de grade', 'Consultez la liste des techniques et repères de progression.', 'Liste des techniques', 'https://gestion.americanfullfightingbons.fr/', '', 3);

INSERT OR IGNORE INTO equipment_items (id, title, description, cta_label, cta_href, image_url, display_order) VALUES
  ('equip-sac', 'Sac de sport', 'Transportez votre équipement de manière dédiée.', 'Voir', 'https://boutique.americanfullfightingbons.fr/', '', 1),
  ('equip-gants', 'Gants de boxe', 'Équipement de base pour les séances techniques et de combat.', 'Voir', 'https://boutique.americanfullfightingbons.fr/', '', 2),
  ('equip-sous-gants', 'Sous-gants', 'Confort et hygiène pendant l''entraînement.', 'Voir', 'https://boutique.americanfullfightingbons.fr/', '', 3),
  ('equip-protege', 'Protège tibia / pieds', 'Protection recommandée pour le travail jambes et déplacements.', 'Voir', 'https://boutique.americanfullfightingbons.fr/', '', 4),
  ('equip-casque', 'Casque de protection', 'Sécurité renforcée pour le sparring.', 'Voir', 'https://boutique.americanfullfightingbons.fr/', '', 5),
  ('equip-dent', 'Protège-dents', 'Indispensable pour les phases d''opposition.', 'Voir', 'https://boutique.americanfullfightingbons.fr/', '', 6);
