// State Management
let state = {
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
};

try {
  const saved = localStorage.getItem("suno-tracks");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      state.tracks = parsed.filter(t => t && typeof t === 'object' && t.id && t.title !== undefined);
    }
  }
} catch (e) {
  console.warn("Failed to parse saved tracks, falling back to default", e);
}

// DOM Elements
const tracksContainer = document.getElementById("tracks-container");
const consoleOutput = document.getElementById("console-output");
const resultsGrid = document.getElementById("results-grid");
const addTrackBtn = document.getElementById("add-track");
const runBtn = document.getElementById("run-btn");
const creditsBadge = document.getElementById("credits-badge");
const refreshCreditsBtn = document.getElementById("refresh-credits");
const clearLogsBtn = document.getElementById("clear-logs");
const refreshHistoryBtn = document.getElementById("refresh-history");
const historyGrid = document.getElementById("history-grid");
const serverStatus = document.getElementById("server-status");

// Initialization
function init() {
  renderTracks();
  refreshCredits();
  checkServer();
  loadHistory();

  // Event Listeners
  addTrackBtn.addEventListener("click", addTrack);
  runBtn.addEventListener("click", startRemix);
  refreshCreditsBtn.addEventListener("click", refreshCredits);
  refreshHistoryBtn.addEventListener("click", loadHistory);
  clearLogsBtn.addEventListener("click", () => {
    consoleOutput.innerHTML = "";
    addLog("Console cleared.", "info");
  });
}

// Track Management
function addTrack() {
  state.tracks.push({
    id: Date.now(),
    title: "",
    url: "",
    style: "",
    prompt: "",
    customMode: true,
    instrumental: false,
  });
  saveState();
  renderTracks();
}

function removeTrack(id) {
  if (state.tracks.length <= 1) return;
  state.tracks = state.tracks.filter((t) => t.id !== id);
  saveState();
  renderTracks();
}

function updateTrack(id, field, value) {
  const track = state.tracks.find((t) => t.id === id);
  if (track) {
    track[field] = value;
    saveState();
  }
}

function saveState() {
  localStorage.setItem("suno-tracks", JSON.stringify(state.tracks));
}

function renderTracks() {
  tracksContainer.innerHTML = "";
  const template = document.getElementById("track-template");

  state.tracks.forEach((track, index) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".track-card");

    card.querySelector(".track-index").textContent = `#${index + 1}`;

    const fields = [
      { class: ".track-title", field: "title" },
      { class: ".track-url", field: "url" },
      { class: ".track-style", field: "style" },
      { class: ".track-prompt", field: "prompt" },
      { class: ".track-custom", field: "customMode", type: "checkbox" },
      { class: ".track-instrumental", field: "instrumental", type: "checkbox" },
    ];

    fields.forEach((f) => {
      const input = card.querySelector(f.class);
      const label = input.closest(".form-group")?.querySelector("label") || 
                    input.closest(".checkbox-label");
      const uniqueId = `track-${track.id}-${f.field}`;
      
      input.id = uniqueId;
      if (label && label.tagName === "LABEL") {
        label.setAttribute("for", uniqueId);
      }

      if (f.type === "checkbox") {
        input.checked = track[f.field];
        input.addEventListener("change", (e) =>
          updateTrack(track.id, f.field, e.target.checked),
        );
      } else {
        input.value = track[f.field] || (f.field === "url" ? track.url : "") || "";
        input.addEventListener("input", (e) =>
          updateTrack(track.id, f.field, e.target.value),
        );
      }
    });

    // Handle GitHub Upload
    const uploadBtn = card.querySelector(".upload-btn");
    const fileInput = card.querySelector(".file-input");
    const urlInput = card.querySelector(".track-url");

    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";
      addLog(`Uploading ${file.name} to GitHub...`, "info");

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
           try { msg = JSON.parse(errText).message || msg; } catch(e) {}
           throw new Error(msg);
        }

        const data = await res.json();
        if (data.success) {
          addLog(`Uploaded! Raw URL: ${data.url}`, "success");
          updateTrack(track.id, "url", data.url);
          urlInput.value = data.url;
        } else {
          addLog(`Upload failed: ${data.message}`, "error");
        }
      } catch (err) {
        addLog(`Upload error: ${err.message}`, "error");
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "📤 Upload";
        fileInput.value = "";
      }
    });

    card
      .querySelector(".remove-track")
      .addEventListener("click", () => removeTrack(track.id));

    tracksContainer.appendChild(clone);
  });
}

