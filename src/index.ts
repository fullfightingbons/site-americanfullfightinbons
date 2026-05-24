interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  AFFBC_DB?: D1Database;
  SITE_NAME?: string;
  CONTACT_EMAIL?: string;
  CONTACT_PHONE?: string;
  CONTACT_ADDRESS?: string;
  CONTACT_FORM_FROM_EMAIL?: string;
  CONTACT_FORM_TO_EMAIL?: string;
  BREVO_API_KEY?: string;
  SESSION_SECRET?: string;
}

type Row = Record<string, unknown>;

const SESSION_COOKIE = "affbc_site_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
const MAX_PBKDF2_ITERATIONS = 100000;
const PUBLIC_TABLES = new Set([
  "site_settings",
  "landing_sections",
  "schedule_slots",
  "team_members",
  "highlights",
  "gallery_items",
  "partner_links",
  "pricing_plans",
  "resource_cards",
  "equipment_items",
]);

const EDITABLE_TABLES = {
  site_settings: { primaryKey: "key", allowedColumns: ["key", "value"] },
  landing_sections: {
    primaryKey: "id",
    allowedColumns: ["id", "section_key", "title", "subtitle", "enabled", "display_order"],
  },
  schedule_slots: {
    primaryKey: "id",
    allowedColumns: ["id", "day_label", "time_label", "note", "display_order"],
  },
  team_members: {
    primaryKey: "id",
    allowedColumns: ["id", "full_name", "role_label", "belt_label", "bio", "display_order"],
  },
  highlights: {
    primaryKey: "id",
    allowedColumns: ["id", "title", "body", "badge", "cta_label", "cta_href", "display_order"],
  },
  gallery_items: {
    primaryKey: "id",
    allowedColumns: ["id", "title", "image_url", "alt_text", "display_order"],
  },
  partner_links: {
    primaryKey: "id",
    allowedColumns: ["id", "title", "href", "description", "cta_label", "display_order"],
  },
  resource_cards: {
    primaryKey: "id",
    allowedColumns: ["id", "title", "description", "cta_label", "cta_href", "image_url", "display_order"],
  },
  equipment_items: {
    primaryKey: "id",
    allowedColumns: ["id", "title", "description", "cta_label", "cta_href", "image_url", "display_order"],
  },
  pricing_plans: {
    primaryKey: "id",
    allowedColumns: ["id", "title", "price_label", "description", "badge", "display_order"],
  },
  admin_users: {
    primaryKey: "id",
    allowedColumns: ["id", "display_name", "email", "password_hash", "active", "updated_at"],
  },
} as const;

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function withHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  headers.set("access-control-allow-headers", "Content-Type");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function ok(data: unknown, init: ResponseInit = {}): Response {
  return withHeaders(json({ ok: true, data }, init));
}

function error(message: string, status = 400): Response {
  return withHeaders(json({ ok: false, error: message }, { status }));
}

function parseCookies(request: Request): Record<string, string> {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(
    raw
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        if (idx < 0) return [part, ""];
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      })
  );
}

function quoteIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error(`Invalid identifier: ${value}`);
  return `"${value}"`;
}

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return atob(padded);
}

