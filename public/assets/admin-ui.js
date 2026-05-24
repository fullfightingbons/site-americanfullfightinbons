// Utilitaires modales
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function closeAllModals() {
  ["modal-editor", "modal-delete", "modal-upload", "modal-order"].forEach(closeModal);
}

// Validation URL Google Maps embed
// Bloque uniquement les URL Google Maps normales (non-embed)
// pour guider l'admin, sans bloquer les URL vides ou inconnues.
function validateGoogleMapsUrl(url) {
  if (!url) return true; // champ vide toujours autorisé
  // URL embed valides
  if (url.startsWith("https://www.google.com/maps/embed")) return true;
  // URL Google Maps classiques (non-embed) : on bloque pour guider l'admin
  if (url.includes("google.com/maps") && !url.includes("/embed")) return false;
  // Toute autre URL : on laisse passer (permet des solutions tierces)
  return true;
}

// Fermeture modales
document.addEventListener("click", (event) => {
  const target = event.target;
  if (target.matches("[data-close-modal]")) {
    closeAllModals();
  }
});

// Prévisualisation Google Maps dans l’admin
document.addEventListener("input", (event) => {
  if (event.target.name === "contact_map_embed_url") {
    const iframe = document.getElementById("map-preview");
    if (iframe) iframe.src = event.target.value;
  }
});

// Générateur d’URL Google Maps (sans clé API)
// Ouvre Google Maps sur l’adresse et guide l’admin pour copier l’URL embed
document.getElementById("generate-map-url")?.addEventListener("click", () => {
  const address = prompt(“Entrez l’adresse du club :”);
  if (!address) return;

  const encoded = encodeURIComponent(address);

  // Ouvre Google Maps dans un nouvel onglet pour que l’admin copie l’URL embed
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");

  showStatus(
    "admin-status",
    "Google Maps s’est ouvert dans un nouvel onglet. Dans Google Maps : cliquez sur « Partager » → « Intégrer une carte » → copiez l’URL src de l’iframe (commence par https://www.google.com/maps/embed?pb=) et collez-la dans le champ ci-dessus.",
    false
  );
});

// Hook modale d’édition
function openEditModal(config) {
  const form = document.getElementById("modal-editor-form");
  if (!form) return;
  form.innerHTML = "";

  config.fields.forEach((field) => {
    const wrapper = document.createElement("label");
    wrapper.className = "premium-field";
    const span = document.createElement("span");
    span.textContent = field.label;
    wrapper.appendChild(span);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = field.rows || 4;
    } else {
      input = document.createElement("input");
      input.type = field.type || "text";
    }
    input.name = field.key;
    input.value = config.values[field.key] ?? "";
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  form.dataset.kind = config.kind;
  form.dataset.id = config.id;
  openModal("modal-editor");
}

// Sauvegarde modale d’édition
document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-save-modal]");
  if (!btn) return;
  const form = document.getElementById("modal-editor-form");
  if (!form) return;

  const kind = form.dataset.kind;
  const id = form.dataset.id;
  if (!kind || !id) return;

  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });

  try {
    await api("/api/admin/content", {
      method: "POST",
      body: JSON.stringify({
        table: kindConfig(kind).table,
        action: "upsert",
        values: { id, ...data },
      }),
    });
    await loadAdmin();
    closeModal("modal-editor");
    showStatus("admin-status", "Élément mis à jour.", false);
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur");
  }
});

// Confirmation suppression
let pendingDelete = null;

document.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-delete]");
  if (!btn) return;
  pendingDelete = { kind: btn.dataset.delete, id: btn.dataset.id };
  openModal("modal-delete");
});

document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-confirm-delete]");
  if (!btn || !pendingDelete) return;

  try {
    const { kind, id } = pendingDelete;
    const config = kindConfig(kind);
    await api("/api/admin/content", {
      method: "POST",
      body: JSON.stringify({ table: config.table, action: "delete", id }),
    });
    await loadAdmin();
    showStatus("admin-status", "Élément supprimé.", false);
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur");
  } finally {
    pendingDelete = null;
    closeModal("modal-delete");
  }
});

// Modale ordre (drag & drop)
let orderContext = null;

