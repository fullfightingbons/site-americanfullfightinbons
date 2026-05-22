function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchBootstrap() {
  const response = await fetch("/api/bootstrap");
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Chargement impossible");
  return payload.data;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || "";
}

function setLink(id, label, href) {
  const element = document.getElementById(id);
  if (!element) return;
  if (label) element.textContent = label;
  if (href) element.href = href;
}

function renderTopLinks(links) {
  const host = document.getElementById("partner-links-top");
  host.innerHTML = links
    .map(
      (item) => `
      <article class="quick-link-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.description)}</p>
        <a href="${escapeHtml(item.href)}">Ouvrir</a>
      </article>
    `
    )
    .join("");
}

function renderStorySection(data, section) {
  return `
    <section id="club" class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Le club")}</div>
          <h2>${escapeHtml(section.subtitle || "Une identité plus claire, un site plus administrable.")}</h2>
        </div>
        <p>Le contenu éditorial et l'ordre des blocs se gèrent désormais depuis l'administration du site.</p>
      </div>
      <div class="story-grid">
        <article class="story-card">
          <h3>Le club</h3>
          <p>${escapeHtml(data.story)}</p>
        </article>
        <article class="story-card">
          <h3>Architecture</h3>
          <p>Site public sur Cloudflare Workers, base D1 locale pour les contenus et synchronisation des tarifs depuis la base de gestion AFFBC.</p>
        </article>
      </div>
    </section>
  `;
}

function renderScheduleSection(data, section) {
  return `
    <section id="planning" class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Planning")}</div>
          <h2>${escapeHtml(section.subtitle || "Entraînements hebdomadaires")}</h2>
        </div>
        <p>Trois créneaux lisibles, immédiatement visibles et modifiables depuis l'administration.</p>
      </div>
      <div class="schedule-grid">
        ${(data.schedule || [])
          .map(
            (item) => `
          <article class="schedule-card">
            <div class="meta">${escapeHtml(item.day_label)}</div>
            <h3>${escapeHtml(item.time_label)}</h3>
            <p>${escapeHtml(item.note)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTeamSection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Équipe")}</div>
          <h2>${escapeHtml(section.subtitle || "Encadrement et progression")}</h2>
        </div>
        <p>Les rôles et niveaux sont éditables, réordonnables et rendus de manière homogène sur la vitrine.</p>
      </div>
      <div class="team-grid">
        ${(data.team || [])
          .map(
            (item) => `
          <article class="team-card">
            <div class="meta">${escapeHtml(item.role_label)}</div>
            <h3>${escapeHtml(item.full_name)}</h3>
            <div class="belt">${escapeHtml(item.belt_label)}</div>
            <p>${escapeHtml(item.bio)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPricingSection(data, section) {
  const syncLabel = data.pricingSource === "gestion" ? "Tarifs synchronisés depuis le site de gestion" : "Tarifs locaux";
  return `
    <section id="tarifs" class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Tarifs")}</div>
          <h2>${escapeHtml(section.subtitle || "Informations financières alignées avec l'inscription")}</h2>
        </div>
        <p>${escapeHtml(syncLabel)}.</p>
      </div>
      <div class="pricing-grid">
        ${(data.pricing || [])
          .map(
            (item) => `
          <article class="pricing-card">
            <div class="meta">${escapeHtml(item.badge || "")}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <div class="price">${escapeHtml(item.price_label)}</div>
            <p>${escapeHtml(item.description)}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderHighlightsSection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Temps forts")}</div>
          <h2>${escapeHtml(section.subtitle || "Stages, équipement, progression")}</h2>
        </div>
        <p>Les liens vers l'inscription, la boutique et le calendrier restent visibles et exploitables.</p>
      </div>
      <div class="highlights-grid">
        ${(data.highlights || [])
          .map(
            (item) => `
          <article class="highlight-card">
            <div class="meta">${escapeHtml(item.badge || "")}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
            ${item.cta_href ? `<a class="btn btn-dark" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label || "Ouvrir")}</a>` : ""}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderGallerySection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Galerie")}</div>
          <h2>${escapeHtml(section.subtitle || "Visuels et ambiance du club")}</h2>
        </div>
        <p>Les médias restent modifiables depuis l'administration sans toucher au code.</p>
      </div>
      <div class="gallery-grid">
        ${(data.gallery || [])
          .map(
            (item) => `
          <article class="gallery-card">
            <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text || item.title)}" loading="lazy">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.alt_text || "")}</p>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderContactSection(data, section) {
  return `
    <section id="contact" class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Contact")}</div>
          <h2>${escapeHtml(section.subtitle || "Parler au club")}</h2>
        </div>
        <p>Le formulaire enregistre les messages en base et l'administration permet ensuite de les suivre.</p>
      </div>
      <div class="contact-wrap">
        <article class="contact-card">
          <h3>Coordonnées</h3>
          <p>${escapeHtml(data.site.name)}<br>${escapeHtml(data.site.address)}<br>${escapeHtml(data.site.email)}<br>${escapeHtml(data.site.phone)}</p>
          <div class="hero-links">
            <a class="utility-link" href="https://inscription.americanfullfightingbons.fr/">Inscription</a>
            <a class="utility-link" href="https://calendrier.americanfullfightingbons.fr/">Calendrier</a>
            <a class="utility-link" href="https://boutique.americanfullfightingbons.fr/">Boutique</a>
          </div>
        </article>
        <article class="contact-card">
          <h3>Envoyer un message</h3>
          <form id="contact-form" class="contact-form">
            <input type="text" name="website" hidden>
            <label><span>Nom</span><input type="text" name="fullName" required></label>
            <label><span>E-mail</span><input type="email" name="email" required></label>
            <label><span>Téléphone</span><input type="text" name="phone"></label>
            <label><span>Message</span><textarea name="message" rows="6" required></textarea></label>
            <button class="btn btn-red" type="submit">Envoyer</button>
            <p id="form-status" class="form-status"></p>
          </form>
        </article>
      </div>
    </section>
  `;
}

function renderSections(data) {
  const renderers = {
    story: renderStorySection,
    schedule: renderScheduleSection,
    team: renderTeamSection,
    pricing: renderPricingSection,
    highlights: renderHighlightsSection,
    gallery: renderGallerySection,
    contact: renderContactSection,
  };
  const html = (data.sections || [])
    .filter((section) => Number(section.enabled) === 1 && renderers[section.section_key])
    .map((section) => renderers[section.section_key](data, section))
    .join("");
  document.getElementById("page-sections").innerHTML = html;
}

async function bindContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Envoi en cours...";
    const formData = new FormData(form);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    const payload = await response.json();
    status.textContent = payload.ok ? payload.data.message : payload.error;
    if (payload.ok) form.reset();
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await fetchBootstrap();
    setText("hero-kicker", data.hero.kicker);
    setText("hero-title", data.hero.title);
    setText("hero-body", data.hero.body);
    setText("announcement-badge", data.announcement.badge);
    setText("announcement-title", data.announcement.title);
    setText("announcement-body", data.announcement.body);
    setText("site-email", data.site.email);
    setText("site-phone", data.site.phone);
    setText("site-address", data.site.address);
    setText("footer-note", data.site.footerNote);
    setLink("hero-primary", data.hero.primaryLabel, data.hero.primaryHref);
    setLink("hero-secondary", data.hero.secondaryLabel, data.hero.secondaryHref);
    renderTopLinks(data.links || []);
    renderSections(data);
    bindContactForm();
  } catch (error) {
    setText("hero-body", error instanceof Error ? error.message : "Chargement impossible");
  }
});
