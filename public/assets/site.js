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

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value || "");
}

function setCssVar(name, value) {
  document.documentElement.style.setProperty(name, value ? `url("${String(value).replace(/"/g, '\\"')}")` : "none");
}

function applyDesign(data) {
  setCssVar("--site-ambient-image", data.design?.siteAmbientImage);
  setCssVar("--hero-background-image", data.design?.heroBackgroundImage);
  setCssVar("--spotlight-background-image", data.design?.spotlightBackgroundImage);
}

function applyStaticContent(data) {
  window.__siteData = data;
  setText("brand-primary", data.site?.brandPrimary);
  setText("brand-secondary", data.site?.brandSecondary);
  setLink("nav-club", data.navigation?.clubLabel, "#club");
  setLink("nav-schedule", data.navigation?.scheduleLabel, "#planning");
  setLink("nav-pricing", data.navigation?.pricingLabel, "#tarifs");
  setLink("nav-contact", data.navigation?.contactLabel, "#contact");
  setLink("nav-inscription", data.navigation?.inscriptionLabel, data.navigation?.inscriptionHref);
  setLink("nav-calendar", data.navigation?.calendarLabel, data.navigation?.calendarHref);
  setLink("nav-shop", data.navigation?.shopLabel, data.navigation?.shopHref);

  const utilityLinks = data.hero?.utilityLinks || [];
  utilityLinks.forEach((item, index) => {
    setLink(`hero-utility-${index + 1}`, item.label, item.href);
  });
  setText("contact-email-title", data.labels?.contactEmailTitle);
  setText("contact-phone-title", data.labels?.contactPhoneTitle);
  setText("contact-address-title", data.labels?.contactAddressTitle);
}

