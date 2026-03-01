// State Management Module
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
  } catch (e) {
    console.warn("Failed to parse saved tracks, falling back to default", e);
  }
}

export function saveState() {
  localStorage.setItem("suno-tracks", JSON.stringify(state.tracks));
}

export function addTrack() {
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
}

export function removeTrack(id) {
  if (state.tracks.length <= 1) return;
  state.tracks = state.tracks.filter((t) => t.id !== id);
  saveState();
}

export function updateTrack(id, field, value) {
  const track = state.tracks.find((t) => t.id === id);
  if (track) {
    track[field] = value;
    saveState();
  }
}

export function setRunning(running) {
  state.isRunning = running;
}

export function setCredits(credits) {
  state.credits = credits;
}