function bytesToBase64Url(value: Uint8Array | ArrayBuffer): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesFromBase64Url(value: string): Uint8Array {
  const binary = fromBase64Url(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function secureEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let delta = 0;
  for (let i = 0; i < left.length; i++) delta |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return delta === 0;
}

function getSessionSecret(env: Env): string {
  const secret = String(env.SESSION_SECRET || "");
  if (secret.length < 32) throw new Error("SESSION_SECRET missing or too short");
  return secret;
}

async function hmacSha256Base64Url(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(signature);
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, MAX_PBKDF2_ITERATIONS);
  return `${PASSWORD_HASH_PREFIX}$${MAX_PBKDF2_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

async function verifyPassword(password: string, storedPassword: unknown): Promise<boolean> {
  const stored = String(storedPassword || "").trim();
  if (!stored || !stored.startsWith(`${PASSWORD_HASH_PREFIX}$`)) return false;
  const [, iterationsRaw, saltRaw, hashRaw] = stored.split("$");
  const iterations = Number.parseInt(iterationsRaw || "", 10);
  if (!iterations || iterations > MAX_PBKDF2_ITERATIONS || !saltRaw || !hashRaw) return false;
  const derived = await derivePasswordHash(password, bytesFromBase64Url(saltRaw), iterations);
  return secureEquals(bytesToBase64Url(derived), hashRaw);
}

async function createSessionToken(payload: Record<string, unknown>, env: Env): Promise<string> {
  const serialized = toBase64Url(JSON.stringify(payload));
  const signature = await hmacSha256Base64Url(getSessionSecret(env), serialized);
  return `${serialized}.${signature}`;
}

async function parseSessionToken(token: string, env: Env): Promise<Record<string, unknown> | null> {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = await hmacSha256Base64Url(getSessionSecret(env), payload);
  if (!secureEquals(expected, signature)) return null;
  try {
    return JSON.parse(fromBase64Url(payload));
  } catch {
    return null;
  }
}

function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeDbValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function readTable<T = Row>(db: D1Database, sql: string, bindings: unknown[] = []): Promise<T[]> {
  const result = await db.prepare(sql).bind(...bindings).all<T>();
  return result.results ?? [];
}

async function readSettingsMap(db: D1Database): Promise<Record<string, string>> {
  const rows = await readTable<{ key: string; value: string }>(db, "SELECT key, value FROM site_settings ORDER BY key");
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

async function getCurrentUser(request: Request, env: Env): Promise<Row | null> {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const session = await parseSessionToken(token, env);
  if (!session || !session.userId || Number(session.expiresAt) < Date.now()) return null;
  return env.DB.prepare(
    "SELECT id, email, display_name, active, updated_at FROM admin_users WHERE id = ? AND active = 1"
  )
    .bind(session.userId)
    .first<Row>();
}

function publicResponseSettings(settings: Record<string, string>, env: Env): Record<string, string> {
  return {
    club_name: settings.club_name || env.SITE_NAME || "American Full Fighting Bons en Chablais",
    brand_primary: settings.brand_primary || "AMERICAN FULL FIGHTING",
    brand_secondary: settings.brand_secondary || "BONS EN CHABLAIS",
    site_ambient_image:
      settings.site_ambient_image ||
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
    nav_club_label: settings.nav_club_label || "Club",
    nav_schedule_label: settings.nav_schedule_label || "Séances",
    nav_pricing_label: settings.nav_pricing_label || "Tarifs",
    nav_contact_label: settings.nav_contact_label || "Contact",
    nav_inscription_label: settings.nav_inscription_label || "Inscription",
    nav_inscription_href: settings.nav_inscription_href || "https://inscription.americanfullfightingbons.fr/",
    nav_calendar_label: settings.nav_calendar_label || "Calendrier",
    nav_calendar_href: settings.nav_calendar_href || "https://calendrier.americanfullfightingbons.fr/",
    nav_shop_label: settings.nav_shop_label || "Boutique",
    nav_shop_href: settings.nav_shop_href || "https://boutique.americanfullfightingbons.fr/",
    quick_links_cta_label: settings.quick_links_cta_label || "Accéder",
    hero_kicker: settings.hero_kicker || "",
    hero_title: settings.hero_title || "",
    hero_body: settings.hero_body || "",
    hero_background_image:
      settings.hero_background_image ||
      "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1800&q=80",
    hero_link_inscription_label: settings.hero_link_inscription_label || "Site d'inscription",
    hero_link_inscription_href: settings.hero_link_inscription_href || "https://inscription.americanfullfightingbons.fr/",
    hero_link_calendar_label: settings.hero_link_calendar_label || "Site calendrier",
    hero_link_calendar_href: settings.hero_link_calendar_href || "https://calendrier.americanfullfightingbons.fr/",
    hero_link_shop_label: settings.hero_link_shop_label || "Boutique",
    hero_link_shop_href: settings.hero_link_shop_href || "https://boutique.americanfullfightingbons.fr/",
    announcement_badge: settings.announcement_badge || "",
    announcement_title: settings.announcement_title || "",
    announcement_body: settings.announcement_body || "",
    contact_email: settings.contact_email || env.CONTACT_EMAIL || "",
    contact_phone: settings.contact_phone || env.CONTACT_PHONE || "",
    contact_address: settings.contact_address || env.CONTACT_ADDRESS || "",
    club_story: settings.club_story || "",
    story_intro:
      settings.story_intro ||
      "American Full Fighting Bons en Chablais réunit apprentissage technique, intensité progressive et esprit de groupe dans une ambiance encadrée.",
    story_card_title: settings.story_card_title || "Le club",
    story_note_label: settings.story_note_label || "Repères",
    story_note_title: settings.story_note_title || "Pour qui ?",
    story_note_body:
      settings.story_note_body ||
      "Cours mixtes, progression suivie, objectifs clairs et séances pensées pour développer technique, condition physique et confiance.",
    hero_primary_label: settings.hero_primary_label || "Préinscription",
    hero_primary_href: settings.hero_primary_href || "https://inscription.americanfullfightingbons.fr/",
    hero_secondary_label: settings.hero_secondary_label || "Voir le calendrier",
    hero_secondary_href: settings.hero_secondary_href || "https://calendrier.americanfullfightingbons.fr/",
    footer_note: settings.footer_note || "American Full Fighting Bons en Chablais",
    spotlight_date: settings.spotlight_date || "",
    spotlight_title: settings.spotlight_title || "",
    spotlight_body: settings.spotlight_body || "",
    spotlight_intro:
      settings.spotlight_intro ||
      "Les rendez-vous importants de la saison sont mis en avant ici pour rester visibles au premier coup d'oeil.",
    spotlight_background_image:
      settings.spotlight_background_image ||
      "https://images.unsplash.com/photo-1517438984742-1262db08379e?auto=format&fit=crop&w=1800&q=80",
    spotlight_cta_label: settings.spotlight_cta_label || "Voir le calendrier",
    spotlight_cta_href: settings.spotlight_cta_href || "https://calendrier.americanfullfightingbons.fr/",
    spotlight_secondary_label: settings.spotlight_secondary_label || "Dossier d'inscription",
    spotlight_secondary_href: settings.spotlight_secondary_href || "https://inscription.americanfullfightingbons.fr/",
    gallery_intro:
      settings.gallery_intro ||
      "Une sélection d'images pour retrouver l'énergie du club, le rythme des séances et les temps forts de la saison.",
    resources_intro: settings.resources_intro || "",
    equipment_intro: settings.equipment_intro || "",
    schedule_intro:
      settings.schedule_intro ||
      "Des créneaux réguliers pour installer de bons repères techniques et physiques tout au long de la semaine.",
    team_intro:
      settings.team_intro ||
      "Un encadrement identifié, présent sur les séances et engagé dans la progression de chaque pratiquant.",
    pricing_intro_synced: settings.pricing_intro_synced || "Tarifs alignés avec l'inscription en ligne.",
    pricing_intro_local: settings.pricing_intro_local || "Tarifs actuellement affichés par le club.",
    highlights_intro:
      settings.highlights_intro ||
      "Stages, matériel, progression et moments clés de la saison restent accessibles sans alourdir la navigation.",
    sponsor_title: settings.sponsor_title || "Devenez notre mécène",
    sponsor_intro:
      settings.sponsor_intro ||
      "Le soutien des adhérents, proches et partenaires aide le club à mieux équiper ses pratiquants et à accompagner ses projets.",
    sponsor_body: settings.sponsor_body || "",
    sponsor_cta_label: settings.sponsor_cta_label || "Faire un don",
    sponsor_cta_href: settings.sponsor_cta_href || "mailto:fullfightingbons@gmail.com",
    contact_intro:
      settings.contact_intro ||
      "Pour une question, une séance d'essai ou une demande sur la saison, le club peut être joint directement ici.",
    contact_map_embed_url:
      settings.contact_map_embed_url ||
      "https://www.google.com/maps?q=Gymnase%20Intercommunal%20des%20Voirons%2C%2074890%20Bons-en-Chablais&z=15&output=embed",
    contact_details_title: settings.contact_details_title || "Coordonnées",
    contact_email_title: settings.contact_email_title || "E-mail",
    contact_phone_title: settings.contact_phone_title || "Téléphone",
    contact_address_title: settings.contact_address_title || "Adresse",
    contact_form_title: settings.contact_form_title || "Envoyer un message",
    contact_name_label: settings.contact_name_label || "Nom",
    contact_email_label: settings.contact_email_label || "E-mail",
    contact_phone_label: settings.contact_phone_label || "Téléphone",
    contact_message_label: settings.contact_message_label || "Message",
    contact_submit_label: settings.contact_submit_label || "Envoyer",
    inpi_note: settings.inpi_note || "",
  };
}

async function readSharedPricing(env: Env): Promise<Row[]> {
  if (!env.AFFBC_DB) return [];
  const keys = [
    "public_inscription_tarif_base",
    "public_inscription_tarif_famille",
    "public_inscription_tarif_pro",
    "public_inscription_pass_region_homme",
    "public_inscription_pass_region_femme",
    "public_inscription_supplement_tenue",
    "public_inscription_tarif_passeport",
  ];
  const placeholders = keys.map(() => "?").join(", ");
  const rows = await readTable<{ cle: string; valeur: string }>(
    env.AFFBC_DB,
    `SELECT cle, valeur FROM club_info WHERE cle IN (${placeholders})`,
    keys
  );
  const map = Object.fromEntries(rows.map((row) => [row.cle, row.valeur]));
  return [
    {
      id: "shared-base",
      title: "Tarif de base",
      price_label: `${Number(map.public_inscription_tarif_base || 250)} €`,
      description: "Cotisation annuelle pour les cours du club.",
      badge: "Saison",
      display_order: 1,
    },
    {
      id: "shared-family",
      title: "Tarif famille",
      price_label: `${Number(map.public_inscription_tarif_famille || 200)} €`,
      description: "Tarif appliqué selon les conditions prévues pour les familles.",
      badge: "Réduction",
      display_order: 2,
    },
    {
      id: "shared-pro",
      title: "Tarif professionnel",
      price_label: `${Number(map.public_inscription_tarif_pro || 125)} €`,
      description: "Forces de l'ordre, pompiers, sécurité et assimilés sur justificatif.",
      badge: "Justificatif",
      display_order: 3,
    },
    {
      id: "shared-pass",
      title: "Pass Région",
      price_label: `${Number(map.public_inscription_pass_region_homme || 30)} € / ${Number(
        map.public_inscription_pass_region_femme || 60
      )} €`,
      description: "Aide possible selon la situation déclarée lors de l'inscription.",
      badge: "Aide",
      display_order: 4,
    },
    {
      id: "shared-kit",
      title: "Tenue et passeport",
      price_label: `${Number(map.public_inscription_supplement_tenue || 40)} € + ${Number(
        map.public_inscription_tarif_passeport || 25
      )} €`,
      description: "Éléments complémentaires selon les besoins de la saison.",
      badge: "Complément",
      display_order: 5,
    },
  ];
}

async function getBootstrap(env: Env): Promise<Row> {
  const settings = publicResponseSettings(await readSettingsMap(env.DB), env);
  const [sections, schedule, team, highlights, gallery, links, resources, equipment, fallbackPricing, sharedPricing] = await Promise.all([
    readTable(env.DB, "SELECT * FROM landing_sections ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM schedule_slots ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM team_members ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM highlights ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM gallery_items ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM partner_links ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM resource_cards ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM equipment_items ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM pricing_plans ORDER BY display_order, id"),
    readSharedPricing(env),
  ]);
  return {
    site: {
      name: settings.club_name,
      brandPrimary: settings.brand_primary,
      brandSecondary: settings.brand_secondary,
      email: settings.contact_email,
      phone: settings.contact_phone,
      address: settings.contact_address,
      footerNote: settings.footer_note,
    },
    navigation: {
      clubLabel: settings.nav_club_label,
      scheduleLabel: settings.nav_schedule_label,
      pricingLabel: settings.nav_pricing_label,
      contactLabel: settings.nav_contact_label,
      inscriptionLabel: settings.nav_inscription_label,
      inscriptionHref: settings.nav_inscription_href,
      calendarLabel: settings.nav_calendar_label,
      calendarHref: settings.nav_calendar_href,
      shopLabel: settings.nav_shop_label,
      shopHref: settings.nav_shop_href,
    },
    labels: {
      quickLinkCta: settings.quick_links_cta_label,
      contactEmailTitle: settings.contact_email_title,
      contactPhoneTitle: settings.contact_phone_title,
      contactAddressTitle: settings.contact_address_title,
    },
    design: {
      siteAmbientImage: settings.site_ambient_image,
      heroBackgroundImage: settings.hero_background_image,
      spotlightBackgroundImage: settings.spotlight_background_image,
    },
    hero: {
      kicker: settings.hero_kicker,
      title: settings.hero_title,
      body: settings.hero_body,
      primaryLabel: settings.hero_primary_label,
      primaryHref: settings.hero_primary_href,
      secondaryLabel: settings.hero_secondary_label,
      secondaryHref: settings.hero_secondary_href,
      utilityLinks: [
        { label: settings.hero_link_inscription_label, href: settings.hero_link_inscription_href },
        { label: settings.hero_link_calendar_label, href: settings.hero_link_calendar_href },
        { label: settings.hero_link_shop_label, href: settings.hero_link_shop_href },
      ],
    },
    announcement: {
      badge: settings.announcement_badge,
      title: settings.announcement_title,
      body: settings.announcement_body,
    },
    story: settings.club_story,
    storyPanel: {
      intro: settings.story_intro,
      cardTitle: settings.story_card_title,
      noteLabel: settings.story_note_label,
      noteTitle: settings.story_note_title,
      noteBody: settings.story_note_body,
    },
    spotlight: {
      intro: settings.spotlight_intro,
      date: settings.spotlight_date,
      title: settings.spotlight_title,
      body: settings.spotlight_body,
      primaryLabel: settings.spotlight_cta_label,
      primaryHref: settings.spotlight_cta_href,
      secondaryLabel: settings.spotlight_secondary_label,
      secondaryHref: settings.spotlight_secondary_href,
    },
    galleryIntro: settings.gallery_intro,
    resourcesIntro: settings.resources_intro,
    equipmentIntro: settings.equipment_intro,
    scheduleIntro: settings.schedule_intro,
    teamIntro: settings.team_intro,
    pricingIntroSynced: settings.pricing_intro_synced,
    pricingIntroLocal: settings.pricing_intro_local,
    highlightsIntro: settings.highlights_intro,
    sponsor: {
      intro: settings.sponsor_intro,
      title: settings.sponsor_title,
      body: settings.sponsor_body,
      ctaLabel: settings.sponsor_cta_label,
      ctaHref: settings.sponsor_cta_href,
    },
    contactIntro: settings.contact_intro,
    contactForm: {
      mapEmbedUrl: settings.contact_map_embed_url,
      detailsTitle: settings.contact_details_title,
      formTitle: settings.contact_form_title,
      nameLabel: settings.contact_name_label,
      emailLabel: settings.contact_email_label,
      phoneLabel: settings.contact_phone_label,
      messageLabel: settings.contact_message_label,
      submitLabel: settings.contact_submit_label,
    },
    inpiNote: settings.inpi_note,
    sections,
    schedule,
    team,
    highlights,
    gallery,
    links,
    resources,
    equipment,
    pricing: sharedPricing.length ? sharedPricing : fallbackPricing,
    pricingSource: sharedPricing.length ? "gestion" : "local",
  };
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return error("Le contenu doit être envoyé en JSON.");
  const body = (await request.json()) as Row;
  const fullName = sanitizeText(body.fullName, 120);
  const email = sanitizeText(body.email, 180);
  const phone = sanitizeText(body.phone, 40);
  const message = sanitizeText(body.message, 2500);
  const website = sanitizeText(body.website, 120);
  if (website) return ok({ spam: true });
  if (fullName.length < 3) return error("Le nom est trop court.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Adresse e-mail invalide.");
  if (message.length < 10) return error("Le message est trop court.");

  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const ua = sanitizeText(request.headers.get("user-agent"), 255);
  const ipHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const ipHash = [...new Uint8Array(ipHashBuffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  await env.DB.prepare(
    `INSERT INTO contact_messages (full_name, email, phone, message, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(fullName, email, phone, message, ipHash, ua)
    .run();

  const brevoKey = sanitizeText(env.BREVO_API_KEY, 300);
  const fromEmail = sanitizeText(env.CONTACT_FORM_FROM_EMAIL, 180) || "contact@americanfullfightingbons.fr";
  const toEmail = sanitizeText(env.CONTACT_FORM_TO_EMAIL, 180) || sanitizeText(env.CONTACT_EMAIL, 180) || "fullfightingbons@gmail.com";
  if (brevoKey) {
    const clubName = sanitizeText(env.SITE_NAME, 120) || "American Full Fighting Bons en Chablais";
    const phoneLine = phone ? `Téléphone : ${phone}\n` : "";
    const emailPayload = {
      sender: { email: fromEmail, name: clubName },
      to: [{ email: toEmail, name: clubName }],
      replyTo: { email, name: fullName },
      subject: `[Contact site] ${fullName}`,
      textContent:
        `Nouveau message depuis le site ${clubName}\n\n` +
        `Nom : ${fullName}\n` +
        `E-mail : ${email}\n` +
        phoneLine +
        `Message :\n${message}\n`,
      htmlContent:
        `<p><strong>Nouveau message depuis le site ${escapeHtmlText(clubName)}</strong></p>` +
        `<p><strong>Nom :</strong> ${escapeHtmlText(fullName)}<br>` +
        `<strong>E-mail :</strong> ${escapeHtmlText(email)}<br>` +
        `${phone ? `<strong>Téléphone :</strong> ${escapeHtmlText(phone)}<br>` : ""}` +
        `</p><p><strong>Message :</strong></p><p>${escapeHtmlText(message).replace(/\n/g, "<br>")}</p>`,
    };

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": brevoKey,
      },
      body: JSON.stringify(emailPayload),
    });
    if (!brevoResponse.ok) {
      const details = await brevoResponse.text();
      console.error("Brevo send failed", brevoResponse.status, details);
    }
  }

  return ok({ message: "Votre message a bien été enregistré. Nous vous recontacterons rapidement." });
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const payload = (await request.json()) as Row;
  const email = sanitizeText(payload.email, 190).toLowerCase();
  const password = String(payload.password || "");
  if (!email || !password) return error("Email et mot de passe requis.");
  const user = await env.DB.prepare(
    "SELECT * FROM admin_users WHERE email = ? AND active = 1 LIMIT 1"
  )
    .bind(email)
    .first<Row>();
  if (!user) return error("Identifiants invalides.", 401);
  if (!(await verifyPassword(password, user.password_hash))) return error("Identifiants invalides.", 401);

  const token = await createSessionToken(
    { userId: String(user.id), expiresAt: Date.now() + SESSION_TTL_MS },
    env
  );
  const response = ok({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    },
  });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000
    )}; SameSite=Lax; Secure`
  );
  return response;
}

async function handleSession(request: Request, env: Env): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return error("Unauthorized", 401);
  return ok({ user });
}

async function handleLogout(): Promise<Response> {
  const response = ok({ done: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`
  );
  return response;
}

