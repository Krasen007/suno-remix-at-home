// UI Management Module
import { state } from './state.js';

// DOM Elements cache
let elements = {};

export function initializeElements() {
  elements = {
    tracksContainer: document.getElementById("tracks-container"),
    consoleOutput: document.getElementById("console-output"),
    resultsGrid: document.getElementById("results-grid"),
    addTrackBtn: document.getElementById("add-track"),
    runBtn: document.getElementById("run-btn"),
    creditsBadge: document.getElementById("credits-badge"),
    refreshCreditsBtn: document.getElementById("refresh-credits"),
    clearLogsBtn: document.getElementById("clear-logs"),
    refreshHistoryBtn: document.getElementById("refresh-history"),
    historyGrid: document.getElementById("history-grid"),
    serverStatus: document.getElementById("server-status"),
    apiKeyInput: document.getElementById("api-key-input"),
    saveApiKeyBtn: document.getElementById("save-api-key"),
  };
  return elements;
}

export function getElements() {
  return elements;
}

export function addLog(message, level = "info") {
  const log = document.createElement("div");
  log.className = `log ${level}`;
  const time = new Date().toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  log.textContent = `[${time}] ${message}`;
  elements.consoleOutput.appendChild(log);
  elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}

export function updateCreditsBadge(credits) {
  elements.creditsBadge.textContent = `Credits: ${credits}`;
  elements.creditsBadge.style.color = credits > 0 ? "var(--primary)" : "var(--danger)";
}

export function updateServerStatus(statusInfo) {
  elements.serverStatus.textContent = statusInfo.text;
  elements.serverStatus.style.color = statusInfo.color;
}

export function updateUIForRunning(running) {
  elements.runBtn.disabled = running;
  elements.runBtn.querySelector(".btn-text").textContent = running
    ? "Processing..."
    : "Start Remixing";
  elements.runBtn.querySelector(".loader-dots").classList.toggle("hidden", !running);
  document
    .querySelectorAll(".remove-track, #add-track, input, textarea")
    .forEach((el) => {
      el.disabled = running;
    });
}

export function renderTracks(onTrackUpdate, onTrackRemove, onFileUpload) {
  elements.tracksContainer.innerHTML = "";
  const template = document.getElementById("track-template");

  state.tracks.forEach((track, index) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".track-card");

    card.querySelector(".track-index").textContent = `#${index + 1}`;

    const fields = [
      { class: ".track-title", field: "title" },
      { class: ".track-url", field: "url" },
      { class: ".track-style", field: "style" },
      { class: ".track-prompt", field: "prompt" },
      { class: ".track-custom", field: "customMode", type: "checkbox" },
      { class: ".track-instrumental", field: "instrumental", type: "checkbox" },
    ];

    fields.forEach((f) => {
      const input = card.querySelector(f.class);
      const label = input.closest(".form-group")?.querySelector("label") || 
                    input.closest(".checkbox-label");
      const uniqueId = `track-${track.id}-${f.field}`;
      
      input.id = uniqueId;
      if (label && label.tagName === "LABEL") {
        label.setAttribute("for", uniqueId);
      }

      if (f.type === "checkbox") {
        input.checked = track[f.field];
        input.addEventListener("change", (e) =>
          onTrackUpdate(track.id, f.field, e.target.checked),
        );
      } else {
        input.value = track[f.field] || (f.field === "url" ? track.url : "") || "";
        input.addEventListener("input", (e) =>
          onTrackUpdate(track.id, f.field, e.target.value),
        );
      }
    });

    // Handle file upload
    const uploadBtn = card.querySelector(".upload-btn");
    const fileInput = card.querySelector(".file-input");
    const urlInput = card.querySelector(".track-url");

    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";
      
      const url = await onFileUpload(file, track.id);
      
      uploadBtn.disabled = false;
      uploadBtn.textContent = "📤 Upload";
      fileInput.value = "";
      
      if (url) {
        urlInput.value = url;
      }
    });

    card
      .querySelector(".remove-track")
      .addEventListener("click", () => onTrackRemove(track.id));

    elements.tracksContainer.appendChild(clone);
  });
}

export function addResult(result, container = elements.resultsGrid) {
  // Clear empty state if first result
  if (container.querySelector(".empty-state")) {
    container.innerHTML = "";
  }

  const template = document.getElementById("result-template");

  // Insert new results at the top (reverse order for newest first)
  const fragment = document.createDocumentFragment();
  
  result.variants.forEach((v, i) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".res-title").textContent =
      `${result.title} (v${i + 1})`;
    clone.querySelector(".res-dur").textContent = v.duration || "--";
    
    // Prioritize local URL for playback if it exists
    clone.querySelector(".res-audio").src = v.localUrl || v.audioUrl;
    clone.querySelector(".res-link").href = v.audioUrl;

    // Display cover art
    const img = clone.querySelector(".res-image");
    const imageUrl = v.imageUrl || (result.images && result.images[i]) || (result.images && result.images[0]);
    if (imageUrl) {
      img.src = imageUrl;
      img.classList.remove("hidden");
    }

    // Handle Deletion (History Only)
    if (container === elements.historyGrid) {
      const delBtn = clone.querySelector(".res-delete");
      delBtn.classList.remove("hidden");
      delBtn.addEventListener("click", () => {
        // This will be handled by the main app
        const event = new CustomEvent('deleteHistoryItem', {
          detail: { timestamp: result.timestamp, variantId: v.id }
        });
        document.dispatchEvent(event);
      });
    }

    fragment.appendChild(clone);
  });
  
  // Prepend to container for newest-first ordering
  container.prepend(fragment);
}

export function renderHistory(history, onDeleteItem) {
  elements.historyGrid.innerHTML = "";
  if (history.length === 0) {
    elements.historyGrid.innerHTML = '<div class="empty-state">No past remixes found.</div>';
  } else {
    history.forEach((item) => addResult(item, elements.historyGrid));
  }
}

export function showHistoryError(message) {
  elements.historyGrid.innerHTML = `<div class="empty-state">${message}</div>`;
}

export function setupApiKeyHandlers(setApiKey, addLog, refreshCreditsUI) {
  // Load saved API key into input
  if (state.apiKey) {
    elements.apiKeyInput.value = state.apiKey;
  }

  // Handle save button click
  elements.saveApiKeyBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent form submission
    const apiKey = elements.apiKeyInput.value.trim();
    if (!apiKey) {
      addLog('Please enter an API key', 'error');
      return;
    }
    
    setApiKey(apiKey);
    addLog('API key saved successfully', 'success');
    
    // Auto-refresh credits after saving new API key
    refreshCreditsUI();
  });

  // Handle Enter key in input
  elements.apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      elements.saveApiKeyBtn.click();
    }
  });
}
