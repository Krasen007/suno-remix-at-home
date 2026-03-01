// Main Application Orchestration
import { loadState, addTrack, removeTrack, updateTrack, setApiKey } from './state.js';
import { refreshCredits, checkServer, loadHistory, deleteHistoryItem } from './api.js';
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
  setupApiKeyHandlers
} from './ui.js';
import { handleFileUpload } from './upload.js';
import { startRemixProcess } from './remix.js';

// Initialize application
function init() {
  // Load initial state
  loadState();
  
  // Initialize UI elements
  const elements = initializeElements();
  
  // Initial render
  renderTracks(updateTrack, removeTrack, handleFileUploadWithLog);
  refreshCreditsUI();
  checkServerUI();
  loadHistoryUI();
  
  // Setup API key handlers
  setupApiKeyHandlers(setApiKey, addLog, refreshCreditsUI);
  
  // Setup event listeners
  setupEventListeners();
}

// Event Listeners Setup
function setupEventListeners() {
  const elements = getElements();
  
  elements.addTrackBtn.addEventListener("click", () => {
    addTrack();
    renderTracks(updateTrack, removeTrack, handleFileUploadWithLog);
  });

  elements.runBtn.addEventListener("click", startRemix);
  elements.refreshCreditsBtn.addEventListener("click", refreshCreditsUI);
  elements.refreshHistoryBtn.addEventListener("click", loadHistoryUI);
  
  elements.clearLogsBtn.addEventListener("click", () => {
    elements.consoleOutput.innerHTML = "";
    addLog("Console cleared.", "info");
  });

  // Custom event listener for history item deletion
  document.addEventListener('deleteHistoryItem', async (e) => {
    const { timestamp, variantId } = e.detail;
    await deleteHistoryItemUI(timestamp, variantId);
  });
}

// File upload with logging
async function handleFileUploadWithLog(file, trackId) {
  return await handleFileUpload(file, trackId, addLog);
}

// UI Update Functions
async function refreshCreditsUI() {
  const credits = await refreshCredits(addLog);
  if (credits !== null) {
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
  const success = await deleteHistoryItem(timestamp, variantId, addLog);
  if (success) {
    loadHistoryUI();
  }
}

// Remix Process
async function startRemix() {
  updateUIForRunning(true);
  
  const success = await startRemixProcess(
    addLog,
    addResult,
    async () => {
      updateUIForRunning(false);
      await refreshCreditsUI();
    },
    (error) => {
      addLog(error, "error");
      updateUIForRunning(false);
    }
  );
  
  if (!success) {
    updateUIForRunning(false);
  }
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