// API Interactions
async function refreshCredits() {
  try {
    const res = await fetch("/api/credits");
    if (!res.ok) {
      const errText = await res.text();
      addLog(`Credits error (${res.status}): ${errText}`, "error");
      return;
    }
    const data = await res.json();
    if (data.success) {
      state.credits = data.credits;
      creditsBadge.textContent = `Credits: ${data.credits}`;
      creditsBadge.style.color =
        data.credits > 0 ? "var(--primary)" : "var(--danger)";
    } else {
      addLog(`Failed to fetch credits: ${data.message}`, "error");
    }
  } catch (e) {
    addLog("Network error fetching credits. Is server running?", "error");
  }
}

async function checkServer() {
  try {
    const res = await fetch("/api/credits");
    if (res.ok) {
      serverStatus.textContent = "Server: Connected";
      serverStatus.style.color = "var(--primary)";
    } else {
      serverStatus.textContent = `Server: Error (${res.status})`;
      serverStatus.style.color = "var(--danger)";
    }
  } catch (e) {
    serverStatus.textContent = "Server: Offline";
    serverStatus.style.color = "var(--danger)";
  }
}

async function loadHistory() {
  try {
    const res = await fetch("/api/history");
    if (!res.ok) {
      addLog(`History error (${res.status})`, "error");
      historyGrid.innerHTML = '<div class="empty-state">Unable to load history.</div>';
      return;
    }
    const history = await res.json();
    historyGrid.innerHTML = "";
    if (history.length === 0) {
      historyGrid.innerHTML = '<div class="empty-state">No past remixes found.</div>';
    } else {
      history.forEach((item) => addResult(item, historyGrid));
    }
  } catch (e) {
    console.error("Failed to load history", e);
    historyGrid.innerHTML = '<div class="empty-state">Network error loading history.</div>';
  }
}

function addLog(message, level = "info") {
  const log = document.createElement("div");
  log.className = `log ${level}`;
  const time = new Date().toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  log.textContent = `[${time}] ${message}`;
  consoleOutput.appendChild(log);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function addResult(result, container = resultsGrid) {
  // Clear empty state if first result
  if (container.querySelector(".empty-state")) {
    container.innerHTML = "";
  }

  const template = document.getElementById("result-template");

  result.variants.forEach((v, i) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".res-title").textContent =
      `${result.title} (v${i + 1})`;
    clone.querySelector(".res-dur").textContent = v.duration || "--";
    
    // Prioritize local URL for playback if it exists
    clone.querySelector(".res-audio").src = v.localUrl || v.audioUrl;
    clone.querySelector(".res-link").href = v.audioUrl;

    // Display cover art
    const img = clone.querySelector(".res-image");
    const imageUrl = v.imageUrl || (result.images && result.images[i]) || (result.images && result.images[0]);
    if (imageUrl) {
      img.src = imageUrl;
      img.classList.remove("hidden");
    }

    container.appendChild(clone);
  });
}

function startRemix() {
  if (state.isRunning) return;

  const validTracks = state.tracks.filter(
    (t) => (t.url || t.uploadUrl) && t.title,
  );
  if (validTracks.length === 0) {
    addLog(
      "No valid tracks. Please provide a title and URL for at least one track.",
      "error",
    );
    return;
  }

  state.isRunning = true;
  updateUIForRunning(true);
  addLog("Starting remix session...", "info");

  // Start fetch POST for SSE
  fetch("/api/remix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tracks: validTracks.map((t) => ({
        uploadUrl: t.url || t.uploadUrl,
        title: t.title,
        style: t.style,
        prompt: t.prompt,
        customMode: t.customMode,
        instrumental: t.instrumental,
      })),
    }),
  })
    .then((response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      function processLine(line) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === "log") {
              addLog(data.message, data.level);
            } else if (data.type === "result") {
              addResult(data);
            } else if (data.type === "done") {
              addLog("Remix session complete!", "success");
              refreshCredits();
            }
          } catch (e) {
            // Skip non-json lines
          }
        }
      }

      function readChunk() {
        reader.read().then(({ done, value }) => {
          if (done) {
            // Process any remaining partial line
            if (sseBuffer && sseBuffer.startsWith("data: ")) {
               processLine(sseBuffer);
            }
            state.isRunning = false;
            updateUIForRunning(false);
            return;
          }

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          
          // Keep the last segment in buffer (it might be incomplete)
          sseBuffer = lines.pop();

          lines.forEach(processLine);
          readChunk();
        });
      }

      readChunk();
    })
    .catch((err) => {
      addLog(`Connection error: ${err.message}`, "error");
      state.isRunning = false;
      updateUIForRunning(false);
    });
}

function updateUIForRunning(running) {
  runBtn.disabled = running;
  runBtn.querySelector(".btn-text").textContent = running
    ? "Processing..."
    : "Start Remixing";
  runBtn.querySelector(".loader-dots").classList.toggle("hidden", !running);
  document
    .querySelectorAll(".remove-track, #add-track, input, textarea")
    .forEach((el) => {
      el.disabled = running;
    });
}

// Run App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
