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

// Save API key to localStorage
export function saveApiKeyToLocalStorage(apiKey) {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    return true;
  } catch (error) {
    console.error('Failed to save API key to localStorage:', error);
    return false;
  }
}

// Load API key from localStorage
export function loadApiKeyFromLocalStorage() {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch (error) {
    console.error('Failed to load API key from localStorage:', error);
    return '';
  }
}

// Merge server history with localStorage history
export function mergeHistoryData(serverHistory, localHistory) {
  const merged = [...localHistory];
  
  // Add server history items that don't exist locally
  serverHistory.forEach(serverItem => {
    const exists = merged.some(localItem => 
      Math.abs(localItem.timestamp - serverItem.timestamp) < 1
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
