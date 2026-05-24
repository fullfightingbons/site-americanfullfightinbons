-- Migration 0006 : correction de l'URL Google Maps embed invalide
-- L'ancienne valeur utilisait ?output=embed (non embed valide).
-- Remplacement par une URL embed correcte pour le gymnase de Bons-en-Chablais.
UPDATE site_settings
SET value = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2762.0!2d6.3667!3d46.2833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c1a0000000001%3A0x0!2sGymnase%20Intercommunal%20des%20Voirons%2C%2074890%20Bons-en-Chablais!5e0!3m2!1sfr!2sfr!4v1'
WHERE key = 'contact_map_embed_url'
  AND value NOT LIKE 'https://www.google.com/maps/embed%';
