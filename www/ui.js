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

    // File upload functionality removed - no upload button available
    // Users should use any public hosting service and paste URLs directly

    card
      .querySelector(".remove-track")
      .addEventListener("click", () => onTrackRemove(track.id));

    elements.tracksContainer.appendChild(clone);
  });
}

export function addResult(result, container = elements.resultsGrid) {
  const template = document.getElementById("result-template");
  const fragment = document.createDocumentFragment();

  result.variants.forEach((v) => {
    const clone = template.content.cloneNode(true);
    
    // Update result content
    clone.querySelector(".res-title").textContent = v.title || result.title;
    clone.querySelector(".res-dur").textContent = v.duration || "--";
    
    const audio = clone.querySelector(".res-audio");
    audio.src = v.audioUrl;
    audio.controls = true;
    audio.preload = 'metadata';
    
    // Add error handling for Suno URLs
    audio.addEventListener('error', () => {
      if (v.audioUrl && v.audioUrl.includes('tempfile.aiquickdraw.com')) {
        console.warn('Suno URL may be expired. Try refreshing.');
      }
    });
    
    const link = clone.querySelector(".res-link");
    const isSunoUrl = v.audioUrl && v.audioUrl.includes('tempfile.aiquickdraw.com');
    
    // Smart download behavior based on URL type
    if (isSunoUrl) {
      link.href = v.audioUrl;  // Direct Suno URL
      link.textContent = '🌐 Download';
      link.download = '';  // Can't download direct Suno URLs
      link.setAttribute('data-url-type', 'suno');
    } else {
      link.href = v.localUrl || v.audioUrl;  // Local file
      link.textContent = '💾 Download Local';
      link.download = `${v.title || result.title}.mp3`;
      link.setAttribute('data-url-type', 'local');
    }
    
    // Handle Cover Art
    if (v.imageUrl) {
      const img = clone.querySelector(".res-image");
      img.src = v.imageUrl;
      img.alt = `${v.title || result.title} cover art`;
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
  
  // For current results: prepend (newest first)
  // For history: append (chronological order)
  if (container === elements.resultsGrid) {
    container.prepend(fragment);
  } else {
    container.appendChild(fragment);
  }
}

export function renderHistory(history, onDeleteItem) {
  elements.historyGrid.innerHTML = "";
  
  // Ensure history is an array
  const historyArray = Array.isArray(history) ? history : [];
  
  if (historyArray.length === 0) {
    elements.historyGrid.innerHTML = '<div class="empty-state">No past remixes found.</div>';
  } else {
    // Render history in chronological order (oldest first)
    historyArray.forEach((item) => addResult(item, elements.historyGrid));
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
