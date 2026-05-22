interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  AFFBC_DB?: D1Database;
  SITE_NAME?: string;
  CONTACT_EMAIL?: string;
  CONTACT_PHONE?: string;
  CONTACT_ADDRESS?: string;
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
    allowedColumns: ["id", "title", "href", "description", "display_order"],
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
    hero_kicker: settings.hero_kicker || "",
    hero_title: settings.hero_title || "",
    hero_body: settings.hero_body || "",
    announcement_badge: settings.announcement_badge || "",
    announcement_title: settings.announcement_title || "",
    announcement_body: settings.announcement_body || "",
    contact_email: settings.contact_email || env.CONTACT_EMAIL || "",
    contact_phone: settings.contact_phone || env.CONTACT_PHONE || "",
    contact_address: settings.contact_address || env.CONTACT_ADDRESS || "",
    club_story: settings.club_story || "",
    hero_primary_label: settings.hero_primary_label || "Préinscription",
    hero_primary_href: settings.hero_primary_href || "https://inscription.americanfullfightingbons.fr/",
    hero_secondary_label: settings.hero_secondary_label || "Voir le calendrier",
    hero_secondary_href: settings.hero_secondary_href || "https://calendrier.americanfullfightingbons.fr/",
    footer_note: settings.footer_note || "American Full Fighting Bons en Chablais",
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
      price_label: `${Number(map.public_inscription_tarif_base || 250)} EUR`,
      description: "Synchronisé depuis la base du site de gestion.",
      badge: "Source gestion",
      display_order: 1,
    },
    {
      id: "shared-family",
      title: "Tarif famille",
      price_label: `${Number(map.public_inscription_tarif_famille || 200)} EUR`,
      description: "Applicable selon les règles définies dans l'inscription.",
      badge: "Source gestion",
      display_order: 2,
    },
    {
      id: "shared-pro",
      title: "Tarif professionnel",
      price_label: `${Number(map.public_inscription_tarif_pro || 125)} EUR`,
      description: "Forces de l'ordre, pompiers, sécurité et assimilés sur justificatif.",
      badge: "Source gestion",
      display_order: 3,
    },
    {
      id: "shared-pass",
      title: "Pass Région",
      price_label: `${Number(map.public_inscription_pass_region_homme || 30)} / ${Number(
        map.public_inscription_pass_region_femme || 60
      )} EUR`,
      description: "Réduction potentielle selon le profil déclaré.",
      badge: "Source gestion",
      display_order: 4,
    },
    {
      id: "shared-kit",
      title: "Tenue et passeport",
      price_label: `${Number(map.public_inscription_supplement_tenue || 40)} + ${Number(
        map.public_inscription_tarif_passeport || 25
      )} EUR`,
      description: "Suppléments synchronisés depuis la configuration d'inscription.",
      badge: "Source gestion",
      display_order: 5,
    },
  ];
}

async function getBootstrap(env: Env): Promise<Row> {
  const settings = publicResponseSettings(await readSettingsMap(env.DB), env);
  const [sections, schedule, team, highlights, gallery, links, fallbackPricing, sharedPricing] = await Promise.all([
    readTable(env.DB, "SELECT * FROM landing_sections ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM schedule_slots ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM team_members ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM highlights ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM gallery_items ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM partner_links ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM pricing_plans ORDER BY display_order, id"),
    readSharedPricing(env),
  ]);
  return {
    site: {
      name: settings.club_name,
      email: settings.contact_email,
      phone: settings.contact_phone,
      address: settings.contact_address,
      footerNote: settings.footer_note,
    },
    hero: {
      kicker: settings.hero_kicker,
      title: settings.hero_title,
      body: settings.hero_body,
      primaryLabel: settings.hero_primary_label,
      primaryHref: settings.hero_primary_href,
      secondaryLabel: settings.hero_secondary_label,
      secondaryHref: settings.hero_secondary_href,
    },
    announcement: {
      badge: settings.announcement_badge,
      title: settings.announcement_title,
      body: settings.announcement_body,
    },
    story: settings.club_story,
    sections,
    schedule,
    team,
    highlights,
    gallery,
    links,
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

  if (action === "mark-message") {
    const id = payload.id;
    const status = sanitizeText(payload.status, 30);
    await env.DB.prepare("UPDATE contact_messages SET status = ? WHERE id = ?").bind(status, id).run();
    return ok({ saved: true });
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
