interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SITE_NAME?: string;
  CONTACT_EMAIL?: string;
  CONTACT_PHONE?: string;
  CONTACT_ADDRESS?: string;
}

type JsonObject = Record<string, unknown>;

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function withCorsHeaders(response: Response): Response {
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

function badRequest(message: string, status = 400): Response {
  return withCorsHeaders(json({ ok: false, error: message }, { status }));
}

function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

async function readTable<T = JsonObject>(db: D1Database, sql: string): Promise<T[]> {
  const result = await db.prepare(sql).all<T>();
  return result.results ?? [];
}

async function getBootstrap(env: Env): Promise<JsonObject> {
  const [settingsRows, schedule, team, pricing, highlights, gallery, links] = await Promise.all([
    readTable<{ key: string; value: string }>(
      env.DB,
      "SELECT key, value FROM site_settings ORDER BY key"
    ),
    readTable(env.DB, "SELECT * FROM schedule_slots ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM team_members ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM pricing_plans ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM highlights ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM gallery_items ORDER BY display_order, id"),
    readTable(env.DB, "SELECT * FROM partner_links ORDER BY display_order, id"),
  ]);

  const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
  return {
    ok: true,
    site: {
      name: settings.club_name ?? env.SITE_NAME ?? "American Full Fighting Bons en Chablais",
      email: settings.contact_email ?? env.CONTACT_EMAIL ?? "",
      phone: settings.contact_phone ?? env.CONTACT_PHONE ?? "",
      address: settings.contact_address ?? env.CONTACT_ADDRESS ?? "",
    },
    hero: {
      kicker: settings.hero_kicker ?? "",
      title: settings.hero_title ?? "",
      body: settings.hero_body ?? "",
      ctaPrimaryLabel: settings.cta_primary_label ?? "Préinscription",
      ctaPrimaryHref: settings.cta_primary_href ?? "/inscription",
      ctaSecondaryLabel: settings.cta_secondary_label ?? "Contact",
      ctaSecondaryHref: settings.cta_secondary_href ?? "#contact",
    },
    announcement: {
      badge: settings.announcement_badge ?? "",
      title: settings.announcement_title ?? "",
      body: settings.announcement_body ?? "",
    },
    story: settings.club_story ?? "",
    schedule,
    team,
    pricing,
    highlights,
    gallery,
    links,
  };
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return badRequest("Le contenu doit être envoyé en JSON.");
  }

  const body = (await request.json()) as JsonObject;
  const fullName = sanitizeText(body.fullName, 120);
  const email = sanitizeText(body.email, 180);
  const phone = sanitizeText(body.phone, 40);
  const message = sanitizeText(body.message, 2500);
  const website = sanitizeText(body.website, 120);

  if (website) {
    return withCorsHeaders(json({ ok: true }));
  }
  if (fullName.length < 3) {
    return badRequest("Le nom est trop court.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Adresse e-mail invalide.");
  }
  if (message.length < 10) {
    return badRequest("Le message est trop court.");
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const ua = sanitizeText(request.headers.get("user-agent"), 255);
  const ipHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const ipHash = [...new Uint8Array(ipHashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  await env.DB.prepare(
    `INSERT INTO contact_messages (full_name, email, phone, message, ip_hash, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(fullName, email, phone, message, ipHash, ua)
    .run();

  return withCorsHeaders(
    json({
      ok: true,
      message: "Votre message a bien été enregistré. Nous vous recontacterons rapidement.",
    })
  );
}

async function routeApi(request: Request, env: Env, pathname: string): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCorsHeaders(new Response(null, { status: 204 }));
  }
  if (pathname === "/api/health" && request.method === "GET") {
    return withCorsHeaders(json({ ok: true, date: new Date().toISOString() }));
  }
  if (pathname === "/api/bootstrap" && request.method === "GET") {
    return withCorsHeaders(json(await getBootstrap(env)));
  }
  if (pathname === "/api/contact" && request.method === "POST") {
    return handleContact(request, env);
  }
  return withCorsHeaders(json({ ok: false, error: "Not found" }, { status: 404 }));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await routeApi(request, env, url.pathname);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur interne";
        return withCorsHeaders(json({ ok: false, error: message }, { status: 500 }));
      }
    }

    return env.ASSETS.fetch(request);
  },
};
