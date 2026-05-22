async function fetchBootstrap() {
  const response = await fetch("/api/bootstrap");
  if (!response.ok) {
    throw new Error("Impossible de charger le contenu du site.");
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value || "";
  }
}

function setLink(id, label, href) {
  const element = document.getElementById(id);
  if (!element) return;
  if (label) {
    element.textContent = label;
  }
  if (href) {
    element.setAttribute("href", href);
  }
}

function renderSchedule(items) {
  const host = document.getElementById("schedule-grid");
  host.innerHTML = items.map((item) => `
    <article class="schedule-card">
      <p class="eyebrow">${escapeHtml(item.day_label)}</p>
      <strong>${escapeHtml(item.time_label)}</strong>
      <p>${escapeHtml(item.note)}</p>
    </article>
  `).join("");
}

function renderTeam(items) {
  const host = document.getElementById("team-grid");
  host.innerHTML = items.map((item) => `
    <article class="team-card">
      <div class="team-role">${escapeHtml(item.role_label)}</div>
      <h3>${escapeHtml(item.full_name)}</h3>
      <p><strong>${escapeHtml(item.belt_label)}</strong></p>
      <p>${escapeHtml(item.bio)}</p>
    </article>
  `).join("");
}

function renderPricing(items) {
  const host = document.getElementById("pricing-grid");
  host.innerHTML = items.map((item) => `
    <article class="pricing-card">
      <div class="pricing-badge">${escapeHtml(item.badge || "Club")}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <strong>${escapeHtml(item.price_label)}</strong>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderLinks(items) {
  const host = document.getElementById("links-grid");
  host.innerHTML = items.map((item) => `
    <article class="link-card">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <a href="${escapeHtml(item.href)}">Ouvrir</a>
    </article>
  `).join("");
}

function renderHighlights(items) {
  const host = document.getElementById("highlights-grid");
  host.innerHTML = items.map((item) => `
    <article class="highlight-card">
      <p class="eyebrow">${escapeHtml(item.badge || "Club")}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
      ${item.cta_href ? `<a class="button button-ghost" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label || "Découvrir")}</a>` : ""}
    </article>
  `).join("");
}

function renderGallery(items) {
  const host = document.getElementById("gallery-grid");
  host.innerHTML = items.map((item) => `
    <article class="gallery-card">
      <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text || item.title)}" loading="lazy">
      <h3>${escapeHtml(item.title)}</h3>
    </article>
  `).join("");
}

async function hydratePage() {
  const data = await fetchBootstrap();

  setText("site-name", data.site.name);
  setText("hero-kicker", data.hero.kicker);
  setText("hero-title", data.hero.title);
  setText("hero-body", data.hero.body);
  setText("announcement-badge", data.announcement.badge);
  setText("announcement-title", data.announcement.title);
  setText("announcement-body", data.announcement.body);
  setText("contact-email", data.site.email);
  setText("contact-phone", data.site.phone);
  setText("contact-address", data.site.address);
  setText("club-story", data.story);
  setLink("hero-primary-cta", data.hero.ctaPrimaryLabel, data.hero.ctaPrimaryHref);
  setLink("hero-secondary-cta", data.hero.ctaSecondaryLabel, data.hero.ctaSecondaryHref);
  setLink("header-cta", data.hero.ctaPrimaryLabel, data.hero.ctaPrimaryHref);

  renderSchedule(data.schedule || []);
  renderTeam(data.team || []);
  renderPricing(data.pricing || []);
  renderLinks(data.links || []);
  renderHighlights(data.highlights || []);
  renderGallery(data.gallery || []);
}

async function bindContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Envoi en cours...";

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Envoi impossible.");
      }
      form.reset();
      status.textContent = data.message;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Une erreur est survenue.";
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await hydratePage();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de chargement";
    document.getElementById("hero-body").textContent = message;
  }
  bindContactForm();
});
