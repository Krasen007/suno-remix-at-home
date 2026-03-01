// API Module
import { state, updateHistory, setCredits } from './state.js';

export async function refreshCredits(addLog) {
  try {
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: state.apiKey }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { credits: null, error: `Credits error (${res.status}): ${errText}` };
    }
    const data = await res.json();
    if (data.success) {
      setCredits(data.credits);
      return { credits: data.credits, error: null };
    } else {
      return { credits: null, error: `Failed to fetch credits: ${data.message}` };
    }
  } catch (e) {
    return { credits: null, error: `Network error fetching credits: ${e.message}` };
  }
}

export async function checkServer() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      return { status: "connected", text: "Server: Connected", color: "var(--primary)" };
    } else {
      return { status: "error", text: `Server: Error (${res.status})`, color: "var(--danger)" };
    }
  } catch (e) {
    return { status: "offline", text: "Server: Offline", color: "var(--danger)" };
  }
}

export async function loadHistory(addLog) {
  try {
    const response = await fetch("/api/history");
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load history: ${response.status} - ${errorText}`);
    }
    
    const serverHistory = await response.json();
    
    // Update state with merged history
    updateHistory(serverHistory);
    
    return { history: state.history, error: null };
  } catch (err) {
    addLog(`Failed to load history: ${err.message}`, "error");
    return { history: [], error: err.message };
  }
}

export async function deleteHistoryItem(timestamp, variantId, addLog) {
  if (!confirm("Are you sure you want to delete this specific variant?")) return { success: false, error: "User cancelled deletion" };

  try {
    const url = `/api/history/${timestamp}${variantId ? '/' + variantId : ''}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      addLog("Item deleted from history.", "info");
      return { success: true, error: null };
    } else {
      return { success: false, error: "Failed to delete item" };
    }
  } catch (e) {
    return { success: false, error: `Network error deleting item: ${e.message}` };
  }
}

export async function uploadToGitHub(file, addLog) {
  // GitHub upload functionality removed - use any public hosting service
  addLog("GitHub upload removed. Please use any public hosting service (Dropbox, Google Drive, personal website, etc.) and paste the URL directly.", "error");
  return null;
}

// Parse SSE stream data
function parseSSEStream(reader, onLog, onResult, onDone) {
  const decoder = new TextDecoder();
  let sseBuffer = "";

  function processLine(line) {
    if (line.startsWith("data: ")) {
      try {
        const data = JSON.parse(line.substring(6));
        if (data.type === "log") {
          onLog(data.message, data.level);
        } else if (data.type === "result") {
          onResult(data);
        } else if (data.type === "done") {
          onLog("Remix session complete!", "success");
          onDone();
        }
      } catch (e) {
        onLog(`SSE parse error: ${e.message}`, "error");
      }
    }
  }

  return async function() {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.trim()) processLine(line);
        }
      }
    } catch (err) {
      onLog(`Connection error: ${err.message}`, "error");
      throw err;
    }
  };
}

export async function startRemixSession(tracks, onLog, onResult, onDone, onError) {
  try {
    const response = await fetch("/api/remix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks, apiKey: state.apiKey }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMessage = `Server error: ${response.status} - ${errorBody}`;
      onLog(errorMessage, "error");
      onError(errorMessage);
      return false;
    }

    const reader = response.body.getReader();
    const processStream = parseSSEStream(reader, onLog, onResult, onDone);
    await processStream();
    
    return true;
  } catch (err) {
    onLog(`Connection error: ${err.message}`, "error");
    onError(err.message);
    return false;
  }
}
