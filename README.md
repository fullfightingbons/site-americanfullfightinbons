# site-americanfullfightinbons

Site public pour l'American Full Fighting Bons en Chablais, pensé pour Cloudflare Workers + D1.

## Stack

- Cloudflare Workers
- D1 pour le contenu éditorial et les messages de contact
- HTML/CSS/JS statiques servis par le Worker
- Sessions HMAC-SHA256 signées, stockées en cookie HttpOnly

## Endpoints

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/contact`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/auth/password`
- `GET /api/admin/bootstrap`
- `POST /api/admin/content`

## Démarrage

1. Installer les dépendances :

```bash
npm install
```

2. Générer les types Cloudflare :

```bash
npm run cf-typegen
```

3. Appliquer les migrations locales :

```bash
npm run seedLocalD1
```

4. Lancer le projet :

```bash
npm run dev
```

> En local, `ENV=dev` est déjà défini dans `wrangler.json` (section `vars`).  
> Le cookie de session ne portera pas le flag `Secure`, ce qui permet de tester l'admin sur HTTP.

## Déploiement

1. Créer la base D1 si elle n'existe pas encore :

```bash
wrangler d1 create site-americanfullfightinbons
```

2. Remplacer `database_id` dans `wrangler.json` si nécessaire.

3. Ajouter les secrets obligatoires :

```bash
# Chaîne aléatoire ≥ 32 caractères — INDISPENSABLE pour que l'admin fonctionne
wrangler secret put SESSION_SECRET

# Clé API Brevo pour l'envoi des e-mails de contact
wrangler secret put BREVO_API_KEY
```

4. Supprimer ou changer `ENV` dans les `vars` de `wrangler.json` pour la production  
   (retirer `"ENV": "dev"` pour activer le flag `Secure` sur le cookie de session).

5. Appliquer les migrations distantes :

```bash
wrangler d1 migrations apply DB --remote
```

6. Déployer :

```bash
npm run deploy
```

## Notes de sécurité

- Le endpoint `/api/auth/login` est limité à **10 tentatives / 15 min par IP** (in-memory).  
  Pour une protection renforcée en production, ajouter une Cloudflare Rate Limiting Rule sur `/api/auth/login`.
- L'upload d'images (`/api/admin/upload`) n'est pas encore implémenté.  
  Pour ajouter une image, collez directement une URL dans le champ correspondant de l'admin.
- Le contenu initial est inspiré du site public `americanfullfightingbons.fr`.
- Le site reste éditable via D1 sans modifier le front.
