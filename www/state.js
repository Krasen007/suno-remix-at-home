// State Management Module
import { saveHistoryToLocalStorage, loadHistoryFromLocalStorage, mergeHistoryData } from './storage.js';

export const state = {
  tracks: [
    {
      id: Date.now().toString(),  // Use string ID for consistency
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
      state.tracks = JSON.parse(savedTracks);
    }
    state.history = loadHistoryFromLocalStorage();
    state.apiKey = localStorage.getItem("suno_api_key") || '';  // Direct localStorage access
  } catch (e) {
    console.warn("Failed to parse saved state, falling back to default", e);
  }
}

export function saveState() {
  localStorage.setItem("suno-tracks", JSON.stringify(state.tracks));
}

export function setApiKey(apiKey) {
  state.apiKey = apiKey;
  localStorage.setItem("suno_api_key", apiKey);  // Direct localStorage access
}

export function setRunning(running) {
  state.isRunning = running;
}

export function addTrack(track = {}) {
  const newTrack = {
    id: Date.now().toString(),  // Use string ID for consistency
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
