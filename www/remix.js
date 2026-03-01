// Remix Processing Module
import { state, setRunning } from './state.js';
import { startRemixSession } from './api.js';

export function validateTracks() {
  const validTracks = state.tracks.filter(
    (t) => (t.url || t.uploadUrl) && t.title,
  );
  
  if (validTracks.length === 0) {
    return { valid: false, message: "No valid tracks. Please provide a title and URL for at least one track." };
  }
  
  return { valid: true, tracks: validTracks };
}

export async function startRemixProcess(onLog, onResult, onSessionComplete, onConnectionError) {
  if (state.isRunning) return false;

  const validation = validateTracks();
  if (!validation.valid) {
    onLog(validation.message, "error");
    return false;
  }

  setRunning(true);
  onLog("Starting remix session...", "info");

  const tracks = validation.tracks.map((t) => ({
    uploadUrl: t.url || t.uploadUrl,
    title: t.title,
    style: t.style,
    prompt: t.prompt,
    customMode: t.customMode,
    instrumental: t.instrumental,
  }));

  const success = await startRemixSession(
    tracks,
    onLog,
    onResult,
    () => {
      setRunning(false);
      onSessionComplete();
    },
    (error) => {
      setRunning(false);
      onConnectionError(error);
    }
  );

  if (!success) {
    setRunning(false);
  }

  return success;
}
