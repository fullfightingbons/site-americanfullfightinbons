const SETTINGS_GROUPS = [
  {
    title: "Identité",
    description: "Nom du club, marque visible et éléments permanents du site.",
    fields: [
      ["club_name", "Nom du club"],
      ["brand_primary", "Marque ligne 1"],
      ["brand_secondary", "Marque ligne 2"],
      ["footer_note", "Texte footer"],
      ["inpi_note", "Note INPI"],
      ["site_ambient_image", "Image d'ambiance générale"],
    ],
  },
  {
    title: "Navigation",
    description: "Libellés et liens visibles dans l'en-tête du site.",
    fields: [
      ["nav_club_label", "Menu club"],
      ["nav_schedule_label", "Menu séances"],
      ["nav_pricing_label", "Menu tarifs"],
      ["nav_contact_label", "Menu contact"],
      ["nav_inscription_label", "Menu inscription"],
      ["nav_inscription_href", "Lien inscription"],
      ["nav_calendar_label", "Menu calendrier"],
      ["nav_calendar_href", "Lien calendrier"],
      ["nav_shop_label", "Menu boutique"],
      ["nav_shop_href", "Lien boutique"],
      ["quick_links_cta_label", "Bouton cartes rapides"],
    ],
  },
  {
    title: "Hero",
    description: "Première impression du site, boutons principaux et liens rapides.",
    fields: [
      ["hero_kicker", "Accroche hero"],
      ["hero_title", "Titre hero"],
      ["hero_body", "Texte hero"],
      ["hero_background_image", "Image de fond hero"],
      ["hero_primary_label", "CTA principal"],
      ["hero_primary_href", "Lien CTA principal"],
      ["hero_secondary_label", "CTA secondaire"],
      ["hero_secondary_href", "Lien CTA secondaire"],
      ["hero_link_inscription_label", "Lien rapide 1"],
      ["hero_link_inscription_href", "URL lien rapide 1"],
      ["hero_link_calendar_label", "Lien rapide 2"],
      ["hero_link_calendar_href", "URL lien rapide 2"],
      ["hero_link_shop_label", "Lien rapide 3"],
      ["hero_link_shop_href", "URL lien rapide 3"],
      ["announcement_badge", "Badge annonce"],
      ["announcement_title", "Titre annonce"],
      ["announcement_body", "Texte annonce"],
    ],
  },
  {
    title: "Club",
    description: "Texte de présentation et bloc d'accompagnement de la section club.",
    fields: [
      ["club_story", "Présentation du club"],
      ["story_intro", "Intro section club"],
      ["story_card_title", "Titre carte principale"],
      ["story_note_label", "Badge repères"],
      ["story_note_title", "Titre bloc repères"],
      ["story_note_body", "Texte bloc repères"],
    ],
  },
  {
    title: "Sections",
    description: "Textes d'introduction pour les grands blocs de la page.",
    fields: [
      ["spotlight_intro", "Intro à la une"],
      ["schedule_intro", "Intro planning"],
      ["team_intro", "Intro équipe"],
      ["pricing_intro_synced", "Intro tarifs synchronisés"],
      ["pricing_intro_local", "Intro tarifs locaux"],
      ["highlights_intro", "Intro temps forts"],
      ["gallery_intro", "Intro galerie"],
      ["resources_intro", "Intro ressources"],
      ["equipment_intro", "Intro équipement"],
      ["sponsor_intro", "Intro mécénat"],
      ["contact_intro", "Intro contact"],
    ],
  },
  {
    title: "À la une",
    description: "Bloc éditorial principal sous le hero.",
    fields: [
      ["spotlight_date", "Date à la une"],
      ["spotlight_title", "Titre à la une"],
      ["spotlight_body", "Texte à la une"],
      ["spotlight_background_image", "Image de fond à la une"],
      ["spotlight_cta_label", "Bouton principal"],
      ["spotlight_cta_href", "Lien bouton principal"],
      ["spotlight_secondary_label", "Bouton secondaire"],
      ["spotlight_secondary_href", "Lien bouton secondaire"],
    ],
  },
  {
    title: "Contact",
    description: "Titres et libellés du bloc de contact et du formulaire.",
    fields: [
      ["contact_details_title", "Titre coordonnées"],
      ["contact_map_embed_url", "URL Google Maps intégrée"],
      ["contact_email_title", "Libellé e-mail"],
      ["contact_phone_title", "Libellé téléphone"],
      ["contact_address_title", "Libellé adresse"],
      ["contact_form_title", "Titre formulaire"],
      ["contact_name_label", "Libellé nom"],
      ["contact_email_label", "Libellé e-mail"],
      ["contact_phone_label", "Libellé téléphone"],
      ["contact_message_label", "Libellé message"],
      ["contact_submit_label", "Texte bouton envoi"],
      ["contact_email", "E-mail club"],
      ["contact_phone", "Téléphone club"],
      ["contact_address", "Adresse club"],
    ],
  },
  {
    title: "Mécénat",
    description: "Appel au soutien et bouton associé.",
    fields: [
      ["sponsor_title", "Titre mécénat"],
      ["sponsor_body", "Texte mécénat"],
      ["sponsor_cta_label", "Bouton mécénat"],
      ["sponsor_cta_href", "Lien mécénat"],
    ],
  },
];