function openOrderModal(kind) {
  const config = kindConfig(kind);
  if (!config) return;
  orderContext = { kind };

  const list = document.getElementById("order-list");
  list.innerHTML = "";

  const items = [...config.items].sort(
    (a, b) => Number(a.display_order) - Number(b.display_order)
  );

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "premium-order-list-item";
    row.draggable = true;
    row.dataset.id = item.id;

    const handle = document.createElement("span");
    handle.className = "handle";
    handle.textContent = "⋮⋮";

    const label = document.createElement("span");
    label.textContent = item.title || item.full_name || item.day_label || "Élément";

    row.appendChild(handle);
    row.appendChild(label);
    list.appendChild(row);
  });

  openModal("modal-order");
}

let dragItem = null;

document.addEventListener("dragstart", (event) => {
  const row = event.target.closest(".premium-order-list-item");
  if (!row) return;
  dragItem = row;
  event.dataTransfer.effectAllowed = "move";
});

document.addEventListener("dragover", (event) => {
  if (!dragItem) return;
  const row = event.target.closest(".premium-order-list-item");
  if (!row || row === dragItem) return;
  event.preventDefault();
  const list = row.parentElement;
  const rect = row.getBoundingClientRect();
  const before = event.clientY < rect.top + rect.height / 2;
  list.insertBefore(dragItem, before ? row : row.nextSibling);
});

document.addEventListener("dragend", () => {
  dragItem = null;
});

document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-save-order]");
  if (!btn || !orderContext) return;

  const list = document.getElementById("order-list");
  const ids = Array.from(list.querySelectorAll(".premium-order-list-item")).map(
    (el) => el.dataset.id
  );

  try {
    const config = kindConfig(orderContext.kind);
    await Promise.all(
      ids.map((id, index) =>
      api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          table: config.table,
          action: "upsert",
          values: { id, display_order: index + 1 },
        }),
      })
      )
    );
    await loadAdmin();
    showStatus("admin-status", "Ordre mis à jour.", false);
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur");
  } finally {
    orderContext = null;
    closeModal("modal-order");
  }
});

// Upload image (à brancher sur /api/admin/upload)
let uploadContext = null;

function openUploadModal(_context) {
  // Upload endpoint (/api/admin/upload) n'est pas encore implémenté.
  // Pour ajouter une image, collez directement une URL dans le champ "URL image".
  showStatus(
    "admin-status",
    "L'upload direct n'est pas encore disponible. Collez une URL d'image dans le champ correspondant.",
    true
  );
}

document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-upload-image]");
  if (!btn || !uploadContext) return;

  const input = document.getElementById("upload-input");
  if (!input || !input.files || !input.files[0]) return;

  const file = input.files[0];

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Erreur upload");

    const imageUrl = payload.url;

    const config = kindConfig(uploadContext.kind);
    await api("/api/admin/content", {
      method: "POST",
      body: JSON.stringify({
        table: config.table,
        action: "upsert",
        values: { id: uploadContext.id, [uploadContext.field]: imageUrl },
      }),
    });

    await loadAdmin();
    showStatus("admin-status", "Image mise à jour.", false);
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur upload");
  } finally {
    uploadContext = null;
    closeModal("modal-upload");
  }
});

// Validation Google Maps à la sauvegarde des réglages
document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-save-settings]");
  if (!btn) return;

  const form = document.getElementById("settings-form");
  if (!form) return;

  const formData = new FormData(form);

  // Valider l'URL Maps seulement si elle est renseignée
  const mapUrl = (formData.get("contact_map_embed_url") ?? "").trim();
  if (mapUrl && !validateGoogleMapsUrl(mapUrl)) {
    showStatus(
      "admin-status",
      "URL Google Maps invalide. Elle doit commencer par https://www.google.com/maps/embed?pb= ou https://www.google.com/maps/embed/v1/",
      true
    );
    return;
  }

  // Feedback immédiat + désactivation du bouton pendant l'envoi
  btn.disabled = true;
  showStatus("admin-status", "Enregistrement en cours…", false);

  try {
    for (const [key, value] of formData.entries()) {
      await api("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({ table: "site_settings", action: "upsert", values: { key, value } }),
      });
    }
    showStatus("admin-status", "Réglages enregistrés.", false);
    await loadAdmin();
  } catch (error) {
    showStatus("admin-status", error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
  } finally {
    btn.disabled = false;
  }
});