function renderTopLinks(links) {
  const host = document.getElementById("partner-links-top");
  const visibleLinks = (links || [])
    .filter((item) => !/gestion|admin/i.test(String(item.title || "")))
    .slice(0, 3);
  host.innerHTML = visibleLinks
    .map(
      (item) => `
      <article class="quick-link-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.description)}</p>
        <a href="${escapeHtml(item.href)}">${escapeHtml(item.cta_label || window.__siteData?.labels?.quickLinkCta || "Accéder")}</a>
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
          <h2>${escapeHtml(section.subtitle || "Un cadre sérieux, un esprit collectif, une pratique accessible.")}</h2>
        </div>
        <p>${escapeHtml(data.storyPanel?.intro || "American Full Fighting Bons en Chablais réunit apprentissage technique, intensité progressive et esprit de groupe dans une ambiance encadrée.")}</p>
      </div>
      <div class="story-grid">
        <article class="story-card">
          <h3>${escapeHtml(data.storyPanel?.cardTitle || "Le club")}</h3>
          <p>${escapeHtml(data.story)}</p>
        </article>
        <article class="story-card is-accent">
          <div class="story-note">${escapeHtml(data.storyPanel?.noteLabel || "Repères")}</div>
          <h3>${escapeHtml(data.storyPanel?.noteTitle || "Pour qui ?")}</h3>
          <p>${escapeHtml(data.storyPanel?.noteBody || "Cours mixtes, progression suivie, objectifs clairs et séances pensées pour développer technique, condition physique et confiance.")}</p>
        </article>
      </div>
    </section>
  `;
}

function renderSpotlightSection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "À la une")}</div>
          <h2>${escapeHtml(section.subtitle || "Stage, actualité ou message fort du club.")}</h2>
        </div>
        <p>${escapeHtml(data.spotlight.intro || "Les rendez-vous importants de la saison sont mis en avant ici pour rester visibles au premier coup d'oeil.")}</p>
      </div>
      <article class="spotlight-card">
        <div class="spotlight-content">
          <div class="spotlight-date">${escapeHtml(data.spotlight.date)}</div>
          <h3>${escapeHtml(data.spotlight.title)}</h3>
          <p>${escapeHtml(data.spotlight.body)}</p>
          <div class="spotlight-actions">
            <a class="btn btn-red" href="${escapeHtml(data.spotlight.primaryHref)}">${escapeHtml(data.spotlight.primaryLabel)}</a>
            <a class="btn btn-dark" href="${escapeHtml(data.spotlight.secondaryHref)}">${escapeHtml(data.spotlight.secondaryLabel)}</a>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderScheduleSection(data, section) {
  return `
    <section id="planning" class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Planning")}</div>
          <h2>${escapeHtml(section.subtitle || "Les séances de la semaine")}</h2>
        </div>
        <p>${escapeHtml(data.scheduleIntro || "Des créneaux réguliers pour installer de bons repères techniques et physiques tout au long de la semaine.")}</p>
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
        <p>${escapeHtml(data.teamIntro || "Un encadrement identifié, présent sur les séances et engagé dans la progression de chaque pratiquant.")}</p>
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
  const syncLabel = data.pricingSource === "gestion"
    ? (data.pricingIntroSynced || "Tarifs alignés avec l'inscription en ligne.")
    : (data.pricingIntroLocal || "Tarifs actuellement affichés par le club.");
  return `
    <section id="tarifs" class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Tarifs")}</div>
          <h2>${escapeHtml(section.subtitle || "Tarifs et informations utiles")}</h2>
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
        <p>${escapeHtml(data.highlightsIntro || "Stages, matériel, progression et moments clés de la saison restent accessibles sans alourdir la navigation.")}</p>
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
  const items = data.gallery || [];
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Galerie")}</div>
          <h2>${escapeHtml(section.subtitle || "Visuels et ambiance du club")}</h2>
        </div>
        <p>${escapeHtml(data.galleryIntro || "Quelques images pour restituer l'ambiance des entraînements, des stages et de la vie du club.")}</p>
      </div>
      <div class="gallery-carousel" data-carousel="gallery">
        <div class="gallery-carousel-viewport">
          <div class="gallery-carousel-track">
        ${items
          .map(
            (item, index) => `
          <article class="gallery-slide" data-slide-index="${index}">
            <div class="gallery-card">
              <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text || item.title)}" loading="lazy">
              <div class="gallery-card-copy">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.alt_text || "")}</p>
              </div>
            </div>
          </article>
        `
          )
          .join("")}
          </div>
        </div>
        ${items.length > 1 ? `
        <div class="gallery-carousel-controls">
          <button class="gallery-nav" type="button" data-gallery-prev aria-label="Image précédente">←</button>
          <div class="gallery-dots">
            ${items.map((_, index) => `<button class="gallery-dot${index === 0 ? " is-active" : ""}" type="button" data-gallery-dot="${index}" aria-label="Aller à l'image ${index + 1}"></button>`).join("")}
          </div>
          <button class="gallery-nav" type="button" data-gallery-next aria-label="Image suivante">→</button>
        </div>` : ""}
      </div>
    </section>
  `;
}

function renderResourcesSection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Membre actif")}</div>
          <h2>${escapeHtml(section.subtitle || "Accès utiles pour la saison")}</h2>
        </div>
        <p>${escapeHtml(data.resourcesIntro || "")}</p>
      </div>
      <div class="resource-grid">
        ${(data.resources || [])
          .map(
            (item) => `
          <article class="resource-card">
            ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : ""}
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <a class="cta" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label)}</a>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderEquipmentSection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Équipement")}</div>
          <h2>${escapeHtml(section.subtitle || "Protections et matériel recommandés")}</h2>
        </div>
        <p>${escapeHtml(data.equipmentIntro || "")}</p>
      </div>
      <div class="equipment-grid">
        ${(data.equipment || [])
          .map(
            (item) => `
          <article class="equipment-card">
            ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : ""}
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <a class="cta" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label)}</a>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSponsorSection(data, section) {
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Mécénat")}</div>
          <h2>${escapeHtml(section.subtitle || "Soutenir le club et ses combattants.")}</h2>
        </div>
        <p>${escapeHtml(data.sponsor?.intro || "Le soutien des adhérents, proches et partenaires aide le club à mieux équiper ses pratiquants et à accompagner ses projets.")}</p>
      </div>
      <article class="sponsor-card">
        <h3>${escapeHtml(data.sponsor.title)}</h3>
        <p>${escapeHtml(data.sponsor.body)}</p>
        <div class="spotlight-actions">
          <a class="btn btn-red" href="${escapeHtml(data.sponsor.ctaHref)}">${escapeHtml(data.sponsor.ctaLabel)}</a>
        </div>
      </article>
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
        <p>${escapeHtml(data.contactIntro || "Pour une question, une séance d'essai ou une demande sur la saison, le club peut être joint directement ici.")}</p>
      </div>
      <div class="contact-wrap">
        <article class="contact-card">
          <h3>${escapeHtml(data.contactForm?.detailsTitle || "Coordonnées")}</h3>
          <p>${escapeHtml(data.site.name)}<br>${escapeHtml(data.site.address)}<br>${escapeHtml(data.site.email)}<br>${escapeHtml(data.site.phone)}</p>
          ${data.contactForm?.mapEmbedUrl ? `
            <div class="contact-map-frame">
            <iframe
            src="${escapeHtml(data.contactForm.mapEmbedUrl)}"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
            title="Plan d'accès au club">
            </iframe>
            </div>` : ""}
        </article>
        <article class="contact-card">
          <h3>${escapeHtml(data.contactForm?.formTitle || "Envoyer un message")}</h3>
          <form id="contact-form" class="contact-form">
            <input type="text" name="website" hidden>
            <label><span>${escapeHtml(data.contactForm?.nameLabel || "Nom")}</span><input type="text" name="fullName" required></label>
            <label><span>${escapeHtml(data.contactForm?.emailLabel || "E-mail")}</span><input type="email" name="email" required></label>
            <label><span>${escapeHtml(data.contactForm?.phoneLabel || "Téléphone")}</span><input type="text" name="phone"></label>
            <label><span>${escapeHtml(data.contactForm?.messageLabel || "Message")}</span><textarea name="message" rows="6" required></textarea></label>
            <button class="btn btn-red" type="submit">${escapeHtml(data.contactForm?.submitLabel || "Envoyer")}</button>
            <p id="form-status" class="form-status"></p>
          </form>
        </article>
      </div>
    </section>
  `;
}

function renderSections(data) {
  const renderers = {
    spotlight: renderSpotlightSection,
    story: renderStorySection,
    schedule: renderScheduleSection,
    team: renderTeamSection,
    pricing: renderPricingSection,
    highlights: renderHighlightsSection,
    gallery: renderGallerySection,
    resources: renderResourcesSection,
    equipment: renderEquipmentSection,
    sponsor: renderSponsorSection,
    contact: renderContactSection,
  };
  const html = (data.sections || [])
    .filter((section) => Number(section.enabled) === 1 && renderers[section.section_key])
    .map((section) => renderers[section.section_key](data, section))
    .join("");
  document.getElementById("page-sections").innerHTML = html;
}

function renderMainMap(url) {
  const host = document.getElementById("map-frame");
  if (!host) return;

  if (!url) {
    host.innerHTML = "<p>Carte indisponible</p>";
    return;
  }

  host.innerHTML = `
  <iframe
  src="${escapeHtml(url)}"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
  allowfullscreen
  title="Localisation du club">
  </iframe>
  `;
}


function initGalleryCarousels() {
  document.querySelectorAll('[data-carousel="gallery"]').forEach((root) => {
    const track = root.querySelector(".gallery-carousel-track");
    const slides = Array.from(root.querySelectorAll(".gallery-slide"));
    const dots = Array.from(root.querySelectorAll("[data-gallery-dot]"));
    const prev = root.querySelector("[data-gallery-prev]");
    const next = root.querySelector("[data-gallery-next]");
    if (!track || slides.length <= 1) return;

    let index = 0;
    let autoplayId = null;

    const update = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      update();
    };

    const stopAutoplay = () => {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      autoplayId = window.setInterval(() => {
        goTo(index + 1);
      }, 5000);
    };

    prev?.addEventListener("click", () => {
      goTo(index - 1);
      startAutoplay();
    });
    next?.addEventListener("click", () => {
      goTo(index + 1);
      startAutoplay();
    });
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        goTo(Number(dot.getAttribute("data-gallery-dot")));
        startAutoplay();
      });
    });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", startAutoplay);

    update();
    startAutoplay();
  });
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
    document.title = data.site.name || "American Full Fighting Bons en Chablais";
    setMetaContent('meta[name="description"]', `${data.site.name || "American Full Fighting Bons en Chablais"} : club de full contact, informations pratiques, entraînements et accès utiles.`);
    setMetaContent('meta[property="og:title"]', data.site.name || "American Full Fighting Bons en Chablais");
    setMetaContent('meta[property="og:description"]', "Découvrez le club, les séances, les tarifs et les accès utiles de la saison.");
    applyDesign(data);
    applyStaticContent(data);
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
    setText("inpi-note", data.inpiNote);
    setLink("hero-primary", data.hero.primaryLabel, data.hero.primaryHref);
    setLink("hero-secondary", data.hero.secondaryLabel, data.hero.secondaryHref);
    renderTopLinks(data.links || []);
    renderSections(data);
    initGalleryCarousels();
    bindContactForm();
  } catch (error) {
    setText("hero-body", error instanceof Error ? error.message : "Chargement impossible");
  }
});
