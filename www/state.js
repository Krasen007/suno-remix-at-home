// State Management Module
import { saveApiKeyToLocalStorage, loadApiKeyFromLocalStorage, saveHistoryToLocalStorage, loadHistoryFromLocalStorage, mergeHistoryData } from './storage.js';

export const state = {
  tracks: [
    {
      id: Date.now(),
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
    const saved = localStorage.getItem("suno-tracks");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        state.tracks = parsed.filter(t => t && typeof t === 'object' && t.id && t.title !== undefined);
      }
    }
    
    // Load API key from localStorage
    state.apiKey = loadApiKeyFromLocalStorage();
    
    // Load history from localStorage
    state.history = loadHistoryFromLocalStorage();
  } catch (e) {
    console.warn("Failed to parse saved state, falling back to default", e);
  }
}

export function saveState() {
  localStorage.setItem("suno-tracks", JSON.stringify(state.tracks));
}

export function setApiKey(apiKey) {
  state.apiKey = apiKey;
  saveApiKeyToLocalStorage(apiKey);
}

export function setRunning(running) {
  state.isRunning = running;
}

export function addTrack(track = {}) {
  const newTrack = {
    id: Date.now().toString(),
    title: track.title || '',
    url: track.url || '',
    uploadUrl: track.uploadUrl || track.url || '',
    style: track.style || '',
    prompt: track.prompt || '',
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
    Object.assign(track, updates);
    saveState();
  }
}

export function updateHistory(serverHistory) {
  // Merge server history with local history
  state.history = mergeHistoryData(serverHistory, state.history);
  // Save merged history to localStorage
  saveHistoryToLocalStorage(state.history);
}

export function setCredits(credits) {
  state.credits = credits;
}