let state = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inputValue(value) {
  return escapeHtml(value);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Erreur");
  }
  return payload.data;
}

function showStatus(target, message, isError = true) {
  const element = document.getElementById(target);
  if (element) {
    element.textContent = message || "";
    element.style.color = isError ? "#8B0E10" : "#1E8449";
  }
}

function renderSettingsForm() {
  const form = document.getElementById("settings-form");
  form.innerHTML = SETTINGS_GROUPS.map((group) => `
    <section class="admin-settings-group">
      <div class="admin-settings-group-head">
        <h3>${escapeHtml(group.title)}</h3>
        <p>${escapeHtml(group.description)}</p>
      </div>
      <div class="admin-settings-grid">
        ${group.fields.map(([key, label]) => `
          <label class="${key.includes("body") || key.includes("story") || key.includes("intro") || key.includes("address") ? "full" : ""}">
            <span>${escapeHtml(label)}</span>
            <textarea name="${escapeHtml(key)}" rows="${key.includes("body") || key.includes("story") || key.includes("intro") || key.includes("address") ? 4 : 2}">${escapeHtml((state.siteSettings || {})[key] || "")}</textarea>
          </label>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function rowControls(kind, item) {
  return `
    <div class="admin-item-actions">
      ${item.display_order !== undefined ? `<button class="btn btn-dark" type="button" data-move="${escapeHtml(kind)}" data-id="${escapeHtml(item.id)}" data-direction="-1">Monter</button>
      <button class="btn btn-dark" type="button" data-move="${escapeHtml(kind)}" data-id="${escapeHtml(item.id)}" data-direction="1">Descendre</button>` : ""}
      ${item.id !== "shared" && item.key !== "protected" ? `<button class="btn btn-red" type="button" data-delete="${escapeHtml(kind)}" data-id="${escapeHtml(item.id)}">Supprimer</button>` : ""}
    </div>
  `;
}

function renderSectionsEditor() {
  document.getElementById("sections-editor").innerHTML = (state.sections || []).map((item) => `
    <article class="admin-item">
      <div class="admin-item-head">
        <div class="admin-item-title">${escapeHtml(item.section_key)}</div>
        ${rowControls("sections", item)}
      </div>
      <div class="admin-item-grid">
        <label><span>Titre</span><input data-field="title" data-kind="sections" data-id="${escapeHtml(item.id)}" value="${inputValue(item.title || "")}"></label>
        <label><span>Sous-titre</span><input data-field="subtitle" data-kind="sections" data-id="${escapeHtml(item.id)}" value="${inputValue(item.subtitle || "")}"></label>
        <label class="admin-inline"><input type="checkbox" data-field="enabled" data-kind="sections" data-id="${escapeHtml(item.id)}" ${Number(item.enabled) === 1 ? "checked" : ""}><span>Section active</span></label>
        <label><span>Ordre</span><input data-field="display_order" data-kind="sections" data-id="${escapeHtml(item.id)}" type="number" value="${inputValue(item.display_order || 0)}"></label>
      </div>
    </article>
  `).join("");
}

function renderEntityList(targetId, kind, items, fields) {
  document.getElementById(targetId).innerHTML = items.map((item) => `
    <article class="admin-item">
      <div class="admin-item-head">
        <div class="admin-item-title">${escapeHtml(item.title || item.full_name || item.day_label || "Élément")}</div>
        ${rowControls(kind, item)}
      </div>
      <div class="admin-item-grid">
        ${fields.map((field) => {
          const full = field.type === "textarea" ? "full" : "";
          const input = field.type === "textarea"
            ? `<textarea data-field="${escapeHtml(field.key)}" data-kind="${escapeHtml(kind)}" data-id="${escapeHtml(item.id)}" rows="4">${escapeHtml(item[field.key] || "")}</textarea>`
            : `<input data-field="${escapeHtml(field.key)}" data-kind="${escapeHtml(kind)}" data-id="${escapeHtml(item.id)}" type="${escapeHtml(field.type || "text")}" value="${inputValue(item[field.key] || "")}">`;
          return `<label class="${full}"><span>${escapeHtml(field.label)}</span>${input}</label>`;
        }).join("")}
      </div>
    </article>
  `).join("");
}

function renderMessages() {
  document.getElementById("messages-editor").innerHTML = (state.messages || []).map((item) => `
    <article class="admin-item">
      <div class="admin-item-head">
        <div class="admin-item-title">${escapeHtml(item.full_name)}</div>
        <div class="admin-item-actions">
          <button class="btn btn-dark" type="button" data-message-status="${escapeHtml(item.id)}" data-status="new">Nouveau</button>
          <button class="btn btn-dark" type="button" data-message-status="${escapeHtml(item.id)}" data-status="read">Lu</button>
          <button class="btn btn-dark" type="button" data-message-status="${escapeHtml(item.id)}" data-status="done">Traité</button>
        </div>
      </div>
      <p class="admin-message-meta"><strong>${escapeHtml(item.email)}</strong> ${item.phone ? `· ${escapeHtml(item.phone)}` : ""} · ${escapeHtml(item.created_at)}</p>
      <p class="admin-message-body">${escapeHtml(item.message)}</p>
      <p class="admin-message-status">Statut : ${escapeHtml(item.status)}</p>
    </article>
  `).join("");
}

function renderPricing() {
  document.getElementById("pricing-readonly").innerHTML = (state.pricing || []).map((item) => `
    <article class="admin-item">
      <div class="admin-item-title">${escapeHtml(item.title)}</div>
      <p><strong>${escapeHtml(item.price_label)}</strong></p>
      <p>${escapeHtml(item.description)}</p>
      <p class="admin-note">Repère : ${escapeHtml(item.badge || state.pricingSource)}</p>
    </article>
  `).join("");
}

function renderSummary() {
  const summary = [
    { value: (state.sections || []).filter((item) => Number(item.enabled) === 1).length, label: "sections actives" },
    { value: (state.messages || []).filter((item) => String(item.status) === "new").length, label: "messages à lire" },
    { value: (state.links || []).length, label: "liens rapides" },
    { value: (state.gallery || []).length, label: "visuels publiés" },
  ];
  document.getElementById("admin-summary").innerHTML = summary.map((item) => `
    <article class="admin-summary-card">
      <strong>${escapeHtml(item.value)}</strong>
      <span>${escapeHtml(item.label)}</span>
    </article>
  `).join("");
}

function renderAll() {
  document.getElementById("admin-user").textContent = `${state.user.display_name} · ${state.user.email}`;
  renderSummary();
  renderSettingsForm();
  renderSectionsEditor();
  renderEntityList("schedule-editor", "schedule", state.schedule || [], [
    { key: "day_label", label: "Jour" },
    { key: "time_label", label: "Horaire" },
    { key: "display_order", label: "Ordre", type: "number" },
    { key: "note", label: "Note", type: "textarea" },
  ]);
  renderEntityList("team-editor", "team", state.team || [], [
    { key: "full_name", label: "Nom" },
    { key: "role_label", label: "Rôle" },
    { key: "belt_label", label: "Ceinture" },
    { key: "display_order", label: "Ordre", type: "number" },
    { key: "bio", label: "Bio", type: "textarea" },
  ]);
  renderEntityList("highlights-editor", "highlights", state.highlights || [], [
    { key: "title", label: "Titre" },
    { key: "badge", label: "Badge" },
    { key: "cta_label", label: "Texte bouton" },
    { key: "cta_href", label: "Lien bouton" },
    { key: "display_order", label: "Ordre", type: "number" },
    { key: "body", label: "Texte", type: "textarea" },
  ]);
  renderEntityList("gallery-editor", "gallery", state.gallery || [], [
    { key: "title", label: "Titre" },
    { key: "image_url", label: "URL image" },
    { key: "alt_text", label: "Texte alternatif", type: "textarea" },
    { key: "display_order", label: "Ordre", type: "number" },
  ]);
  renderEntityList("links-editor", "links", state.links || [], [
    { key: "title", label: "Titre" },
    { key: "href", label: "Lien" },
    { key: "cta_label", label: "Texte bouton" },
    { key: "display_order", label: "Ordre", type: "number" },
    { key: "description", label: "Description", type: "textarea" },
  ]);
  renderEntityList("resources-editor", "resources", state.resources || [], [
    { key: "title", label: "Titre" },
    { key: "cta_label", label: "Texte bouton" },
    { key: "cta_href", label: "Lien bouton" },
    { key: "display_order", label: "Ordre", type: "number" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "image_url", label: "URL image" },
  ]);
  renderEntityList("equipment-editor", "equipment", state.equipment || [], [
    { key: "title", label: "Titre" },
    { key: "cta_label", label: "Texte bouton" },
    { key: "cta_href", label: "Lien bouton" },
    { key: "display_order", label: "Ordre", type: "number" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "image_url", label: "URL image" },
  ]);
  renderMessages();
  renderPricing();
}

async function loadAdmin() {
  state = await api("/api/admin/bootstrap", { method: "GET" });
  state.siteSettings = {
    club_name: state.site.name,
    brand_primary: state.site.brandPrimary,
    brand_secondary: state.site.brandSecondary,
    site_ambient_image: state.design?.siteAmbientImage,
    nav_club_label: state.navigation?.clubLabel,
    nav_schedule_label: state.navigation?.scheduleLabel,
    nav_pricing_label: state.navigation?.pricingLabel,
    nav_contact_label: state.navigation?.contactLabel,
    nav_inscription_label: state.navigation?.inscriptionLabel,
    nav_inscription_href: state.navigation?.inscriptionHref,
    nav_calendar_label: state.navigation?.calendarLabel,
    nav_calendar_href: state.navigation?.calendarHref,
    nav_shop_label: state.navigation?.shopLabel,
    nav_shop_href: state.navigation?.shopHref,
    quick_links_cta_label: state.labels?.quickLinkCta,
    contact_email: state.site.email,
    contact_phone: state.site.phone,
    contact_address: state.site.address,
    club_story: state.story,
    story_intro: state.storyPanel?.intro,
    story_card_title: state.storyPanel?.cardTitle,
    story_note_label: state.storyPanel?.noteLabel,
    story_note_title: state.storyPanel?.noteTitle,
    story_note_body: state.storyPanel?.noteBody,
    hero_kicker: state.hero.kicker,
    hero_title: state.hero.title,
    hero_body: state.hero.body,
    hero_background_image: state.design?.heroBackgroundImage,
    hero_link_inscription_label: state.hero.utilityLinks?.[0]?.label,
    hero_link_inscription_href: state.hero.utilityLinks?.[0]?.href,
    hero_link_calendar_label: state.hero.utilityLinks?.[1]?.label,
    hero_link_calendar_href: state.hero.utilityLinks?.[1]?.href,
    hero_link_shop_label: state.hero.utilityLinks?.[2]?.label,
    hero_link_shop_href: state.hero.utilityLinks?.[2]?.href,
    announcement_badge: state.announcement.badge,
    announcement_title: state.announcement.title,
    announcement_body: state.announcement.body,
    hero_primary_label: state.hero.primaryLabel,
    hero_primary_href: state.hero.primaryHref,
    hero_secondary_label: state.hero.secondaryLabel,
    hero_secondary_href: state.hero.secondaryHref,
    spotlight_intro: state.spotlight.intro,
    spotlight_date: state.spotlight.date,
    spotlight_title: state.spotlight.title,
    spotlight_body: state.spotlight.body,
    spotlight_background_image: state.design?.spotlightBackgroundImage,
    spotlight_cta_label: state.spotlight.primaryLabel,
    spotlight_cta_href: state.spotlight.primaryHref,
    spotlight_secondary_label: state.spotlight.secondaryLabel,
    spotlight_secondary_href: state.spotlight.secondaryHref,
    schedule_intro: state.scheduleIntro,
    team_intro: state.teamIntro,
    pricing_intro_synced: state.pricingIntroSynced,
    pricing_intro_local: state.pricingIntroLocal,
    highlights_intro: state.highlightsIntro,
    gallery_intro: state.galleryIntro,
    resources_intro: state.resourcesIntro,
    equipment_intro: state.equipmentIntro,
    sponsor_intro: state.sponsor.intro,
    sponsor_title: state.sponsor.title,
    sponsor_body: state.sponsor.body,
    sponsor_cta_label: state.sponsor.ctaLabel,
    sponsor_cta_href: state.sponsor.ctaHref,
    contact_intro: state.contactIntro,
    contact_map_embed_url: state.contactForm?.mapEmbedUrl,
    contact_details_title: state.contactForm?.detailsTitle,
    contact_email_title: state.labels?.contactEmailTitle,
    contact_phone_title: state.labels?.contactPhoneTitle,
    contact_address_title: state.labels?.contactAddressTitle,
    contact_form_title: state.contactForm?.formTitle,
    contact_name_label: state.contactForm?.nameLabel,
    contact_email_label: state.contactForm?.emailLabel,
    contact_phone_label: state.contactForm?.phoneLabel,
    contact_message_label: state.contactForm?.messageLabel,
    contact_submit_label: state.contactForm?.submitLabel,
    inpi_note: state.inpiNote,
    footer_note: state.site.footerNote,
  };
  renderAll();
}

function kindConfig(kind) {
  return {
    sections: { table: "landing_sections", items: state.sections },
    schedule: { table: "schedule_slots", items: state.schedule },
    team: { table: "team_members", items: state.team },
    highlights: { table: "highlights", items: state.highlights },
    gallery: { table: "gallery_items", items: state.gallery },
    links: { table: "partner_links", items: state.links },
    resources: { table: "resource_cards", items: state.resources },
    equipment: { table: "equipment_items", items: state.equipment },
  }[kind];
}

async function saveRow(kind, id) {
  const config = kindConfig(kind);
  const values = { id };
  document.querySelectorAll(`[data-kind="${kind}"][data-id="${id}"]`).forEach((input) => {
    values[input.dataset.field] = input.type === "checkbox" ? (input.checked ? 1 : 0) : input.value;
  });
  await api("/api/admin/content", {
    method: "POST",
    body: JSON.stringify({ table: config.table, action: "upsert", values }),
  });
}

async function swapOrder(kind, id, direction) {
  const config = kindConfig(kind);
  const items = [...config.items].sort((a, b) => Number(a.display_order) - Number(b.display_order));
  const index = items.findIndex((item) => String(item.id) === String(id));
  const otherIndex = index + Number(direction);
  if (index < 0 || otherIndex < 0 || otherIndex >= items.length) return;
  const current = items[index];
  const other = items[otherIndex];
  await api("/api/admin/content", {
    method: "POST",
    body: JSON.stringify({ table: config.table, action: "upsert", values: { id: current.id, display_order: other.display_order } }),
  });
  await api("/api/admin/content", {
    method: "POST",
    body: JSON.stringify({ table: config.table, action: "upsert", values: { id: other.id, display_order: current.display_order } }),
  });
  await loadAdmin();
}

function buildNewItem(kind) {
  const id = crypto.randomUUID();
  if (kind === "sections") return { id, section_key: "new_section", title: "Nouvelle section", subtitle: "", enabled: 0, display_order: (state.sections || []).length + 1 };
  if (kind === "schedule") return { id, day_label: "Jour", time_label: "Horaire", note: "", display_order: (state.schedule || []).length + 1 };
  if (kind === "team") return { id, full_name: "Nouveau membre", role_label: "Rôle", belt_label: "", bio: "", display_order: (state.team || []).length + 1 };
  if (kind === "highlights") return { id, title: "Nouvel encart", body: "", badge: "", cta_label: "", cta_href: "", display_order: (state.highlights || []).length + 1 };
  if (kind === "gallery") return { id, title: "Nouvelle image", image_url: "", alt_text: "", display_order: (state.gallery || []).length + 1 };
  if (kind === "links") return { id, title: "Nouveau lien", href: "https://", cta_label: "Accéder", description: "", display_order: (state.links || []).length + 1 };
  if (kind === "resources") return { id, title: "Nouvelle ressource", cta_label: "Ouvrir", cta_href: "https://", description: "", image_url: "", display_order: (state.resources || []).length + 1 };
  if (kind === "equipment") return { id, title: "Nouvel équipement", cta_label: "Voir", cta_href: "https://", description: "", image_url: "", display_order: (state.equipment || []).length + 1 };
  return null;
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  // Ignorer les boutons gérés exclusivement par admin-ui.js
  // pour éviter que cet écouteur générique ne les intercepte en premier.
  const HANDLED_BY_UI = [
    "[data-save-settings]",
    "[data-save-modal]",
    "[data-close-modal]",
    "[data-confirm-delete]",
    "[data-delete]",
    "[data-save-order]",
    "[data-upload-image]",
  ];
  if (HANDLED_BY_UI.some((sel) => button.matches(sel))) return;

  try {
    if (button.dataset.add) {
      const kind = button.dataset.add;
      const config = kindConfig(kind);
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({ table: config.table, action: "upsert", values: buildNewItem(kind) }),
      });
      await loadAdmin();
    }
    if (button.dataset.move) {
      await swapOrder(button.dataset.move, button.dataset.id, Number(button.dataset.direction));
    }
    if (button.dataset.messageStatus) {
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({ action: "mark-message", id: button.dataset.messageStatus, status: button.dataset.status }),
      });
      await loadAdmin();
    }
    if (button.id === "refresh-button") {
      await loadAdmin();
      showStatus("admin-status", "Données rechargées.", false);
    }
    if (button.id === "logout-button") {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      window.location.reload();
    }
    if (button.dataset.changePassword !== undefined) {
      const form = document.getElementById("password-form");
      const formData = new FormData(form);
      await api("/api/auth/password", { method: "POST", body: JSON.stringify(Object.fromEntries(formData.entries())) });
      form.reset();
      showStatus("admin-status", "Mot de passe mis à jour.", false);
    }
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur");
  }
});

