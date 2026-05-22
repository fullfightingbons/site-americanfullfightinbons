const SETTINGS_FIELDS = [
  ["club_name", "Nom du club"],
  ["hero_kicker", "Accroche hero"],
  ["hero_title", "Titre hero"],
  ["hero_body", "Texte hero"],
  ["announcement_badge", "Badge annonce"],
  ["announcement_title", "Titre annonce"],
  ["announcement_body", "Texte annonce"],
  ["contact_email", "E-mail"],
  ["contact_phone", "Téléphone"],
  ["contact_address", "Adresse"],
  ["club_story", "Présentation du club"],
  ["hero_primary_label", "CTA principal"],
  ["hero_primary_href", "Lien CTA principal"],
  ["hero_secondary_label", "CTA secondaire"],
  ["hero_secondary_href", "Lien CTA secondaire"],
  ["spotlight_date", "Date à la une"],
  ["spotlight_title", "Titre à la une"],
  ["spotlight_body", "Texte à la une"],
  ["spotlight_cta_label", "Bouton à la une"],
  ["spotlight_cta_href", "Lien bouton à la une"],
  ["spotlight_secondary_label", "Bouton secondaire à la une"],
  ["spotlight_secondary_href", "Lien bouton secondaire à la une"],
  ["resources_intro", "Intro membre actif"],
  ["equipment_intro", "Intro équipement"],
  ["sponsor_title", "Titre mécénat"],
  ["sponsor_body", "Texte mécénat"],
  ["sponsor_cta_label", "Bouton mécénat"],
  ["sponsor_cta_href", "Lien mécénat"],
  ["inpi_note", "Note INPI"],
  ["footer_note", "Texte footer"],
];

let state = null;

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
  form.innerHTML = SETTINGS_FIELDS.map(([key, label]) => `
    <label>
      <span>${label}</span>
      <textarea name="${key}" rows="${key.includes("body") || key.includes("story") ? 4 : 2}">${String((state.siteSettings || {})[key] || "")}</textarea>
    </label>
  `).join("");
}

function rowControls(kind, item) {
  return `
    <div class="admin-item-actions">
      ${item.display_order !== undefined ? `<button class="btn btn-dark" type="button" data-move="${kind}" data-id="${item.id}" data-direction="-1">Monter</button>
      <button class="btn btn-dark" type="button" data-move="${kind}" data-id="${item.id}" data-direction="1">Descendre</button>` : ""}
      ${item.id !== "shared" && item.key !== "protected" ? `<button class="btn btn-red" type="button" data-delete="${kind}" data-id="${item.id}">Supprimer</button>` : ""}
    </div>
  `;
}

function renderSectionsEditor() {
  document.getElementById("sections-editor").innerHTML = (state.sections || []).map((item) => `
    <article class="admin-item">
      <div class="admin-item-head">
        <div class="admin-item-title">${item.section_key}</div>
        ${rowControls("sections", item)}
      </div>
      <div class="admin-item-grid">
        <label><span>Titre</span><input data-field="title" data-kind="sections" data-id="${item.id}" value="${item.title || ""}"></label>
        <label><span>Sous-titre</span><input data-field="subtitle" data-kind="sections" data-id="${item.id}" value="${item.subtitle || ""}"></label>
        <label class="admin-inline"><input type="checkbox" data-field="enabled" data-kind="sections" data-id="${item.id}" ${Number(item.enabled) === 1 ? "checked" : ""}><span>Section active</span></label>
        <label><span>Ordre</span><input data-field="display_order" data-kind="sections" data-id="${item.id}" type="number" value="${item.display_order || 0}"></label>
      </div>
    </article>
  `).join("");
}

function renderEntityList(targetId, kind, items, fields) {
  document.getElementById(targetId).innerHTML = items.map((item) => `
    <article class="admin-item">
      <div class="admin-item-head">
        <div class="admin-item-title">${item.title || item.full_name || item.day_label || "Élément"}</div>
        ${rowControls(kind, item)}
      </div>
      <div class="admin-item-grid">
        ${fields.map((field) => {
          const full = field.type === "textarea" ? "full" : "";
          const input = field.type === "textarea"
            ? `<textarea data-field="${field.key}" data-kind="${kind}" data-id="${item.id}" rows="4">${item[field.key] || ""}</textarea>`
            : `<input data-field="${field.key}" data-kind="${kind}" data-id="${item.id}" type="${field.type || "text"}" value="${item[field.key] || ""}">`;
          return `<label class="${full}"><span>${field.label}</span>${input}</label>`;
        }).join("")}
      </div>
    </article>
  `).join("");
}

