// API Interactions Module
import { state, setCredits } from './state.js';

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
      addLog(`Credits error (${res.status}): ${errText}`, "error");
      return;
    }
    const data = await res.json();
    if (data.success) {
      setCredits(data.credits);
      return data.credits;
    } else {
      addLog(`Failed to fetch credits: ${data.message}`, "error");
    }
  } catch (e) {
    addLog("Network error fetching credits. Is server running?", "error");
  }
  return null;
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
    const res = await fetch("/api/history");
    if (!res.ok) {
      addLog(`History error (${res.status})`, "error");
      return { error: true, message: `History error (${res.status})` };
    }
    const history = await res.json();
    return history;
  } catch (e) {
    console.error("Failed to load history", e);
    addLog("Network error loading history.", "error");
    return { error: true, message: "Network error loading history." };
  }
}

export async function deleteHistoryItem(timestamp, variantId, addLog) {
  if (!confirm("Are you sure you want to delete this specific variant?")) return false;

  try {
    const url = `/api/history/${timestamp}${variantId ? '/' + variantId : ''}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      addLog("Item deleted from history.", "info");
      return true;
    } else {
      addLog("Failed to delete item.", "error");
      return false;
    }
  } catch (e) {
    addLog("Network error deleting item.", "error");
    return false;
  }
}

export async function uploadToGitHub(file, addLog) {
  try {
    const res = await fetch("/api/upload-to-github", {
      method: "POST",
      headers: {
        "X-Filename": encodeURIComponent(file.name),
        "Content-Type": "application/octet-stream"
      },
      body: file
    });

    if (!res.ok) {
       const errText = await res.text();
       let msg = `Error ${res.status}`;
       try { msg = JSON.parse(errText).message || msg; } catch(e) { console.debug("Could not parse error response as JSON"); }
       throw new Error(msg);
    }

    const data = await res.json();
    if (data.success) {
      addLog(`Uploaded! Raw URL: ${data.url}`, "success");
      return data.url;
    } else {
      addLog(`Upload failed: ${data.message}`, "error");
      return null;
    }
  } catch (err) {
    addLog(`Upload error: ${err.message}`, "error");
    return null;
  }
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
      return;
    }

    const reader = response.body.getReader();
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
    addLog(`Connection error: ${err.message}`, "error");
    onError(err.message);
  }
}
