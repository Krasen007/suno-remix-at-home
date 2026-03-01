// Local Storage Management for History
export const STORAGE_KEYS = {
  HISTORY: 'suno_remix_history',
  API_KEY: 'suno_api_key'
};

// Save history to localStorage
export function saveHistoryToLocalStorage(history) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
    return false;
  }
}

// Load history from localStorage
export function loadHistoryFromLocalStorage() {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
}

// API key storage removed - use browser localStorage only
// Note: API keys are now managed directly in browser localStorage without this wrapper

// Merge server history with localStorage history
export function mergeHistoryData(serverHistory, localHistory) {
  // Defensive input validation
  const serverArray = Array.isArray(serverHistory) ? serverHistory : [];
  const localArray = Array.isArray(localHistory) ? localHistory : [];
  
  const merged = [...localArray];
  
  // Add server history items that don't exist locally
  serverArray.forEach(serverItem => {
    const exists = merged.some(localItem => 
      Math.abs(localItem.timestamp - serverItem.timestamp) < 1000  // Use 1 second threshold for ms timestamps
    );
    if (!exists) {
      merged.push(serverItem);
    }
  });
  
  // Sort by timestamp (newest first)
  merged.sort((a, b) => b.timestamp - a.timestamp);
  
  // Limit to max entries
  const MAX_ENTRIES = 100;
  return merged.slice(0, MAX_ENTRIES);
}