async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  const user = await getCurrentUser(request, env);
  if (!user) return error("Unauthorized", 401);
  const payload = (await request.json()) as Row;
  const currentPassword = String(payload.currentPassword || "");
  const nextPassword = String(payload.nextPassword || "");
  if (!currentPassword || !nextPassword) return error("Mot de passe actuel et nouveau requis.");
  if (nextPassword.length < 8) return error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
  const fullUser = await env.DB.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").bind(user.id).first<Row>();
  if (!fullUser || !(await verifyPassword(currentPassword, fullUser.password_hash))) {
    return error("Mot de passe actuel incorrect.", 401);
  }
  const nextHash = await hashPassword(nextPassword);
  await env.DB.prepare(
    "UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?"
  )
    .bind(nextHash, user.id)
    .run();
  return ok({ done: true });
}

async function requireAdmin(request: Request, env: Env): Promise<Row> {
  const user = await getCurrentUser(request, env);
  if (!user) throw new Error("Unauthorized");
  return user;
}

function sanitizeEditableValues(table: keyof typeof EDITABLE_TABLES, input: Row): Row {
  const config = EDITABLE_TABLES[table];
  const next: Row = {};
  for (const key of config.allowedColumns) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      next[key] = normalizeDbValue(input[key]);
    }
  }
  return next;
}

