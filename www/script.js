// Main Application Orchestration
import {
  loadState,
  addTrack,
  removeTrack,
  updateTrack,
  setApiKey,
  state,
} from "./state.js";
import {
  refreshCredits,
  checkServer,
  loadHistory,
  deleteHistoryItem,
} from "./api.js";
import {
  initializeElements,
  getElements,
  addLog,
  updateCreditsBadge,
  updateServerStatus,
  updateUIForRunning,
  renderTracks,
  addResult,
  renderHistory,
  showHistoryError,
  setupApiKeyHandlers,
} from "./ui.js";
import { startRemixProcess } from "./remix.js";

// Initialize application
function init() {
  // Load initial state
  loadState();

  // Initialize UI elements
  const elements = initializeElements();

  // Check if API key exists, show prompt if not
  if (!state.apiKey) {
    showApiKeyPrompt();
  } else {
    // Only refresh credits if API key exists
    refreshCreditsUI();
  }

  // Initial render
  renderTracks(handleTrackUpdate, removeTrack, null);
  checkServerUI();
  loadHistoryUI();

  // Setup API key handlers
  setupApiKeyHandlers(setApiKey, addLog, refreshCreditsUI);

  // Setup event listeners
  setupEventListeners();
}

// Show API key prompt for first-time users
function showApiKeyPrompt() {
  // Capture previously focused element before creating modal
  const prevFocusedElement = document.activeElement;

  const modal = document.createElement("div");
  modal.className = "api-key-modal";

  // Add keyboard accessibility
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "api-key-modal-title");

  modal.innerHTML = `
    <div class="modal-content">
      <h3 id="api-key-modal-title">🔑 Welcome to Suno Remix At Home!</h3>
      <p>To get started, you'll need a Suno API key.</p>
      <div class="api-key-steps">
        <h4>How to get your API key:</h4>
        <ol>
          <li>Visit <a href="https://sunoapi.org" target="_blank">sunoapi.org</a></li>
          <li>Go to your account settings</li>
          <li>Find the API section and generate your key</li>
          <li>Copy the key and paste it below</li>
        </ol>
      </div>
      <div class="modal-footer">
        <small>Your API key will be stored locally in your browser only.</small>
        <button id="welcome-close-modal" class="btn btn-secondary">Close</button>
      </div>
    </div>
  `;

  // Add modal styles with focus trap
  const style = document.createElement("style");
  style.textContent = `
    .api-key-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    
    .api-key-modal:focus-within {
      outline: 2px solid var(--accent);
    }
    
    .modal-content {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      color: #ffffff;
    }
    
    .modal-content h3 {
      color: #ffffff;
      margin: 0 0 1rem 0;
    }
    
    .modal-content p {
      color: #cccccc;
      margin: 0 0 1.5rem 0;
    }
    
    .api-key-steps {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #2a2a2a;
      border-radius: 8px;
      border: 1px solid #444;
    }
    
    .api-key-steps h4 {
      margin: 0 0 0.5rem 0;
      color: #ffffff;
    }
    
    .api-key-steps ol {
      margin: 0;
      padding-left: 1.5rem;
      color: #cccccc;
    }
    
    .api-key-steps li {
      margin: 0.5rem 0;
    }
    
    .api-key-steps a {
      color: #4a9eff;
      text-decoration: none;
    }
    
    .api-key-steps a:hover {
      text-decoration: underline;
    }
    
    .modal-footer {
      margin-top: 2rem;
      text-align: center;
      padding: 1rem 0;
    }
    
    .modal-footer small {
      color: #888888;
      display: block;
      margin-bottom: 1rem;
    }
    
    #welcome-close-modal {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      min-width: 120px;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  // Focus trap and escape key handling
  const handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.removeChild(modal);
      document.head.removeChild(style);
      // Restore focus to previously focused element
      if (
        prevFocusedElement &&
        prevFocusedElement.focus &&
        document.contains(prevFocusedElement)
      ) {
        prevFocusedElement.focus();
      }
    }
  };

  document.addEventListener("keydown", handleEscapeKey);

  // Add close button handler
  document
    .getElementById("welcome-close-modal")
    .addEventListener("click", () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.removeChild(modal);
      document.head.removeChild(style);
      // Restore focus to previously focused element
      if (
        prevFocusedElement &&
        prevFocusedElement.focus &&
        document.contains(prevFocusedElement)
      ) {
        prevFocusedElement.focus();
      }
    });

  // Focus close button
  document.getElementById("welcome-close-modal").focus();
}

// Track update handler
function handleTrackUpdate(trackId, field, value) {
  updateTrack(trackId, { [field]: value });
}

// Event Listeners Setup
function setupEventListeners() {
  const elements = getElements();

  elements.addTrackBtn.addEventListener("click", () => {
    addTrack();
    renderTracks(handleTrackUpdate, removeTrack, null);
  });

  elements.runBtn.addEventListener("click", startRemix);
  elements.refreshCreditsBtn.addEventListener("click", refreshCreditsUI);
  elements.refreshHistoryBtn.addEventListener("click", loadHistoryUI);

  elements.clearLogsBtn.addEventListener("click", () => {
    elements.consoleOutput.innerHTML = "";
    addLog("Console cleared.", "info");
  });

  // Custom event listener for history item deletion
  document.addEventListener("deleteHistoryItem", async (e) => {
    const { timestamp, variantId } = e.detail;
    await deleteHistoryItemUI(timestamp, variantId);
  });
}

// File upload functionality removed - no longer needed

// UI Update Functions
async function refreshCreditsUI() {
  const { credits, error } = await refreshCredits(addLog);
  if (error) {
    addLog(`Failed to refresh credits: ${error}`, "error");
  } else if (credits !== null) {
    updateCreditsBadge(credits);
  }
}

async function checkServerUI() {
  const statusInfo = await checkServer();
  updateServerStatus(statusInfo);
}

async function loadHistoryUI() {
  const { history, error } = await loadHistory(addLog);
  if (error) {
    showHistoryError(error);
  } else {
    renderHistory(history);
  }
}

async function deleteHistoryItemUI(timestamp, variantId) {
  const { success, error } = await deleteHistoryItem(
    timestamp,
    variantId,
    addLog,
  );
  if (success) {
    loadHistoryUI();
  } else if (error && error !== "User cancelled deletion") {
    addLog(`Failed to delete item: ${error}`, "error");
  }
}

// Remix Process
async function startRemix() {
  updateUIForRunning(true);

  // Get elements for results grid
  const elements = getElements();

  // Clear current results before starting new remix
  elements.resultsGrid.innerHTML =
    '<div class="empty-state">Processing... Your remix results will appear here.</div>';

  // Flag to track if results have been cleared
  let resultsCleared = false;

  const success = await startRemixProcess(
    addLog,
    (result) => {
      // Clear the processing message only once
      if (!resultsCleared) {
        elements.resultsGrid.innerHTML = "";
        resultsCleared = true;
      }
      addResult(result);
    },
    async () => {
      updateUIForRunning(false);
      await refreshCreditsUI();
    },
    (error) => {
      addLog(error, "error");
      updateUIForRunning(false);
    },
  );

  if (!success) {
    updateUIForRunning(false);
  }
}

// Start the application
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