function renderMessages() {
  document.getElementById("messages-editor").innerHTML = (state.messages || []).map((item) => `
    <article class="admin-item">
      <div class="admin-item-head">
        <div class="admin-item-title">${item.full_name}</div>
        <div class="admin-item-actions">
          <button class="btn btn-dark" type="button" data-message-status="${item.id}" data-status="new">Nouveau</button>
          <button class="btn btn-dark" type="button" data-message-status="${item.id}" data-status="read">Lu</button>
          <button class="btn btn-dark" type="button" data-message-status="${item.id}" data-status="done">Traité</button>
        </div>
      </div>
      <p><strong>${item.email}</strong> ${item.phone ? `· ${item.phone}` : ""} · ${item.created_at}</p>
      <p>${item.message}</p>
      <p>Statut: ${item.status}</p>
    </article>
  `).join("");
}

function renderPricing() {
  document.getElementById("pricing-readonly").innerHTML = (state.pricing || []).map((item) => `
    <article class="admin-item">
      <div class="admin-item-title">${item.title}</div>
      <p><strong>${item.price_label}</strong></p>
      <p>${item.description}</p>
      <p>Source: ${item.badge || state.pricingSource}</p>
    </article>
  `).join("");
}

function renderAll() {
  document.getElementById("admin-user").textContent = `${state.user.display_name} · ${state.user.email}`;
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
    contact_email: state.site.email,
    contact_phone: state.site.phone,
    contact_address: state.site.address,
    club_story: state.story,
    hero_kicker: state.hero.kicker,
    hero_title: state.hero.title,
    hero_body: state.hero.body,
    announcement_badge: state.announcement.badge,
    announcement_title: state.announcement.title,
    announcement_body: state.announcement.body,
    hero_primary_label: state.hero.primaryLabel,
    hero_primary_href: state.hero.primaryHref,
    hero_secondary_label: state.hero.secondaryLabel,
    hero_secondary_href: state.hero.secondaryHref,
    spotlight_date: state.spotlight.date,
    spotlight_title: state.spotlight.title,
    spotlight_body: state.spotlight.body,
    spotlight_cta_label: state.spotlight.primaryLabel,
    spotlight_cta_href: state.spotlight.primaryHref,
    spotlight_secondary_label: state.spotlight.secondaryLabel,
    spotlight_secondary_href: state.spotlight.secondaryHref,
    resources_intro: state.resourcesIntro,
    equipment_intro: state.equipmentIntro,
    sponsor_title: state.sponsor.title,
    sponsor_body: state.sponsor.body,
    sponsor_cta_label: state.sponsor.ctaLabel,
    sponsor_cta_href: state.sponsor.ctaHref,
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
  if (kind === "schedule") return { id, day_label: "Jour", time_label: "Horaire", note: "", display_order: (state.schedule || []).length + 1 };
  if (kind === "team") return { id, full_name: "Nouveau membre", role_label: "Rôle", belt_label: "", bio: "", display_order: (state.team || []).length + 1 };
  if (kind === "highlights") return { id, title: "Nouvel encart", body: "", badge: "", cta_label: "", cta_href: "", display_order: (state.highlights || []).length + 1 };
  if (kind === "gallery") return { id, title: "Nouvelle image", image_url: "", alt_text: "", display_order: (state.gallery || []).length + 1 };
  if (kind === "links") return { id, title: "Nouveau lien", href: "https://", description: "", display_order: (state.links || []).length + 1 };
  if (kind === "resources") return { id, title: "Nouvelle ressource", cta_label: "Ouvrir", cta_href: "https://", description: "", image_url: "", display_order: (state.resources || []).length + 1 };
  if (kind === "equipment") return { id, title: "Nouvel équipement", cta_label: "Voir", cta_href: "https://", description: "", image_url: "", display_order: (state.equipment || []).length + 1 };
  return null;
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  try {
    if (button.dataset.saveSettings !== undefined) {
      const form = document.getElementById("settings-form");
      const formData = new FormData(form);
      for (const [key, value] of formData.entries()) {
        await api("/api/admin/content", {
          method: "POST",
          body: JSON.stringify({ table: "site_settings", action: "upsert", values: { key, value } }),
        });
      }
      showStatus("admin-status", "Réglages enregistrés.", false);
      await loadAdmin();
    }
    if (button.dataset.add) {
      const kind = button.dataset.add;
      const config = kindConfig(kind);
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({ table: config.table, action: "upsert", values: buildNewItem(kind) }),
      });
      await loadAdmin();
    }
    if (button.dataset.delete) {
      const kind = button.dataset.delete;
      const config = kindConfig(kind);
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({ table: config.table, action: "delete", id: button.dataset.id }),
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

document.addEventListener("change", async (event) => {
  const input = event.target.closest("[data-kind]");
  if (!input) return;
  try {
    await saveRow(input.dataset.kind, input.dataset.id);
    await loadAdmin();
    showStatus("admin-status", "Modification enregistrée.", false);
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur");
  }
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
