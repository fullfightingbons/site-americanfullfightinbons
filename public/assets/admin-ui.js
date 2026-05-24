// admin-ui.js — Compléments UI pour le Visual Builder AFFBC
// Ce fichier gère : validation Maps, preview Maps, générateur URL Maps,
// upload image, et badge des messages non lus dans la sidebar.

// ─── Fonctions modales (compat avec admin.js) ─────────────────

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

// ─── Validation URL Google Maps embed ────────────────────────

function validateGoogleMapsUrl(url) {
  if (!url) return true;
  if (url.startsWith("https://www.google.com/maps/embed")) return true;
  if (url.includes("google.com/maps") && !url.includes("/embed")) return false;
  return true;
}

// ─── Fermeture modales (click sur [data-close-modal]) ────────

document.addEventListener("click", (event) => {
  const target = event.target;
  if (target.matches("[data-close-modal]")) {
    closeAllModals();
  }
});

// ─── Prévisualisation Google Maps en temps réel ───────────────

document.addEventListener("input", (event) => {
  if (event.target.name === "contact_map_embed_url") {
    const iframe = document.getElementById("map-preview");
    if (iframe) iframe.src = event.target.value;
  }
});

// ─── Badge messages non lus dans la sidebar ───────────────────

function updateMessagesBadge() {
  // Appelé après loadAdmin() si la variable state est disponible
  const badge = document.getElementById("messages-badge");
  if (!badge) return;
  if (typeof state !== "undefined" && state?.messages) {
    const count = state.messages.filter((m) => m.status === "new").length;
    badge.textContent = count > 0 ? String(count) : "";
  }
}

// Observe les mutations du DOM pour détecter les re-renders de loadAdmin
const _badgeObserver = new MutationObserver(() => updateMessagesBadge());
const _messagesPanel = document.getElementById("panel-messages");
if (_messagesPanel) {
  _badgeObserver.observe(_messagesPanel, { childList: true, subtree: false });
}

// Écoute aussi les clics sur refresh pour forcer la mise à jour
document.addEventListener("click", (event) => {
  if (event.target.closest("#refresh-button")) {
    setTimeout(updateMessagesBadge, 600);
  }
});

// ─── Upload image ─────────────────────────────────────────────

let uploadContext = null;

function openUploadModal(_context) {
  // Upload endpoint (/api/admin/upload) non implémenté.
  // Guider l'admin à coller une URL directement.
  if (typeof showStatus === "function") {
    showStatus("L'upload direct n'est pas encore disponible. Collez une URL d'image dans le champ correspondant.", true);
  }
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

    if (typeof kindConfig === "function" && typeof api === "function") {
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
      if (typeof loadAdmin === "function") await loadAdmin();
      if (typeof showStatus === "function") showStatus("Image mise à jour.", false);
    }
  } catch (error) {
    if (typeof showStatus === "function") {
      showStatus(error instanceof Error ? error.message : "Erreur upload");
    }
  } finally {
    uploadContext = null;
    closeModal("modal-upload");
  }
});

// ─── Validation Google Maps à la sauvegarde (legacy compat) ──

document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-save-settings]");
  if (!btn) return;

  const form = document.getElementById("settings-form");
  if (!form) return;

  const formData = new FormData(form);
  const mapUrl = (formData.get("contact_map_embed_url") ?? "").trim();
  if (mapUrl && !validateGoogleMapsUrl(mapUrl)) {
    if (typeof showStatus === "function") {
      showStatus("URL Google Maps invalide. Elle doit commencer par https://www.google.com/maps/embed");
    }
    return;
  }

  btn.disabled = true;
  if (typeof showStatus === "function") showStatus("Enregistrement en cours…", false);

  try {
    for (const [key, value] of formData.entries()) {
      if (typeof api === "function") {
        await api("/api/admin/content", {
          method: "POST",
          body: JSON.stringify({ table: "site_settings", action: "upsert", values: { key, value } }),
        });
      }
    }
    if (typeof showStatus === "function") showStatus("Réglages enregistrés.", false);
    if (typeof loadAdmin === "function") await loadAdmin();
  } catch (error) {
    if (typeof showStatus === "function") {
      showStatus(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    }
  } finally {
    btn.disabled = false;
  }
});
