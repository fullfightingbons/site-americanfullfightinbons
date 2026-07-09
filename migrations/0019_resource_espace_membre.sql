-- La carte ressource "resource-techniques" pointait vers
-- gestion.americanfullfightingbons.fr — l'outil interne du bureau, jamais
-- pensé pour un accès public (pas de contenu "repères techniques" côté
-- gestion). On la fait pointer vers l'espace membre, qui correspond
-- réellement à ce que la carte annonce (suivre sa situation d'adhérent), et
-- on ajuste le libellé en conséquence.
UPDATE resource_cards
SET title = 'Mon espace membre',
    description = 'Cotisation, certificat médical, commandes et inscriptions aux stages : suivez votre dossier en ligne.',
    cta_label = 'Ouvrir l''espace membre',
    cta_href = 'https://espace-membre.americanfullfightingbons.fr/'
WHERE id = 'resource-techniques';
