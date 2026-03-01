// Remix Processing Module
import { state, setRunning } from './state.js';
import { startRemixSession, refreshCredits } from './api.js';

export function validateTracks() {
  // Debug: Log the current tracks state
  console.log('Current tracks:', state.tracks);
  console.log('Tracks details:', state.tracks.map((t, i) => {
    // Check if track has unexpected structure
    const trackKeys = Object.keys(t);
    const hasNumericKeys = trackKeys.some(key => /^\d+$/.test(key));
    
    return {
      index: i,
      trackKeys,
      hasNumericKeys,
      title: t.title,
      url: t.url,
      uploadUrl: t.uploadUrl,
      hasUrl: !!(t.url || t.uploadUrl),
      hasTitle: !!t.title,
      titleType: typeof t.title,
      urlType: typeof t.url
    };
  }));
  
  const validTracks = state.tracks.filter(
    (t) => {
      // More robust validation - check for non-empty strings
      const hasTitle = typeof t.title === 'string' && t.title.trim().length > 0;
      const hasUrl = typeof (t.url || t.uploadUrl) === 'string' && (t.url || t.uploadUrl).trim().length > 0;
      return hasTitle && hasUrl;
    },
  );
  
  console.log('Valid tracks:', validTracks);
  
  if (validTracks.length === 0) {
    return { valid: false, message: "No valid tracks. Please provide a title and URL for at least one track." };
  }
  
  return { valid: true, tracks: validTracks };
}

export async function startRemixProcess(onLog, onResult, onSessionComplete, onConnectionError) {
  if (state.isRunning) return false;

  // First validate API key by checking credits
  if (!state.apiKey) {
    onLog("No API key provided. Please set your Suno API key first.", "error");
    return false;
  }

  // Test API key validity by checking credits
  onLog("Validating API key...", "info");
  const { credits, error } = await refreshCredits(onLog);
  if (error) {
    onLog(`API key validation failed: ${error}`, "error");
    return false;
  }

  const validation = validateTracks();
  if (!validation.valid) {
    onLog(validation.message, "error");
    onLog(`Debug: Found ${state.tracks.length} track(s) in state`, "info");
    state.tracks.forEach((track, i) => {
      const hasUrl = !!(track.url || track.uploadUrl);
      const hasTitle = !!track.title;
      const titleClean = typeof track.title === 'string' ? `"${track.title}"` : `${JSON.stringify(track.title)}`;
      const urlClean = typeof (track.url || track.uploadUrl) === 'string' ? `"${track.url || track.uploadUrl}"` : `${JSON.stringify(track.url || track.uploadUrl)}`;
      const trackKeys = Object.keys(track);
      const hasNumericKeys = trackKeys.some(key => /^\d+$/.test(key));
      
      onLog(`Track ${i + 1}: Title=${titleClean} (${typeof track.title}), URL=${urlClean} (${typeof track.url}) (Valid: ${hasTitle && hasUrl})`, "info");
      if (hasNumericKeys) {
        onLog(`  ⚠️  Track has unusual structure with numeric keys: ${trackKeys.join(', ')}`, "error");
      }
    });
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
    onResult,  // Pass onResult directly
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
