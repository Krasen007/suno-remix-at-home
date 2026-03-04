// State Management Module
import {
  saveHistoryToLocalStorage,
  loadHistoryFromLocalStorage,
  mergeHistoryData,
} from "./storage.js";

export const state = {
  tracks: [
    {
      id: Date.now().toString(), // Use string ID for consistency
      title: "",
      url: "",
      style: "",
      prompt: "",
      customMode: true,
      instrumental: false,
    },
  ],
  isRunning: false,
  credits: null,
  apiKey: "",
};

export function loadState() {
  try {
    const savedTracks = localStorage.getItem("suno-tracks");
    if (savedTracks) {
      try {
        const parsed = JSON.parse(savedTracks);
        // Validate that parsed data is an array
        if (Array.isArray(parsed)) {
          state.tracks = parsed;
        } else {
          console.warn("Invalid tracks data format, using empty array");
          state.tracks = [];
        }
      } catch (parseError) {
        console.error("Failed to parse tracks data:", parseError);
        state.tracks = [];
      }
    }

    state.history = loadHistoryFromLocalStorage();

    // API key migration: check for old key name and migrate to new one
    let apiKey = localStorage.getItem("suno_api_key");
    if (!apiKey) {
      // Check for old key name
      const oldKey = localStorage.getItem("suno-api-key");
      if (oldKey) {
        apiKey = oldKey;
        // Migrate to new key name
        localStorage.setItem("suno_api_key", oldKey);
        // Remove old key
        localStorage.removeItem("suno-api-key");
      }
    }
    state.apiKey = apiKey || "";
  } catch (e) {
    console.error("Failed to load state:", e);
    // Set safe defaults
    state.tracks = [];
    state.history = [];
    state.apiKey = "";
  }
}

export function saveState() {
  localStorage.setItem("suno-tracks", JSON.stringify(state.tracks));
}

export function setApiKey(apiKey) {
  state.apiKey = apiKey;
  localStorage.setItem("suno_api_key", apiKey); // Direct localStorage access
}

export function setRunning(running) {
  state.isRunning = running;
}

// Robust ID generator with fallback
let idCounter = 0;
function generateId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    // Fallback for environments without crypto.randomUUID
    idCounter++;
    return `${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function addTrack(track = {}) {
  const newTrack = {
    id: generateId(), // Use robust ID generation
    title: track.title || "",
    url: track.url || "",
    uploadUrl: track.uploadUrl || track.url || "",
    style: track.style || "",
    prompt: track.prompt || "",
    customMode: track.customMode !== false,
    instrumental: track.instrumental === true,
  };
  state.tracks.push(newTrack);
  saveState();
}

export function removeTrack(trackId) {
  if (state.tracks.length <= 1) return;
  state.tracks = state.tracks.filter((t) => t.id !== trackId);
  saveState();
}

export function updateTrack(trackId, updates) {
  const track = state.tracks.find((t) => t.id === trackId);
  if (track) {
    // Prevent overwriting the track's id
    const { id, ...safeUpdates } = updates;
    Object.assign(track, safeUpdates);
    saveState();
  }
}

export function updateHistory(serverHistory) {
  // Ensure state.history is a safe default
  state.history = state.history || [];
  // Merge server history with local history
  state.history = mergeHistoryData(serverHistory, state.history);
  // Save merged history to localStorage
  saveHistoryToLocalStorage(state.history);
}

export function setCredits(credits) {
  state.credits = credits;
}