async function adminBootstrap(request: Request, env: Env): Promise<Response> {
  const user = await requireAdmin(request, env);
  const [bootstrap, messages] = await Promise.all([
    getBootstrap(env),
    readTable(env.DB, "SELECT id, full_name, email, phone, message, status, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 50"),
  ]);
  return ok({
    user,
    ...bootstrap,
    messages,
  });
}

async function handleAdminSave(request: Request, env: Env): Promise<Response> {
  await requireAdmin(request, env);
  const payload = (await request.json()) as Row;
  const table = String(payload.table || "") as keyof typeof EDITABLE_TABLES;
  const action = String(payload.action || "");

  // Traitement mark-message en priorité (pas de table nécessaire)
  if (action === "mark-message") {
    const id = payload.id;
    const status = sanitizeText(payload.status, 30);
    if (!id) return error("Identifiant requis.");
    const allowedStatuses = ["new", "read", "done"];
    if (!allowedStatuses.includes(status)) return error("Statut invalide.");
    await env.DB.prepare("UPDATE contact_messages SET status = ? WHERE id = ?").bind(status, id).run();
    return ok({ saved: true });
  }

  if (!table || !Object.prototype.hasOwnProperty.call(EDITABLE_TABLES, table)) return error("Table non autorisée.", 400);

  if (action === "upsert") {
    const values = sanitizeEditableValues(table, (payload.values || {}) as Row);
    const config = EDITABLE_TABLES[table];
    const columns = Object.keys(values);
    if (!columns.length) return error("Aucune valeur à enregistrer.");
    const bindings = columns.map((column) => values[column]);
    const quotedColumns = columns.map((column) => quoteIdentifier(column)).join(", ");
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns
      .filter((column) => column !== config.primaryKey)
      .map((column) => `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`)
      .join(", ");
    await env.DB.prepare(
      `INSERT INTO ${quoteIdentifier(table)} (${quotedColumns}) VALUES (${placeholders})
       ON CONFLICT(${quoteIdentifier(config.primaryKey)}) DO UPDATE SET ${updates}`
    )
      .bind(...bindings)
      .run();
    return ok({ saved: true });
  }

  if (action === "delete") {
    const id = payload.id;
    if (id === undefined || id === null || id === "") return error("Identifiant requis.");
    const config = EDITABLE_TABLES[table];
    await env.DB.prepare(
      `DELETE FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(config.primaryKey)} = ?`
    )
      .bind(id)
      .run();
    return ok({ deleted: true });
  }

  return error("Action non supportée.");
}

