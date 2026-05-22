# site-americanfullfightinbons

Site public pour l'American Full Fighting Bons en Chablais, pensé pour Cloudflare Workers + D1.

## Stack

- Cloudflare Workers
- D1 pour le contenu éditorial et les messages de contact
- HTML/CSS/JS statiques servis par le Worker

## Endpoints

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/contact`

## Démarrage

1. Installer les dépendances:

```bash
npm install
```

2. Générer les types Cloudflare:

```bash
npm run cf-typegen
```

3. Appliquer les migrations locales:

```bash
npm run seedLocalD1
```

4. Lancer le projet:

```bash
npm run dev
```

## Déploiement

- Créer une base D1.
- Remplacer `database_id` dans [wrangler.json](/home/teddy/site-americanfullfightinbons/wrangler.json).
- Appliquer les migrations distantes:

```bash
wrangler d1 migrations apply DB --remote
```

- Déployer:

```bash
npm run deploy
```

## Notes

- Le contenu initial est inspiré du site public `americanfullfightingbons.fr` et des autres projets AFFBC déjà présents.
- Le site reste éditable via D1 sans devoir modifier le front pour chaque changement de texte ou de planning.
