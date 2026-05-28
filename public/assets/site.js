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

function setVisible(id, visible) {
  const element = document.getElementById(id);
  if (!element) return;
  element.hidden = !visible;
  element.style.display = visible ? "" : "none";
  element.setAttribute("aria-hidden", visible ? "false" : "true");
}

function visibleButtons(data, placement) {
  return (data.customButtons || [])
    .filter((item) => Number(item.enabled) === 1 && item.placement === placement && item.label && item.href)
    .sort((a, b) => Number(a.display_order) - Number(b.display_order));
}

function renderCustomButton(item, fallbackClass = "btn btn-dark") {
  const className = item.style === "red" ? "btn btn-red" : item.style === "link" ? "utility-link" : fallbackClass;
  return `<a class="${escapeHtml(className)}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
}

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value || "");
}

function setCssVar(name, value) {
  document.documentElement.style.setProperty(name, value ? `url("${String(value).replace(/"/g, '\\"')}")` : "none");
}

function setRootVar(name, value) {
  if (value) document.documentElement.style.setProperty(name, value);
}

function applyDesign(data) {
  setCssVar("--site-ambient-image", data.design?.siteAmbientImage);
  setCssVar("--hero-background-image", data.design?.heroBackgroundImage);
  setCssVar("--spotlight-background-image", data.design?.spotlightBackgroundImage);
  setRootVar("--accent", data.design?.primaryColor);
  setRootVar("--accent-deep", data.design?.primaryColor);
  setRootVar("--gold", data.design?.secondaryColor);
  setRootVar("--font-display", data.design?.headingFont);
  setRootVar("--font-body", data.design?.bodyFont);
  setRootVar("--font-nav", data.design?.navFont);
  setRootVar("--font-button", data.design?.buttonFont);
  setRootVar("--font-card-title", data.design?.cardTitleFont);
  setRootVar("--font-card-body", data.design?.cardBodyFont);
}

function applyBrandAssets(data) {
  const logo = document.getElementById("brand-logo");
  if (logo && data.design?.logoUrl) logo.src = data.design.logoUrl;
  const favicon = document.getElementById("site-favicon");
  if (favicon && data.design?.faviconUrl) favicon.href = data.design.faviconUrl;
}

function applyStaticContent(data) {
  window.__siteData = data;
  if (data.site?.browserTitle) document.title = data.site.browserTitle;
  setText("brand-primary", data.site?.brandPrimary);
  setText("brand-secondary", data.site?.brandSecondary);
  setLink("nav-club", data.navigation?.clubLabel, "#club");
  setVisible("nav-club", data.navigation?.clubEnabled !== false);
  setLink("nav-schedule", data.navigation?.scheduleLabel, "#planning");
  setVisible("nav-schedule", data.navigation?.scheduleEnabled !== false);
  setLink("nav-pricing", data.navigation?.pricingLabel, "#tarifs");
  setVisible("nav-pricing", data.navigation?.pricingEnabled !== false);
  setLink("nav-contact", data.navigation?.contactLabel, "#contact");
  setVisible("nav-contact", data.navigation?.contactEnabled !== false);
  setLink("nav-inscription", data.navigation?.inscriptionLabel, data.navigation?.inscriptionHref);
  setVisible("nav-inscription", data.navigation?.inscriptionEnabled !== false);
  setLink("nav-calendar", data.navigation?.calendarLabel, data.navigation?.calendarHref);
  setVisible("nav-calendar", data.navigation?.calendarEnabled !== false);
  setLink("nav-shop", data.navigation?.shopLabel, data.navigation?.shopHref);
  setVisible("nav-shop", data.navigation?.shopEnabled !== false);

  setLink("hero-primary", data.hero?.primaryLabel, data.hero?.primaryHref);
  setVisible("hero-primary", data.hero?.primaryEnabled !== false);
  setLink("hero-secondary", data.hero?.secondaryLabel, data.hero?.secondaryHref);
  setVisible("hero-secondary", data.hero?.secondaryEnabled !== false);

  const utilityLinks = data.hero?.utilityLinks || [];
  utilityLinks.forEach((item, index) => {
    setLink(`hero-utility-${index + 1}`, item.label, item.href);
    setVisible(`hero-utility-${index + 1}`, item.enabled !== false);
  });
  const navMenu = document.getElementById("nav-menu");
  if (navMenu) {
    navMenu.querySelectorAll("[data-custom-placement='nav']").forEach((item) => item.remove());
    visibleButtons(data, "nav").forEach((item) => {
      navMenu.insertAdjacentHTML("beforeend", renderCustomButton({ ...item, style: "link" }).replace("<a ", "<a data-custom-placement=\"nav\" "));
    });
  }
  const heroActions = document.getElementById("hero-actions");
  if (heroActions) {
    heroActions.querySelectorAll("[data-custom-placement='hero']").forEach((item) => item.remove());
    visibleButtons(data, "hero").forEach((item) => {
      heroActions.insertAdjacentHTML("beforeend", renderCustomButton(item).replace("<a ", "<a data-custom-placement=\"hero\" "));
    });
  }
  setText("contact-email-title", data.labels?.contactEmailTitle);
  setText("contact-phone-title", data.labels?.contactPhoneTitle);
  setText("contact-address-title", data.labels?.contactAddressTitle);
}

