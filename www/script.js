// State Management
let state = {
  tracks: JSON.parse(localStorage.getItem("suno-tracks")) || [
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

// DOM Elements
const tracksContainer = document.getElementById("tracks-container");
const consoleOutput = document.getElementById("console-output");
const resultsGrid = document.getElementById("results-grid");
const addTrackBtn = document.getElementById("add-track");
const runBtn = document.getElementById("run-btn");
const creditsBadge = document.getElementById("credits-badge");
const refreshCreditsBtn = document.getElementById("refresh-credits");
const clearLogsBtn = document.getElementById("clear-logs");
const serverStatus = document.getElementById("server-status");

// Initialization
function init() {
  renderTracks();
  refreshCredits();
  checkServer();

  // Event Listeners
  addTrackBtn.addEventListener("click", addTrack);
  runBtn.addEventListener("click", startRemix);
  refreshCreditsBtn.addEventListener("click", refreshCredits);
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

    const titleInput = card.querySelector(".track-title");
    titleInput.value = track.title;
    titleInput.addEventListener("input", (e) =>
      updateTrack(track.id, "title", e.target.value),
    );

    const urlInput = card.querySelector(".track-url");
    urlInput.value = track.url || track.uploadUrl || ""; // Support both schemas
    urlInput.addEventListener("input", (e) =>
      updateTrack(track.id, "url", e.target.value),
    );

    const styleInput = card.querySelector(".track-style");
    styleInput.value = track.style;
    styleInput.addEventListener("input", (e) =>
      updateTrack(track.id, "style", e.target.value),
    );

    const promptInput = card.querySelector(".track-prompt");
    promptInput.value = track.prompt;
    promptInput.addEventListener("input", (e) =>
      updateTrack(track.id, "prompt", e.target.value),
    );

    const customToggle = card.querySelector(".track-custom");
    customToggle.checked = track.customMode;
    customToggle.addEventListener("change", (e) =>
      updateTrack(track.id, "customMode", e.target.checked),
    );

    const instrumentalToggle = card.querySelector(".track-instrumental");
    instrumentalToggle.checked = track.instrumental;
    instrumentalToggle.addEventListener("change", (e) =>
      updateTrack(track.id, "instrumental", e.target.checked),
    );

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
    const data = await res.json();
    if (data.success) {
      state.credits = data.credits;
      creditsBadge.textContent = `Credits: ${data.credits}`;
      creditsBadge.style.color =
        data.credits > 0 ? "var(--primary)" : "var(--danger)";
    }
  } catch (e) {
    addLog("Failed to fetch credits. Is server running?", "error");
  }
}

async function checkServer() {
  try {
    const res = await fetch("/api/credits");
    if (res.ok) {
      serverStatus.textContent = "Server: Connected";
      serverStatus.style.color = "var(--primary)";
    }
  } catch (e) {
    serverStatus.textContent = "Server: Offline";
    serverStatus.style.color = "var(--danger)";
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

function addResult(result) {
  // Clear empty state if first result
  if (resultsGrid.querySelector(".empty-state")) {
    resultsGrid.innerHTML = "";
  }

  const template = document.getElementById("result-template");

  result.variants.forEach((v, i) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".res-title").textContent =
      `${result.title} (v${i + 1})`;
    clone.querySelector(".res-dur").textContent = v.duration || "--";
    clone.querySelector(".res-audio").src = v.audioUrl;
    clone.querySelector(".res-link").href = v.audioUrl;
    resultsGrid.appendChild(clone);
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

      function readChunk() {
        reader.read().then(({ done, value }) => {
          if (done) {
            state.isRunning = false;
            updateUIForRunning(false);
            return;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          lines.forEach((line) => {
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
          });

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
init();