async function handleInlineFieldChange(event) {
  if (!event.target || typeof event.target.closest !== "function") return;
  const input = event.target.closest("[data-kind]");
  if (!input) return;
  // For blur, only save if the value actually changed (avoid spurious saves)
  if (event.type === "blur" && !input.dataset.dirty) return;
  input.dataset.dirty = "";
  try {
    await saveRow(input.dataset.kind, input.dataset.id);
    await loadAdmin();
    showStatus("admin-status", "Modification enregistrée.", false);
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur");
  }
}

document.addEventListener("change", handleInlineFieldChange);
document.addEventListener("blur", handleInlineFieldChange, true); // capture phase for blur

// Mark field dirty on any input so blur knows a change happened
document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-kind]");
  if (input) input.dataset.dirty = "1";
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("login-status");
  status.textContent = "Connexion...";
  try {
    const formData = new FormData(event.currentTarget);
    await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(formData.entries())) });
    document.getElementById("login-screen").hidden = true;
    document.getElementById("admin-app").hidden = false;
    await loadAdmin();
    status.textContent = "";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Erreur";
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await api("/api/auth/session", { method: "GET" });
    document.getElementById("login-screen").hidden = true;
    document.getElementById("admin-app").hidden = false;
    await loadAdmin();
  } catch {
    document.getElementById("login-screen").hidden = false;
  }
});