function applyMeta(data) {
  setMetaContent('meta[name="description"]', data.meta?.description);
  setMetaContent('meta[name="keywords"]', data.meta?.keywords);
  setMetaContent('meta[property="og:title"]', data.site?.name);
  setMetaContent('meta[property="og:description"]', data.meta?.description);
  setMetaContent('meta[property="og:image"]', data.design?.logoUrl);
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
    .concat(
      visibleButtons(window.__siteData || {}, "quick").map(
        (item) => `
      <article class="quick-link-card">
        <strong>${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.href)}</p>
        <a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
      </article>
    `
      )
    )
    .join("");
}

function renderSocialLinks(data) {
  const host = document.getElementById("social-links");
  if (!host) return;
  const items = [
    { label: "Facebook", href: data.social?.facebookUrl },
    { label: "Instagram", href: data.social?.instagramUrl },
    { label: "YouTube", href: data.social?.youtubeUrl },
    { label: "TikTok", href: data.social?.tiktokUrl },
    { label: "WhatsApp", href: data.social?.whatsappUrl },
  ].filter((item) => item.href);

  host.innerHTML = items
    .map((item) => `<a class="footer-social-link" href="${escapeHtml(item.href)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`)
    .join("");

  host.hidden = items.length === 0;
}

function renderFooter(data) {
  setText("footer-note", data.site?.footerNote);
  setText("footer-legal", data.footer?.legal);
  setText("footer-meta", data.footer?.meta);
  renderSocialLinks(data);
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
            ${data.spotlight.primaryEnabled !== false && data.spotlight.primaryHref ? `<a class="btn btn-red" href="${escapeHtml(data.spotlight.primaryHref)}">${escapeHtml(data.spotlight.primaryLabel || "Ouvrir")}</a>` : ""}
            ${data.spotlight.secondaryEnabled !== false && data.spotlight.secondaryHref ? `<a class="btn btn-dark" href="${escapeHtml(data.spotlight.secondaryHref)}">${escapeHtml(data.spotlight.secondaryLabel || "Ouvrir")}</a>` : ""}
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
            ${item.image_url ? `<img class="team-photo" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.full_name)}" loading="lazy">` : ""}
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
          .filter((item) => Number(item.enabled ?? 1) === 1)
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
            ${item.image_url ? `<img class="card-contained-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : ""}
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            ${item.cta_href ? `<a class="cta" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label || "Ouvrir")}</a>` : ""}
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
            ${item.image_url ? `<img class="equipment-photo" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : ""}
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            ${item.cta_href ? `<a class="cta" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label || "Ouvrir")}</a>` : ""}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSponsorsSection(data, section) {
  const sponsors = (data.sponsors || [])
    .filter((item) => Number(item.enabled ?? 1) === 1)
    .sort((a, b) => Number(a.display_order) - Number(b.display_order));
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Sponsors")}</div>
          <h2>${escapeHtml(section.subtitle || "Ils soutiennent le club")}</h2>
        </div>
        <p>${escapeHtml(data.sponsorsIntro || "Merci aux partenaires qui accompagnent le club et soutiennent ses projets.")}</p>
      </div>
      <div class="sponsors-grid">
        ${sponsors
          .map(
            (item) => `
          <article class="sponsor-partner-card">
            ${item.logo_url ? `<img class="sponsor-logo" src="${escapeHtml(item.logo_url)}" alt="${escapeHtml(item.name)}" loading="lazy">` : ""}
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description || "")}</p>
            ${item.website_url ? `<a class="cta" href="${escapeHtml(item.website_url)}" target="_blank" rel="noreferrer">Voir le site</a>` : ""}
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSponsorSection(data, section) {
  const suggestedAmounts = data.sponsor?.checkoutSuggestedAmounts || [];
  const minAmount = Number.parseInt(data.sponsor?.checkoutMinAmountEur || "5", 10) || 5;
  return `
    <section id="don" class="section-shell">
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
        ${data.sponsor?.checkoutEnabled ? `
          <form id="donation-form" class="donation-form">
            <div class="donation-presets">
              ${suggestedAmounts.map((amount) => `<button class="donation-preset" type="button" data-donation-amount="${amount}">${amount} €</button>`).join("")}
            </div>
            <div class="donation-grid">
              <label><span>${escapeHtml(data.labels?.sponsorAmount || "Montant")}</span><input id="donation-amount" type="number" min="${minAmount}" step="1" placeholder="${minAmount}" required></label>
              <label><span>${escapeHtml(data.labels?.sponsorFirstName || "Prénom")}</span><input type="text" name="firstName" required></label>
              <label><span>${escapeHtml(data.labels?.sponsorLastName || "Nom")}</span><input type="text" name="lastName" required></label>
              <label><span>${escapeHtml(data.labels?.sponsorEmail || "E-mail")}</span><input type="email" name="email" required></label>
            </div>
            <div class="spotlight-actions">
              <button class="btn btn-red" type="submit">${escapeHtml(data.sponsor.ctaLabel || "Faire un don")}</button>
            </div>
            <p id="donation-status" class="form-status"></p>
          </form>
        ` : `
          <div class="spotlight-actions">
            ${data.sponsor.ctaHref ? `<a class="btn btn-red" href="${escapeHtml(data.sponsor.ctaHref)}">${escapeHtml(data.sponsor.ctaLabel || "Ouvrir")}</a>` : ""}
          </div>
        `}
      </article>
    </section>
  `;
}

function renderCustomSection(data, section) {
  const blocks = (data.customBlocks || [])
    .filter((item) => Number(item.enabled) === 1)
    .sort((a, b) => Number(a.display_order) - Number(b.display_order));
  return `
    <section class="section-shell">
      <div class="section-head">
        <div>
          <div class="section-tag">${escapeHtml(section.title || "Blocs personnalisés")}</div>
          <h2>${escapeHtml(section.subtitle || "Composez librement le site.")}</h2>
        </div>
      </div>
      <div class="custom-block-grid">
        ${blocks.map((item) => {
          const width = Math.min(100, Math.max(30, Number(item.width_percent) || 100));
          const height = Math.min(760, Math.max(180, Number(item.height_px) || 360));
          return `
          <article class="custom-block" style="--custom-block-width:${width}%;--custom-block-height:${height}px">
            ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : ""}
            <div class="custom-block-copy">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
              ${item.cta_href ? `<a class="btn btn-red" href="${escapeHtml(item.cta_href)}">${escapeHtml(item.cta_label || "Ouvrir")}</a>` : ""}
            </div>
          </article>`;
        }).join("")}
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
            title="${escapeHtml(data.labels?.contactMapTitle || "Plan d'accès au club")}">
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
    sponsors: renderSponsorsSection,
    sponsor: renderSponsorSection,
    custom: renderCustomSection,
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
    host.innerHTML = `<p>${escapeHtml(window.__siteData?.labels?.mapUnavailable || "Carte indisponible")}</p>`;
    return;
  }

  host.innerHTML = `
  <iframe
  src="${escapeHtml(url)}"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
  allowfullscreen
  title="${escapeHtml(window.__siteData?.labels?.contactMapTitle || "Localisation du club")}">
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

async function bindDonationForm() {
  const form = document.getElementById("donation-form");
  if (!form) return;
  const status = document.getElementById("donation-status");
  const amountInput = document.getElementById("donation-amount");

  document.querySelectorAll("[data-donation-amount]").forEach((button) => {
    button.addEventListener("click", () => {
      amountInput.value = button.getAttribute("data-donation-amount") || "";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Redirection vers HelloAsso...";
    const formData = new FormData(form);
    const amount = Number.parseInt(String(amountInput.value || ""), 10);
    const response = await fetch("/api/donations/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        amountCents: amount * 100,
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      status.textContent = payload.error || "Impossible de créer le paiement.";
      return;
    }
    window.location.href = payload.data.redirectUrl;
  });
}

async function bindDonationReturn() {
  const status = document.getElementById("donation-status");
  if (!status) return;
  const params = new URLSearchParams(window.location.search);
  const checkoutIntentId = params.get("checkoutIntentId");
  const code = params.get("code");
  const flow = params.get("ha_checkout");
  const error = params.get("error");

  if (!checkoutIntentId && !flow) return;

  if (flow === "back") {
    status.textContent = "Paiement annulé avant validation.";
    return;
  }

  if (flow === "error" || error) {
    status.textContent = "Une erreur est survenue pendant le paiement. Vous pouvez réessayer.";
    return;
  }

  if (checkoutIntentId && code === "succeeded") {
    status.textContent = "Vérification du paiement...";
    try {
      const response = await fetch(`/api/donations/checkout-status?intentId=${encodeURIComponent(checkoutIntentId)}`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Vérification impossible");
      const payerEmail = payload.data?.order?.payer?.email;
      status.textContent = payerEmail
        ? `Merci, votre don a bien été enregistré pour ${payerEmail}.`
        : "Merci, votre don a bien été enregistré.";
    } catch (errorCaught) {
      status.textContent = errorCaught instanceof Error ? errorCaught.message : "Merci, retour reçu depuis HelloAsso.";
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await fetchBootstrap();
    document.title = data.site.name || "American Full Fighting Bons en Chablais";
    applyDesign(data);
    applyBrandAssets(data);
    applyMeta(data);
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
    setText("inpi-note", data.inpiNote);
    setLink("hero-primary", data.hero.primaryLabel, data.hero.primaryHref);
    setLink("hero-secondary", data.hero.secondaryLabel, data.hero.secondaryHref);
    renderTopLinks(data.links || []);
    renderSections(data);
    renderFooter(data);
    initGalleryCarousels();
    bindContactForm();
    bindDonationForm();
    bindDonationReturn();
  } catch (error) {
    setText("hero-body", error instanceof Error ? error.message : "Chargement impossible");
  }
});