async function routeApi(request: Request, env: Env, pathname: string): Promise<Response> {
  if (request.method === "OPTIONS") return withHeaders(new Response(null, { status: 204 }));

  if (pathname === "/api/health" && request.method === "GET") {
    return ok({ date: new Date().toISOString() });
  }
  if (pathname === "/api/bootstrap" && request.method === "GET") {
    return ok(await getBootstrap(env));
  }
  if (pathname === "/api/contact" && request.method === "POST") {
    return handleContact(request, env);
  }
  if (pathname === "/api/auth/login" && request.method === "POST") {
    return handleLogin(request, env);
  }
  if (pathname === "/api/auth/session" && request.method === "GET") {
    return handleSession(request, env);
  }
  if (pathname === "/api/auth/logout" && request.method === "POST") {
    return handleLogout();
  }
  if (pathname === "/api/auth/password" && request.method === "POST") {
    return handleChangePassword(request, env);
  }
  if (pathname === "/api/admin/bootstrap" && request.method === "GET") {
    return adminBootstrap(request, env);
  }
  if (pathname === "/api/admin/content" && request.method === "POST") {
    return handleAdminSave(request, env);
  }

  return error("Not found", 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await routeApi(request, env, url.pathname);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Erreur interne";
        if (message === "Unauthorized") return error(message, 401);
        return error(message, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
